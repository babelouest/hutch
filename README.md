# Hutch

Online password and secret locker.

Store password and other secret data in an encrypted safe on the server.

The API backend is fully written in language C, it's based on [Ulfius](https://github.com/babelouest/ulfius) HTTP framework, [Hoel](https://github.com/babelouest/hoel) database framework.

Authentication relies on a [Glewlwyd OAuth2 server](https://github.com/babelouest/glewlwyd), you must have one available first.

Warning, this project is in beta, use at your own risks.

## Installation

You must install the following libraries including their header files:

```
libmicrohttpd
libjansson
libcurl 
libmysqlclient 
libsqlite3 
libconfig 
libssl
```

On a Debian based distribution (Debian, Ubuntu, Raspbian, etc.), you can install those dependencies using the following command:

```shell
$ sudo apt-get install libmicrohttpd-dev libjansson-dev libcurl4-gnutls-dev libmysqlclient-dev libsqlite3-dev libconfig-dev libssl-dev
```

Then, download Hutch and its dependendencies hosted in github, compile and install.

```shell
# Install libjwt
$ git clone https://github.com/benmcollins/libjwt.git
$ cd libjwt/
$ autoreconf -i
$ ./configure
$ make
$ sudo make install

# Install Orcania
$ git clone https://github.com/babelouest/orcania.git
$ cd orcania/
$ make
$ sudo make install

# Install Yder
$ git clone https://github.com/babelouest/yder.git
$ cd yder/src/
$ make
$ sudo make install

# Install Ulfius
$ git clone https://github.com/babelouest/ulfius.git
$ cd ulfius/src/
$ make
$ sudo make install

# Install Hoel
$ git clone https://github.com/babelouest/hoel.git
$ cd hoel/src/
$ make
$ sudo make install

# Install Hutch
$ git clone https://github.com/babelouest/hutch.git
$ cd hutch/src/
$ make 
$ sudo make install
```

## Configuration

Copy `hutch.conf.sample` to `hutch.conf`, edit the file `hutch.conf` with your own settings.

### Data storage backend initialisation

You can use a MySql/MariaDB database or a SQLite3 database file.
Use the dedicated script, `hutch.mariadb.sql` or `hutch.sqlite3.sql` to initialize your database.

### Install service

The files `hutch-init` (SysV init) and `hutch.service` (Systemd) can be used to have hutch as a daemon. They are fitted for a Raspbian distrbution, but can easily be changed for other systems.

#### Install as a SysV init daemon and run

```shell
$ sudo cp hutch-init /etc/init.d/hutch
$ sudo update-rc.d hutch defaults
$ sudo service hutch start
```

#### Install as a Systemd daemon and run

```shell
$ sudo cp hutch.service /etc/systemd/system
$ sudo systemctl enable hutch
$ sudo sudo systemctl start hutch
```

### Install Web application

## Usage

Run the application using the service command if you installed the init file:

```shell
$ sudo service hutch start
```

You can also manually start the application like this:

```shell
$ ./hutch --config-file=hutch.conf
```

By default, Hutch is available on TCP port 4884, the API is located in [http://localhost:4884/hutch/](http://localhost:4884/hutch/) and the web application is located in the url [http://localhost:4884/app/](http://localhost:4884/app/).
