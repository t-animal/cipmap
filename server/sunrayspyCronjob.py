#!/usr/bin/env python2.7

from python_crontab.crontab import CronTab
import os,sys

if len(sys.argv) == 1 or sys.argv[1] not in ["start", "stop", "reset"]:
	print "Usage: {} {{start|stop|reset}} [interval=1]".format(sys.argv[0])
	sys.exit(1)

interval = 1
try:
	if len(sys.argv) == 3:
		interval = int(sys.argv[2])
except ValueError:
	print "Interval must be an int"
	sys.exit(1)


crontab = CronTab()

job = crontab.find_comment("Sunrayspy for the cipmap website")

if len(job) == 0:
	job = crontab.new(command = "cd {}; ./sunrayspy.sh;".format(os.getcwd()),
				comment = "Sunrayspy for the cipmap website")
	job.minute.every(interval)
else:
	if sys.argv[1] == "start":
		print "Warning: An old job was found. Reusing it. To change interval use reset"
	if len(job) > 1:
		print "Warning: Multiple jobs matched. Please adjust crontab by hand"
	job = job[0]

if sys.argv[1] == "stop":
	job.enable(False)
elif sys.argv[1] == "reset":
	job.minute.every(interval)
	job.enable()
elif sys.argv[1] == "start":
	job.enable()

crontab.write()

print "Crontab successfully altered"
print job
