#
# Taliesin - Media server
#
# Makefile used to build the tests
#
# Public domain, no copyright. Use at your own risk.
#

CC=gcc
CFLAGS=-Wall -Wno-unknown-pragmas -Wpedantic -D_REENTRANT -DDEBUG -g -O0
LDFLAGS=-lc $(shell pkg-config --libs liborcania) $(shell pkg-config --libs libyder) $(shell pkg-config --libs libulfius) $(shell pkg-config --libs libhoel) $(shell pkg-config --libs librhonabwy) $(shell pkg-config --libs libiddawc) $(shell pkg-config --libs jansson) $(shell pkg-config --libs check)
TARGET=profile safe safe_key coin
VALGRIND_COMMAND=valgrind --tool=memcheck --leak-check=full --show-leak-kinds=all

VERBOSE=0
MEMCHECK=0

PARAM_JWKS_PATH=../private-test.jwks

all: build test

clean:
	rm -f *.o *.log valgrind-*.txt $(TARGET)

unit-tests.o: unit-tests.c unit-tests.h
	$(CC) $(CFLAGS) -c unit-tests.c

%: %.c unit-tests.o
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS)

test_%: %
	@if [ "$(VERBOSE)" = "0" ] && [ "$(MEMCHECK)" = "0" ]; then \
		LD_LIBRARY_PATH=. ./run_test.sh ./$^ $(PARAM_JWKS_PATH); \
	elif [ "$(MEMCHECK)" = "0" ]; then \
		LD_LIBRARY_PATH=. ./$^ $(PARAM_JWKS_PATH); \
	else \
		CK_FORK=no LD_LIBRARY_PATH=. $(VALGRIND_COMMAND) ./$^ $(PARAM_JWKS_PATH) 2>valgrind-$@.txt; \
	fi

build: $(TARGET)

test: $(TARGET) test_profile test_safe test_safe_key test_coin
