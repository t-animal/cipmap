#!/usr/bin/env python

import re
import sys
import socket
import datetime
import time
import threading
import subprocess

class Collector:

        def __init__(self, hostname):
                self.hostname = hostname
                self.userInformation = ""
                self.updated = None
                self.error = False

        def __repr__(self):
                return "Collector for {}.informatik.uni-erlangen.de".format(self.hostname)

        def _printTimeDelta(self, tdelta):
                seconds = int(tdelta.total_seconds())

                years = int(seconds/365/24/60/60)
                days = int(seconds/24/60/60)%356
                hours = int(seconds/60/60)%24
                minutes = int(seconds/60)%60
                seconds = seconds%60

                string = ""
                fallthrough = False

                if fallthrough or not years == 0:
                        string += "{}y ".format(years)
                        fallthrough = True
                if fallthrough or not days == 0:
                        string += "{}d ".format(days)
                        fallthrough = True
                if fallthrough or not hours == 0:
                        string += "{}h ".format(hours)
                        fallthrough = True
                if fallthrough or not minutes == 0:
                        string += "{}m ".format(minutes)

                string += "{}s".format(seconds)

                return string

        def toString(self):
                string = "{}.informatik.uni-erlangen.de ".format(self.hostname)

                tdelta = (datetime.datetime.now() - self.updated)

                if self.error:
                        string += "(Host was never reached since {})\n\n".format(self._printTimeDelta(tdelta))
                        return string

                outdated = ""
                if tdelta.total_seconds() > 30 * 60:
                        outdated = " and is probably outdated"

                string += "(Information on 1 users was last gathered {} ago{})\n".\
                                format(self._printTimeDelta(tdelta), outdated)

                if len(self.userInformation) == 3:
                        string += "{} ({}) {}\n\n".format(self.userInformation[0], self.userInformation[1], self.userInformation[2])
                else:
                        string += "\n"

                return string

        def collect(self):
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(1)

                try:
                        s.connect((self.hostname, 666))

                        #666 is a privileged port, so we can trust the input... i think
                        #the first 4 byte seem to be bogus (3 times 0 and then some arbitrary number)
                        #sometimes recv returns after these four byte
                        self.userInformation = s.recv(1024)
                        self.userInformation += s.recv(1024)

                        #for byte in bytearray(self.userInformation[:4]):
                        #        print "--"+str(byte)+"--"

                        if len(self.userInformation) > 0:
                                self.userInformation = self.userInformation.strip()
                                self.userInformation = self.userInformation.split("\t")

                        self.updated = datetime.datetime.now()
                        self.error = False

                except (socket.error, socket.gaierror, socket.herror, socket.timeout):

                        self.error = True
                        if self.updated == None:
                                self.updated = datetime.datetime.now()
                finally:
                        s.close()

        run = collect

#why THE FUCK is there no thread pool in python?
class ThreadPool():
        threads = []

        class workerThread(threading.Thread):
                def __init__(self, queueSemaphore):
                        threading.Thread.__init__(self)
                        self.daemon=True

                        self.runSemaphore = threading.Semaphore(0)
                        self.queueSemaphore = queueSemaphore

                        self.start()

                def setWorkAndRun(self, queue):
                        self.queue = queue
                        self.blockingTPSemaphore = threading.Semaphore(0)
                        self.runSemaphore.release()

                def run(self):
                        while True:
                                self.runSemaphore.acquire()
                                while True:
                                        self.queueSemaphore.acquire()
                                        if len(self.queue) == 0:
                                                self.queueSemaphore.release()
                                                break
                                        else:
                                                fakeThread = self.queue.pop()
                                                self.queueSemaphore.release()

                                                fakeThread.run()
                                self.blockingTPSemaphore.release()

        def __init__(self, threadCount = 5):
                queueSemaphore = threading.Semaphore()

                for i in range(0, threadCount):
                        self.threads.append(ThreadPool.workerThread(queueSemaphore))

        def run(self, workerObjects, blocking = False):
                queue = list(workerObjects)

                for thread in self.threads:
                        thread.setWorkAndRun(queue)

                if blocking:
                        for thread in self.threads:
                                thread.blockingTPSemaphore.acquire()

class collectorCoordinator(threading.Thread):
        def __init__(self, collectors, threadCount=20, sleepTime=30):
                threading.Thread.__init__(self)
                self.daemon=True

                self.collectors = collectors
                self.sleepTime = sleepTime

                self.tp = ThreadPool(threadCount)
                self.tp.run(collectors, True)

        def run(self):
                while True:
                        self.tp.run(self.collectors, True)
                        time.sleep(self.sleepTime)

def getHostnameList():
        hostnames = []

        machineRegex = re.compile(r"([\w\d]+)\.informatik\.uni-erlangen\.de.*")

        data = subprocess.check_output(["getent", "netgroup", "icipmap"])

        lines = data.split()

        for line in lines[:-1]:
                m = machineRegex.search(line)

                if not m == None:
                        hostnames.append(m.group(1))

        return hostnames

def main(argv=[]):
        hostnames = getHostnameList()

        collectors = [Collector(host) for host in hostnames]

        print "Setting up collectors, this may take some seconds. Please wait."
        cc = collectorCoordinator(collectors, 20, 30)
        cc.start()

        try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                s.bind(("localhost", 1339))
                s.listen(5)

                print "Setup done, serving..."
                while True:
                        serversock, serverport = s.accept()
                        try:
		                for collector in collectors:
		                        serversock.send(collector.toString())
                        except socket.error:
                        	pass
                        finally:
	                        serversock.close()
        except KeyboardInterrupt:
                s.close()
                raise KeyboardInterrupt()

if __name__ == "__main__":
        try:
                main(sys.argv)
        except KeyboardInterrupt:
                print "Exiting"
