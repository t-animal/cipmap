#!/usr/bin/env python2.7

import sys
import os
import socket
import time
import re
import logging
import datetime
from subprocess import Popen, PIPE, STDOUT


optedInUsers = []
sunwutCommand = ""
def main(argv):

	logger = logging.getLogger()
	logger.setLevel(logging.DEBUG)
	# create file handler which logs even debug messages
	fh = logging.FileHandler('spam.log')
	fh.setLevel(logging.DEBUG)
	# create console handler with a higher log level
	ch = logging.StreamHandler()
	ch.setLevel(logging.WARNING)
	# create formatter and add it to the handlers
	formatter = logging.Formatter('%(asctime)s - %(levelname)-8s - %(message)s')
	fh.setFormatter(formatter)
	ch.setFormatter(formatter)
	# add the handlers to the logger
	logger.addHandler(fh)
	logger.addHandler(ch)
	
	logger.info("Program started")
	
	global optedInUsers, sunwutCommand
	with open("optedInUsers") as f:
		optedInUsers += f.read().splitlines()
	
	print optedInUsers
	
        s = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("", 1338))
        s.listen(5)
        
        while True:
                conn, addr = s.accept()
                start = datetime.datetime.now()
                
                logger.info("Connection from {} initiated".format(str(addr[0])))
                logString = "Connection from {}:".format(str(addr[0]))

                try:
			resource, callback, username = readHeader(conn)
			
		        if isAllowed(addr):
		                logString += " access granted"
		                
				if resource == "" or resource == "getData":
					logString += ", cipmap data transferred"
					passOnCipData(conn, callback)
					
				elif resource == "optIn":
					logString +=  ", opt-in handled"
					validateOptIn(conn, callback, username)
			
		                
		        else:
		                logString +=  " access refused"
	               		refuseConnection(conn, callback)
                
		except Exception as e:
			conn.close()
			
			end = datetime.datetime.now()
			logger.exception(logString+". Exception {} after {}: {}".format(type(e).__name__, end-start, str(e)))
			
			continue
		
		end = datetime.datetime.now()
		logger.info(logString+". It took {}".format(end-start))
                conn.close()

def readHeader(conn):
	header = conn.recv(1024).split("\n")[0]
	
	resource = header[header.find("/")+1:header.find("?")]
	
	callback = header[header.find("callback=")+9:]
	callback = callback[:callback.find("&")]
	
	username = header[header.find("username=")+9:]
	username = username[:username.find("&")]
	
	return resource, callback, username

def validateOptIn(conn, callback, requestedName):
	peer = conn.getpeername()
	ip, port = peer[0], peer[1]
	
	sendString = callback+"("
	
	if not isAllowed((ip, port), ciponly=True):
		refuseConnection(conn, callback);
		conn.close()
		return		
	else:	
		username = ""
		try:
			s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
			s.connect((ip, 113))
			s.send(str(port)+", 1338\n")
			answer = s.recv(1024)
			s.close()
		
			if "ERROR" in answer:
				#uhoh... dunno what is happening. better close silently
				logging.getLogger().warning("Opt-In: ERROR from auth in connection from {}".format(ip))
				conn.close()
				return
			
			userid = answer[answer.rfind(":")+1:-2]
			p = Popen("getent passwd "+userid, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
			username = p.stdout.read()
			username = username[:username.find(":")]
		
			if username == requestedName:
				global optedInUsers
				if username in optedInUsers:
					sendString += """{"error":"User has already opted in"}"""
				else:
					sendString += """{"success":true}"""
					optedInUsers.append(username)
					os.system("echo {} >> optedInUsers".format(username))
			elif username == "proxy":
				sendString += """{"error":"Please disable wwwproxy or use firefox"}"""
			else:
				sendString += """{"error":"Ident reports different username"}"""
				logging.getLogger().warning("Opt-In: Username differed: input:{}, real:{}".format(requestedName, username))
	
			sendString += ");"
		
		except socket.error as e:
			sendString += """{"error":"Could not connect to ident server (IPv4 only!)"});"""
		
        conn.send("""HTTP/1.1 200 OK\r
Content-Length: {}\r
Connection: close\r
Content-Type: application/json\r\n\r\n{}""".format(len(sendString), sendString))

def passOnCipData(conn, callback):	
	global optedInUsers, sunwutCommand
	s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("localhost", 1339))
        	        
        data = s.recv(1024)
        
        sendString = callback+"({"
        while data:
                tokens = data.split("\n\n")
                
                for token in tokens[:-1]:
                	machineRegex = re.compile(r"([\w\d]+)\.informatik\.uni-erlangen\.de \((.*)\)")
		        personRegex = re.compile(r"([\w\d]{8}) \((.*)\) ?(.*)")
        
                        m = machineRegex.search(token)
                        
	                m2 = personRegex.search(token)
	                sendString = sendString+""""{0}":{{
\t"information":"{1}",
\t"occupied":{4},
\t"personname":"{2}",
\t"persongroup":"{3}" }},\n""".format(   m.group(1),
				 m.group(2),
				 "" if not m2 or m2.group(1) not in optedInUsers else m2.group(1),
				 "" if not m2 or m2.group(1) not in optedInUsers else m2.group(2),
				 "true" if m2 else "false")
		
                
                data = tokens[-1]+s.recv(1024)
        
        #TODO:Filter global opt-out
        #get information on sunrays independently from the cipmap: this is more reliable!
        for filename in ["users.faui0sr0","users.faui0sr1","users.faui0sr2","users.faui01"]:
		with open(filename) as f:
			timestamp = f.readline()
			if timestamp == "":
				continue
			
			informationAge = int(time.mktime(time.localtime())-int(timestamp))
						
			for (sunray, username) in [line.split(" ") for line in f.read().splitlines()]:
				sendString = sendString+""""Sunray{0}":{{
\t"information":"{1}",
\t"occupied":{4},
\t"personname":"{2}",
\t"persongroup":"{3}" }},\n""".format(   sunray,
					 "Information on 1 users was last gathered {}s ago!".format(informationAge),
					 "" if username not in optedInUsers else username,
					 "",
					 "true")
        
        sendString = sendString.strip(",\n")+"\n});"
        s.close()
        
        conn.send("""HTTP/1.1 200 OK\r
Content-Length: {}\r
Connection: close\r
Content-Type: application/json\r\n\r\n{}""".format(len(sendString), sendString))


def refuseConnection(conn, callback):
        conn.send("""HTTP/1.1 200 OK\rContent-Length: {}\r\n\r
/**********************************************
 *                  ERROR                     *
 * Only accessible via the university network.*
 **********************************************/
 
 {}({{"error":"The data displayed on this site is only accessible via the university network"}});""".format(288+len(callback),callback));


def isAllowed(addr, ciponly=False):
	ip = None
        if addr[0].count("."):
                #ipv4
                if addr[0].count(":"):
                	#ipv6 tunnel
                	ip = map(int, addr[0][addr[0].rfind(":")+1:].split("."))
                else:
	                ip = map(int,addr[0].split("."))
        else:
                #ipv6
                address = addr[0]
                if address.count("::"):
                        #have to extend address
                        rep = ":"
                        for i in range(0,7-addr[0].count(":")+1):
                                rep = rep + "0:"
                        
                        address = address.replace("::", rep).strip(":")
                        
                ip=map(lambda x: int(x,16), address.split(":"))
        
	ipv4ranges = [
		( 8,127,  0,0, 0), #localhost
		( 8, 10,  0,0, 0), #private
		(12,172, 16,0, 0), #private
		(16,192,168,0, 0), #private
		(16,131,188,0, 0), #cip
		(16,141, 67,0, 0), #mediziner
		(24,192, 44,0, 0), #fraunhofer
		(24,192,129,10,0), #wlan
		(24,192,129,11,0), #wlan
		(24,192,129,12,0)] #wlan
	
	ipv6ranges = [
		(45, 0x2001,0x638,0xA000,0,0,0,0,0), #cip (only?!)
		(48, 0x2001,0x638,0x0A00,0,0,0,0,0),
		(48, 0x2001,0x638,0xA001,0,0,0,0,0),
		(128, 0,    0,    0,     0,0,0,0,1)]
	
	
	if ciponly:
		ipv4ranges = [
		(16,131,188,0, 0)] #cip
		ipv6ranges = [
		(45, 0x2001,0x638,0xA000,0,0,0,0,0)] #cip (only?!)
		
	
	authorized = False
	ipranges = None
	partlength = None
	partmask = None
	
	if len(ip) == 4:
		ipranges = ipv4ranges
		partlength = 8
		partmask = 0xFF
	else:
		ipranges = ipv6ranges
		partlength = 16
		partmask = 0xFFFF
	
	for iprange in ipranges:
		for i in range(0,len(ip)):
		
			#Oktett/Hextett maskieren, wenn nur teilweise zur Netzadresse gehoerig
			if (i+1) * partlength > iprange[0]:
				ip[i] = ip[i] & (partmask << (((i+1) * partlength - iprange[0])))
						
			if iprange[i+1] ^ ip[i]:
				#Ip gehoert nicht zum Range
				break
			
		else: #for-else!
			#alle Oktette/Hextette ueberprueft
			authorized = True
		
		if authorized:
			break
	
	return authorized


if __name__ == "__main__":
        sys.exit(main(sys.argv))
