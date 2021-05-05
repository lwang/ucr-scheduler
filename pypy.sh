#!/bin/bash

wget "https://downloads.python.org/pypy/pypy3.7-v7.3.4-linux64.tar.bz2"
tar -x -f "pypy3.7-v7.3.4-linux64.tar.bz2"
mv "pypy3.7-v7.3.4-linux64" "pypy37"
rm "pypy3.7-v7.3.4-linux64.tar.bz2"
./pypy37/bin/pypy3 -m ensurepip
./pypy37/bin/pypy3 -m pip install -r pypyreq.txt
./pypy37/bin/pypy3 server.py