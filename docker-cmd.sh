#!/bin/bash
NOW=$(date +"%Y-%m-%d %H:%M:%S")
OPT=$1


case $OPT in
	-install|-i)
		docker run --rm \
			-v $PWD:/app \
			-w /app node:alpine npm install \
			>> "$PWD/logs/$NOW";;
	-run|-r)
		docker run --rm \
			-v $PWD:/app \
			-v /data/nedb:/data/nedb  \
			-w /app node:alpine npx babel-node --presets es2015,stage-2 /app/index.js \
			>> "$PWD/logs/$NOW";;
	*)
		echo "Bad argument!" 
		echo "Usage: $0 -i"
		echo "	-i : Install dependencies."
		echo "	-r : Run script."
		;;
esac