#!../env/bin/python2.7

import datetime
import urllib2

from bs4 import BeautifulSoup

class UNIVISRoom():
	_BASE_URL = "https://univis.uni-erlangen.de/prg?search=lectures&show=xml&room="

	def __init__(self, *roomNos):
		self.lectures = set()

		for roomNo in roomNos:
			f = urllib2.urlopen(self._BASE_URL+roomNo)
			self._parsexml(f, roomNo)

	def _parsexml(self, xml, roomNo):
		bs = BeautifulSoup(xml)

		roomKey = None
		#first find this room's key
		for room in bs.univis.find_all("room", recursive=False):
			if room.short.text == roomNo:
				roomKey = room['key']

		for lecture in bs.find_all("lecture"):
			for term in lecture.find_all("term"):
				if term == None or term.repeat == None:
					continue

				#support only weekly terms
				if not term.repeat.text[0:2] == "w1":
					continue

				#ignore term if not in this room
				if term.room == None or not term.room.univisref["key"] == roomKey:
					continue

				for weekday in term.repeat.text[2:].split(","):
					if term.starttime == None or term.endtime == None:
						continue

					self.lectures.add(UNIVISLectureTerm(unicode(lecture.short.text), weekday,
						                                    term.starttime.text, term.endtime.text))

	def getCurrentLectures(self):
		now = datetime.datetime.now()
		current = []

		for lecture in self.lectures:
			if lecture.day == now.weekday() and lecture.starttime <= now.time() <= lecture.endtime:
				current.append(lecture)

		return current

	def getDirectlyFollowingLectures(self, givenLecture):
		"""Return the same lectures (same name) directly (less than 31min pause) following a given lecture"""
		now = datetime.datetime.now()
		following = []

		for lecture in self.lectures:
			#ignoring midnight, timechanges, etc
			pause = (lecture.starttime.hour*60+lecture.starttime.minute)-(givenLecture.endtime.hour*60+givenLecture.endtime.minute)

			if givenLecture.name == lecture.name and 0 < pause < 31:
				following.append(lecture)

		return following


class UNIVISLectureTerm():

	def __init__(self, name, day, starttime, endtime):
		self.name = name
		self.day = int(day)-1
		self.starttime = datetime.time(*map(int, starttime.split(":")))
		self.endtime = datetime.time(*map(int, endtime.split(":")))

	def __hash__(self):
		return hash(self.__repr__())

	def __eq__(self, other):
		return unicode(self) == unicode(other)

	def __repr__(self):
		weekdays = ["Mon", "Die", "Mit", "Don", "Fre", "Sam", "Son"]
		return u"{}\t{}: {}-{}".format(self.name, weekdays[self.day], self.starttime, self.endtime)

	def __unicode__(self):
		weekdays = ["Mon", "Die", "Mit", "Don", "Fre", "Sam", "Son"]
		return u"{}\t{}: {}-{}".format(self.name, weekdays[self.day], self.starttime, self.endtime)

if __name__ == "__main__":
	r = UNIVISRoom("02.151a-113", "02.151b-113")

	# print map(lambda x: type(str(x.name)), r.lectures)
	for lecture in r.lectures:
		print unicode(lecture)
	
	print "Current "+unicode(r.getCurrentLectures())

	#for lecture in r.getCurrentLectures():
#		print unicode(lecture)
