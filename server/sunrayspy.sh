#!/usr/bin/env bash

date +%s > users.`hostname`
/opt/SUNWut/bin/utwho -c | awk -F'[.]| *' '{ print $5, $6}' >> users.`hostname`
