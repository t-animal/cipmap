#!../env/bin/python2.7

import datetime
import urllib2

from bs4 import BeautifulSoup

class UNIVISRoom():
	_BASE_URL = "https://univis.uni-erlangen.de/prg?search=lectures&show=xml&room="

	def __init__(self, *roomNos):
		self.lectures = []

		for roomNo in roomNos:
			f = urllib2.urlopen(self._BASE_URL+roomNo)
			self._parsexml(f)

	def _parsexml(self, xml):
		bs = BeautifulSoup(xml)

		for lecture in bs.find_all("lecture"):
			for term in lecture.find_all("term"):
				#support only weekly terms
				if not term.repeat.text[0:2] == "w1":
					continue

				for weekday in term.repeat.text[2:].split(","):
					if term.starttime == None or term.endtime == None:
						continue

					self.lectures.append(UNIVISLectureTerm(lecture.short.text, weekday,
						                                    term.starttime.text, term.endtime.text))

	def getCurrentLectures(self):
		now = datetime.datetime.now()
		current = []

		for lecture in self.lectures:
			if lecture.day == now.weekday() and lecture.starttime <= now.time() <= lecture.endtime:
				current.append(lecture)

		return current


class UNIVISLectureTerm():

	def __init__(self, name, day, starttime, endtime):
		self.name = name
		self.day = int(day)-1
		self.starttime = datetime.time(*map(int, starttime.split(":")))
		self.endtime = datetime.time(*map(int, endtime.split(":")))

	def __str__(self):
		weekdays = ["Mon", "Die", "Mit", "Don", "Fre", "Sam", "Son"]
		return u"{} {}: {}-{}".format(self.name, weekdays[self.day], self.starttime, self.endtime)

	def __repr__(self):
		return u"{} {}: {}-{}".format(self.name, self.day, self.starttime, self.endtime)

if __name__ == "__main__":
	r = UNIVISRoom("02.151a-113", "02.151b-113")

	print unicode(r.getCurrentLectures())
