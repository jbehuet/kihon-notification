#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NOW=$(date +"%Y-%m-%d %H:%M:%S")
OPT=$1

mkdir -p "$DIR/logs/"

case $OPT in
	-install|-i)
		docker run --rm \
			-v $DIR:/app \
			-w /app node:alpine npm install \
			>> "$DIR/logs/$NOW";;
	-run|-r)
		docker run --rm \
			-v $DIR:/app \
			-v /data/nedb:/data/nedb  \
			-w /app node:alpine npx babel-node --presets es2015,stage-2 /app/index.js \
			>> "$DIR/logs/$NOW";;
	*)
		echo "Bad argument!" 
		echo "Usage: $0 -i"
		echo "	-i : Install dependencies."
		echo "	-r : Run script."
		;;
esac
