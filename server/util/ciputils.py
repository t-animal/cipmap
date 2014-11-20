from functools import wraps

from flask import request, abort

def onlyFromIntranet(f, *args, **kwargs):
	@wraps(f)
	def fOnlyFromIntranet(*args, **kwargs):
		if(isAllowed(request.remote_addr, False)):
			return f(*args, **kwargs)
		else:
			abort(403)
	
	return fOnlyFromIntranet

def onlyFromCIP(f, *args, **kwargs):
	@wraps(f)
	def fOnlyFromCIP(*args, **kwargs):
		if(isAllowed(request.remote_addr, True)):
			return f(*args, **kwargs)
		else:
			abort(403)
	
	return fOnlyFromCIP

def isAllowed(address, ciponly=False):
	ip = None
        if address.count("."):
                #ipv4
                if address.count(":"):
                	#ipv6 tunnel
                	ip = map(int, address[address.rfind(":")+1:].split("."))
                else:
	                ip = map(int,address.split("."))
        else:
                #ipv6
                if address.count("::"):
                        #adresse erweitern
                        rep = ":"
                        for i in range(0,7-address.count(":")+1):
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

