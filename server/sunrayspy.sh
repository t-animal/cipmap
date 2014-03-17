#!/usr/bin/env bash

filterOptedOut() {
	while read line; do
	
		filter=false
		username=`echo "$line" | awk '{print $2}'`
		
		for ignore in /proj/cipmap/*; do
		
			if [[ "/proj/cipmap/$username" == "$ignore" ]]; then
				filter=true
			fi
			
		done
		
		if [[ "$filter" = "false" ]];then
			echo $line
		fi
	done
}

date +%s > data/users.`hostname`
/opt/SUNWut/bin/utwho -c | awk -F'[.]| *' '{ print $5, $6}' | filterOptedOut  >> data/users.`hostname`
