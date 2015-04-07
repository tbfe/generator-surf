#!/bin/bash
export PATH=$BUILD_KIT_PATH/git/git-2.0.0/bin:$PATH

if [ -d "_build" ]; then
	(cd _build && git pull)
else
	git clone http://gitlab.baidu.com/tbfe/bigpipe-build.git _build
fi

(cd _build && sh build.sh "$@")
