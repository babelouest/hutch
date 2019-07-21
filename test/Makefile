#
# Glewlwyd OAuth2 Authorization Server
#
# Makefile used to build the software
#
# Copyright 2016 Nicolas Mora <mail@babelouest.org>
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU GENERAL PUBLIC LICENSE
# License as published by the Free Software Foundation;
# version 3 of the License.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU GENERAL PUBLIC LICENSE for more details.
#
# You should have received a copy of the GNU General Public
# License along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

CC=gcc
CFLAGS=-Wall -D_REENTRANT -DDEBUG -g -O0
LIBS=-lc -lulfius -lorcania -ljansson -lyder -lcheck -lpthread -lm -lrt -lsubunit

ACCESS_TOKEN=

all: test

clean:
	rm -f *.o *.err *.log hutch_profile hutch_safe hutch_coin valgrind.txt

build: hutch_profile hutch_safe hutch_coin

unit-tests.o: unit-tests.c unit-tests.h
	$(CC) $(CFLAGS) -c unit-tests.c

hutch_profile: hutch_profile.c unit-tests.o
	$(CC) $(CFLAGS) hutch_profile.c unit-tests.o -o hutch_profile $(LIBS)

test_hutch_profile: hutch_profile
	-./run_test.sh ./hutch_profile $(ACCESS_TOKEN)

hutch_safe: hutch_safe.c unit-tests.o
	$(CC) $(CFLAGS) hutch_safe.c unit-tests.o -o hutch_safe $(LIBS)

test_hutch_safe: hutch_safe
	-./run_test.sh ./hutch_safe $(ACCESS_TOKEN)

hutch_coin: hutch_coin.c unit-tests.o
	$(CC) $(CFLAGS) hutch_coin.c unit-tests.o -o hutch_coin $(LIBS)

test_hutch_coin: hutch_coin
	-./run_test.sh ./hutch_coin $(ACCESS_TOKEN)

test: build test_hutch_profile test_hutch_safe test_hutch_coin
