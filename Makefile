#
# Hutch - Password and private data locker
#
# Makefile used to build the software
#
# Copyright 2016-2021 Nicolas Mora <mail@babelouest.org>
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

HUTCH_SOURCE=./src
HUTCH_TESTS=./test

all:
	cd $(HUTCH_SOURCE) && $(MAKE)

debug:
	cd $(HUTCH_SOURCE) && $(MAKE) debug

install:
	cd $(HUTCH_SOURCE) && $(MAKE) install

memcheck:
	cd $(HUTCH_SOURCE) && $(MAKE) memcheck

test-debug:
	cd $(HUTCH_SOURCE) && $(MAKE) test-debug

test:
	cd $(HUTCH_TESTS) && $(MAKE) test

clean:
	cd $(HUTCH_SOURCE) && $(MAKE) clean
	cd $(HUTCH_TESTS) && $(MAKE) clean
