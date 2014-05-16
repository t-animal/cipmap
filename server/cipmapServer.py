#!./env/bin/python2.7

import sys
import os
import socket
import time
import re
import logging
import datetime
from subprocess import Popen, PIPE, STDOUT

from flask import Flask, request, render_template, Response, json
from util import ciputils

class CipmapServer(Flask):

	def __init__(self, *args, **kwargs):
		super(CipmapServer, self).__init__(*args, **kwargs)
		
		self.optedInUsers = []
		with open("data/optedInUsers") as f:
			self.optedInUsers += f.read().splitlines()
		
		formatter = logging.Formatter('%(asctime)s - %(name)-5.5s:%(levelname)-8s - %(message)s')
		wlog = logging.getLogger("werkzeug")
		alog = self.logger
		
		wlog.setLevel(logging.WARNING)
		alog.setLevel(logging.DEBUG)
		
		#remove all handlers from werkzeug, we set our own
		for handler in wlog.handlers:
			wlog.removeHandler(handler)
		
		#create a stdout handler
		streamHandler = logging.StreamHandler()
		streamHandler.setFormatter(formatter)
		alog.addHandler(streamHandler)
		wlog.addHandler(streamHandler)
				
		# create file handler which logs debug messages
		fileHandler = logging.FileHandler('spam.log')
		fileHandler.setFormatter(formatter)
		fileHandler.setLevel(logging.DEBUG)
		alog.addHandler(fileHandler)
		wlog.addHandler(fileHandler)

		#log some info on stdout and after that only print warnings
		self.logger.info("Program started")
		self.logger.info("Opted-in users:"+str(self.optedInUsers))
		self.logger.info("Only logging warnings to console after now")
		streamHandler.setLevel(logging.WARNING)

app = CipmapServer(__name__)

@app.before_request
def requestLogger():
	#Uncomment to conform to former log style, but no longer needed as we use werkzeug now
        #app.logger.info("Connection from {} initiated".format(request.remote_addr))
        pass

@app.route("/optIn")
@ciputils.onlyFromCIP
def validateOptIn():
	response = dict()
	requestedName = request.args.get("username", None)
	
	if not requestedName:
		response["error"] = "Please provide a username"
	else:
		try:
			#identd
			s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
			s.connect((request.remote_addr, 113))
			s.send(str(request.environ["REMOTE_PORT"])+", 1338\n")
			answer = s.recv(1024)
			s.close()
	
			if "ERROR" in answer:
				#uhoh... dunno what is happening. better close silently
				app.logger.warning("Opt-In: ERROR from auth in connection from {}".format(ip))
				abort(500)
		
			userid = answer[answer.rfind(":")+1:-2]
		
			#normally not a good idea, but userid comes from a privileged (ie CIP-admin controled) port
			p = Popen("getent passwd "+userid, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
			username = p.stdout.read()
			username = username[:username.find(":")]
	
			if username == requestedName:
				if username in app.optedInUsers:
					response["error"] = "User has already opted in"
				else:
					response["success"]="true"
					app.optedInUsers.append(username)
					os.system("echo {} >> data/optedInUsers".format(username))
			
			elif username == "proxy":
				response["error"] = "Please disable wwwproxy (should already be disabled in Firefox)"
		
			else:
				response["error"] = "Ident reports differing username"
				app.logger.warning("Opt-In: Username differed: input:{}, real:{}".format(requestedName, username))
	
		except socket.error as e:
			response["error"] = "Could not connect to ident server (IPv4 only!)"
	
        app.logger.info("Connection from {} access granted, opt-in handled".format(request.remote_addr))
        return Response("{}({});".format(request.args.get("callback", "default"), json.dumps(response)), mimetype="application/json")
	
	

@app.route("/getData")
@app.route("/")
@ciputils.onlyFromIntranet
def passOnCipData():
	s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("localhost", 1339))
        	        
        data = s.recv(1024)
        
        machines = dict()
        while data:
                tokens = data.split("\n\n")
                
                for token in tokens[:-1]:
                	machineRegex = re.compile(r"(?P<hostname>[\w\d]+)\.informatik\.uni-erlangen\.de \((?P<hostinfo>.*)\)")
		        personRegex = re.compile(r"(?P<login>[\w\d]{8}|[\w]{4,}) \((?P<group>.*)\) ?(.*)")
        
                        m = machineRegex.search(token)
	                p = personRegex.search(token)
	                
	                machines[m.group("hostname")] = {"information": m.group("hostinfo"), 
	                				 "occupied": True if p else False,
	                				 "personname": p.group("login") if p and p.group("login") in app.optedInUsers else "",
	                				 "persongroup": p.group("group") if p and p.group("login") in app.optedInUsers else ""}
	              
                data = tokens[-1]+s.recv(1024)
        
        #TODO:Filter global opt-out
        #get information on sunrays independently from the cipmap: this is more reliable!
        for filename in ["data/users.faui0sr0","data/users.faui0sr1","data/users.faui0sr2","data/users.faui01"]:
		with open(filename) as f:
			timestamp = f.readline()
			if timestamp == "":
				continue
			
			informationAge = int(time.mktime(time.localtime())-int(timestamp))
						
			for (sunray, username) in [line.split(" ") for line in f.read().splitlines()]:
				machines["Sunray"+sunray] = {"information": "Information on 1 users was last gathered {}s ago!".format(informationAge),
							     "occupied": True,
							     "personname": "" if username not in app.optedInUsers else username,
							     "persongroup": ""}
        
        s.close()
        
        app.logger.info("Connection from {} access granted, cipmap data transferred".format(request.remote_addr))
        return Response("{}({});".format(request.args.get("callback", "default"), json.dumps(machines)), mimetype="application/json")


@app.errorhandler(500)
def serverError(error):
	return render_template("servererror.tpl"), 500

@app.errorhandler(403)
def refuseConnection(error):
        app.logger.info("Connection from {} access refused".format(request.remote_addr))
        return Response(render_template("blocked.tpl", callback=request.args.get("callback", "default")),
        		 status=403, mimetype="application/json")


if __name__ == "__main__":
        app.run(host='::', port=1338)
