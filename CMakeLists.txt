#
# Hutch
#
# CMake file used to build program
#
# Copyright 2018 Nicolas Mora <mail@babelouest.org>
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the MIT License
#
# This library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
#

cmake_minimum_required(VERSION 3.5)

project(hutch C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Werror")

# library info

set(PROGRAM_VERSION_MAJOR "2")
set(PROGRAM_VERSION_MINOR "1")
set(PROGRAM_VERSION_PATCH "0")
set(PROJECT_DESCRIPTION "Online password and secret locker")
set(PROJECT_BUGREPORT_PATH "https://github.com/babelouest/hutch/issues")
set(JANSSON_VERSION_REQUIRED "2.11")
set(ORCANIA_VERSION_REQUIRED "2.3.3")
set(YDER_VERSION_REQUIRED "1.4.20")
set(ULFIUS_VERSION_REQUIRED "2.7.15")
set(HOEL_VERSION_REQUIRED "1.4.29")
set(RHONABWY_VERSION_REQUIRED "1.1.13")
set(IDDAWC_VERSION_REQUIRED "1.1.9")

include(GNUInstallDirs)
include(CheckSymbolExists)

# cmake modules

set(HU_CMAKE_MODULE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/cmake-modules)
list(APPEND CMAKE_MODULE_PATH "${HU_CMAKE_MODULE_PATH}")

# check if _GNU_SOURCE is available

if (NOT _GNU_SOURCE)
    check_symbol_exists(__GNU_LIBRARY__ "features.h" _GNU_SOURCE)

    if (NOT _GNU_SOURCE)
        unset(_GNU_SOURCE CACHE)
        check_symbol_exists(_GNU_SOURCE "features.h" _GNU_SOURCE)
    endif ()
endif ()

if (_GNU_SOURCE)
    add_definitions(-D_GNU_SOURCE)
endif ()

include(FindJansson)
set(JANSSON_MIN_VERSION 2.4)
find_package(Jansson ${JANSSON_MIN_VERSION} REQUIRED)
if (JANSSON_FOUND)
    set(LIBS ${JANSSON_LIBRARIES})
endif ()

include(FindLibconfig)
find_package(Libconfig REQUIRED)
if (LIBCONFIG_FOUND)
    set(LIBS ${LIBS} ${LIBCONFIG_LIBRARIES})
    include_directories(${LIBCONFIG_INCLUDE_DIRS})
endif ()

include(FindZLIB)
find_package(ZLIB REQUIRED)
set(LIBS ${LIBS} ${ZLIB_LIBRARIES})

find_package(Threads REQUIRED)
set(LIBS ${LIBS} ${CMAKE_THREAD_LIBS_INIT})

# build

add_executable(hutch ${CMAKE_CURRENT_SOURCE_DIR}/src/hutch.h
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/iddawc_resource.h
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/static_compressed_inmemory_website_callback.h
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/http_compression_callback.h
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/iddawc_resource.c
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/static_compressed_inmemory_website_callback.c
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/http_compression_callback.c
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/coin.c
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/profile.c
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/safe.c
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/safe_key.c
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/webservice.c
                     ${CMAKE_CURRENT_SOURCE_DIR}/src/hutch.c )
target_link_libraries(hutch ${LIBS})
set_target_properties(hutch PROPERTIES COMPILE_OPTIONS "-Wextra;-Wconversion")

include(FindOrcania)
find_package(Orcania ${ORCANIA_VERSION_REQUIRED} REQUIRED)
set(LIBS ${LIBS} ${ORCANIA_LIBRARIES})
include_directories(${ORCANIA_INCLUDE_DIRS})

include(FindYder)
find_package(Yder ${YDER_VERSION_REQUIRED} REQUIRED)
set(LIBS ${LIBS} ${YDER_LIBRARIES})
include_directories(${YDER_INCLUDE_DIRS})

include(FindUlfius)
find_package(Ulfius ${ULFIUS_VERSION_REQUIRED} REQUIRED)
set(LIBS ${LIBS} ${ULFIUS_LIBRARIES})
include_directories(${ULFIUS_INCLUDE_DIRS})

include(FindHoel)
find_package(Hoel ${HOEL_VERSION_REQUIRED} REQUIRED)
set(LIBS ${LIBS} ${HOEL_LIBRARIES})
include_directories(${HOEL_INCLUDE_DIRS})

include(FindIddawc)
find_package(Iddawc ${IDDAWC_VERSION_REQUIRED} REQUIRED)
set(LIBS ${LIBS} ${IDDAWC_LIBRARIES})
include_directories(${IDDAWC_INCLUDE_DIRS})

include(FindRhonabwy)
find_package(Rhonabwy ${RHONABWY_VERSION_REQUIRED} REQUIRED)
set(LIBS ${LIBS} ${RHONABWY_LIBRARIES})
include_directories(${RHONABWY_INCLUDE_DIRS})

target_link_libraries(hutch ${LIBS})

# tests

option(BUILD_TESTING "Build the testing tree." OFF)

if (BUILD_TESTING)
    include(FindCheck)
    find_package(Check REQUIRED)
    if (CHECK_FOUND)
        include(FindSubunit)
        find_package(Subunit REQUIRED)

        enable_testing()

        set(CMAKE_CTEST_COMMAND ctest -V)

        set(TST_DIR ${CMAKE_CURRENT_SOURCE_DIR}/test)
        set(LIBS ${LIBS} ${CHECK_LIBRARIES} ulfius yder orcania)
        find_package(Threads REQUIRED)
        set(LIBS ${LIBS} ${SUBUNIT_LIBRARIES} ${CMAKE_THREAD_LIBS_INIT} m rt)

				set(TESTS coin profile safe safe_key )

        configure_file(
                "${HU_CMAKE_MODULE_PATH}/CTestCustom.cmake.in"
                "${CMAKE_CURRENT_BINARY_DIR}/CTestCustom.cmake"
                @ONLY)

        foreach (t ${TESTS})
            add_executable(${t} EXCLUDE_FROM_ALL ${TST_DIR}/${t}.c ${TST_DIR}/unit-tests.c ${TST_DIR}/unit-tests.h)
            target_include_directories(${t} PUBLIC ${TST_DIR})
            target_link_libraries(${t} PUBLIC ${LIBS})
            add_test(NAME ${t}
                    COMMAND ${t} "private-test.jwks")
        endforeach ()
    endif ()
endif ()

# install target

install(TARGETS hutch
        RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})
install(FILES docs/hutch.conf.sample 
        DESTINATION ${CMAKE_INSTALL_SYSCONFDIR}/hutch RENAME hutch.conf COMPONENT config)
install(DIRECTORY webapp/
        DESTINATION ${CMAKE_INSTALL_DATAROOTDIR}/hutch/webapp/ COMPONENT runtime)
install(FILES webapp/config.json.sample 
        DESTINATION ${CMAKE_INSTALL_DATAROOTDIR}/hutch/webapp/ RENAME config.json COMPONENT config)
install(FILES README.md
        DESTINATION ${CMAKE_INSTALL_DATADIR}/hutch/doc/ COMPONENT runtime)
install(FILES docs/INSTALL.md
        DESTINATION ${CMAKE_INSTALL_DATADIR}/hutch/doc/ COMPONENT runtime)
install(FILES docs/API.md
        DESTINATION ${CMAKE_INSTALL_DATADIR}/hutch/doc/ COMPONENT runtime)
install(FILES docs/FRONT-END.md
        DESTINATION ${CMAKE_INSTALL_DATADIR}/hutch/doc/ COMPONENT runtime)
install(FILES docs/hutch-init
        DESTINATION ${CMAKE_INSTALL_DATADIR}/hutch/doc/ COMPONENT runtime)
install(FILES docs/hutch.service
        DESTINATION ${CMAKE_INSTALL_DATADIR}/hutch/doc/ COMPONENT runtime)
install(FILES docs/hutch.mariadb.sql
        DESTINATION ${CMAKE_INSTALL_DATADIR}/hutch/doc/ COMPONENT runtime)
install(FILES docs/hutch.sqlite3.sql
        DESTINATION ${CMAKE_INSTALL_DATADIR}/hutch/doc/ COMPONENT runtime)
install(FILES docs/hutch.postgre.sql
        DESTINATION ${CMAKE_INSTALL_DATADIR}/hutch/doc/ COMPONENT runtime)

set(TARGETS hutch)

install(TARGETS ${TARGETS}
        RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
        CONFIGURATIONS Release)

# uninstall target

if (NOT TARGET uninstall)
    configure_file(
            "${HU_CMAKE_MODULE_PATH}/CMakeUninstall.cmake.in"
            "${CMAKE_CURRENT_BINARY_DIR}/cmake_uninstall.cmake"
            IMMEDIATE @ONLY)
    add_custom_target(uninstall
            COMMAND ${CMAKE_COMMAND} -P ${CMAKE_CURRENT_BINARY_DIR}/cmake_uninstall.cmake)
endif ()

# packaging

set(CPACK_PACKAGE_VERSION_MAJOR ${PROGRAM_VERSION_MAJOR})
set(CPACK_PACKAGE_VERSION_MINOR ${PROGRAM_VERSION_MINOR})
set(CPACK_PACKAGE_VERSION_PATCH ${PROGRAM_VERSION_PATCH})

set(PACKAGE_FILE_NAME
        "${CMAKE_PROJECT_NAME}_${CPACK_PACKAGE_VERSION_MAJOR}.${CPACK_PACKAGE_VERSION_MINOR}.${CPACK_PACKAGE_VERSION_PATCH}")

set(PACKAGE_IGNORED_FILES
        "${CMAKE_CURRENT_BINARY_DIR}/;/.git/;.gitignore;~$;${CPACK_SOURCE_IGNORE_FILES}")

set(CPACK_GENERATOR "TGZ;DEB")

set(CPACK_DEBIAN_PACKAGE_MAINTAINER "mail@babelouest.org")
set(CPACK_DEBIAN_PACKAGE_DESCRIPTION ${PROJECT_DESCRIPTION})
set(CPACK_DEBIAN_PACKAGE_HOMEPAGE "https://github.com/babelouest/hutch")
set(CPACK_DEBIAN_PACKAGE_DEPENDS "libc6 (>= 2.3.4), libconfig9, libgnutls30 (>= 3.5.0), liborcania|liborcania-dev (>= ${ORCANIA_VERSION_REQUIRED}), libyder|libyder-dev (>= ${YDER_VERSION_REQUIRED}), libulfius|libulfius-dev (>= ${ULFIUS_VERSION_REQUIRED}), libhoel|libhoel-dev (>= ${HOEL_VERSION_REQUIRED}), librhonabwy|librhonabwy-dev (>= ${RHONABWY_VERSION_REQUIRED}), libiddawc|libiddawc-dev (>= ${IDDAWC_VERSION_REQUIRED}), lsb-base (>= 3.0-6)")
set(CPACK_PACKAGE_FILE_NAME ${PACKAGE_FILE_NAME})

set(CPACK_SOURCE_GENERATOR "TGZ")
set(CPACK_SOURCE_PACKAGE_FILE_NAME ${PACKAGE_FILE_NAME})
set(CPACK_SOURCE_IGNORE_FILES ${PACKAGE_IGNORED_FILES})

option(BUILD_RPM "Build a RPM for your system" OFF)
if (BUILD_RPM)
  set(CPACK_GENERATOR "TGZ;DEB;RPM")
  set(CPACK_RPM_PACKAGE_LICENSE "GPL")
  set(CPACK_RPM_PACKAGE_URL "http://babelouest.github.io/hutch/")
  set(CPACK_RPM_PACKAGE_REQUIRES "libconfig, gnutls >= 3.5.0, jansson >= ${JANSSON_VERSION_REQUIRED}, liborcania >= ${ORCANIA_VERSION_REQUIRED}, libyder >= ${YDER_VERSION_REQUIRED}, libulfius >= ${ULFIUS_VERSION_REQUIRED}, libhoel >= ${HOEL_VERSION_REQUIRED}, librhonabwy >= ${RHONABWY_VERSION_REQUIRED}, libiddawc >= ${IDDAWC_VERSION_REQUIRED}")
endif ()

include(CPack)

add_custom_target(dist
        COMMAND ${CMAKE_MAKE_PROGRAM} package_source)

message(STATUS "Download required dependencies:       ${DOWNLOAD_DEPENDENCIES}")
message(STATUS "Build the testing tree:               ${BUILD_TESTING}")
message(STATUS "Build RPM package:                    ${BUILD_RPM}")
