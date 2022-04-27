#
# Hutch - API server
#
# Makefile used to build the software
#
# Copyright 2017 Nicolas Mora <mail@babelouest.org>
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
#CC=clang
CFLAGS=-c -Wall -Werror -Wextra $(ADDITIONALFLAGS)
LIBS=-lc -lulfius -lyder -ljansson -lorcania -lhoel -liddawc -lrhonabwy -lconfig -lz -lpthread
OBJECTS=hutch.o webservice.o http_compression_callback.o iddawc_resource.o static_compressed_inmemory_website_callback.o profile.o safe.o safe_key.o coin.o
PREFIX=/usr/local
CONFIG_FILE=../hutch.conf

all: release

clean:
	rm -f *.o hutch valgrind.txt

debug: ADDITIONALFLAGS=-DDEBUG -g -O0

debug: hutch

release: ADDITIONALFLAGS=-O3

release: hutch

%.o: %.c hutch.h
	$(CC) $(CFLAGS) $<

hutch: $(OBJECTS)
	$(CC) -o $@ $^ $(LIBS)

memcheck: debug
	valgrind --tool=memcheck --leak-check=full --show-leak-kinds=all ./hutch --config-file=$(CONFIG_FILE) 2>valgrind.txt

test-debug: debug
	./hutch --config-file=$(CONFIG_FILE)

install: hutch
	cp -f hutch $(PREFIX)/bin
