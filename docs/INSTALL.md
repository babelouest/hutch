# Hutch Installation

## Upgrade from Hutch 1.x to 2.0

The entire application was re-written in Hutch 2.0. To avoid nasty bugs and potential security issues, the old and the new version are not compatible, but the secret data format is. You must make your users backup their secret first in JSON format without a password.

So proceed with caution, make a backup of the database and the front-end application in case you need to restore them.

### Export, migrate, then reimport all safes

During the migration, you must have both version available in different addresses, e.g. https://hutch.tld/ and https://hutch2.tld/

In Hutch 1.x, use the `Export safe` functionality for each safe of each user to export all safes into files.

In Hutch 2.0, recreate new safes, then import all the safe backups in their new safe.

## Pre-compiled packages

You can install Hutch with a pre-compiled package available in the [release pages](https://github.com/babelouest/hutch/releases/latest/). The packages files `hutch-full_*` contain the package libraries of `orcania`, `yder`, `ulfius`, `hoel`, `rhonabwy` and `iddawc` precompiled for `hutch`, plus `hutch` package. To install a pre-compiled package, you need to have installed the following libraries:

```
libmicrohttpd
libjansson
libgnutls
libsqlite3
libmariadbclient
libpq
libconfig
zlib
```

For example, to install Hutch with the `hutch-full_2.0.0_debian_bullseye_x86_64.tar.gz` package downloaded on the `releases` page, you must execute the following commands:

```shell
$ sudo apt install -y libconfig9 libjansson4 libcurl3-gnutls libmicrohttpd12 libsqlite3-0 libpq5 default-mysql-client zlib1g
$ wget https://github.com/babelouest/hutch/releases/download/v2.0.0/hutch-full_2.0.0_debian_bullseye_x86_64.tar.gz
$ tar xf hoel-dev-full_1.4.0_Debian_stretch_x86_64.tar.gz
$ sudo dpkg -i liborcania_2.2.1_debian_bullseye_x86_64.deb
$ sudo dpkg -i libyder_1.4.14_debian_bullseye_x86_64.deb
$ sudo dpkg -i libulfius_2.7.6_debian_bullseye_x86_64.deb
$ sudo dpkg -i libhoel_1.4.18_debian_bullseye_x86_64.deb
$ sudo dpkg -i librhonabwy_1.1.1_debian_bullseye_x86_64.deb
$ sudo dpkg -i libiddawc_1.1.0_debian_bullseye_x86_64.deb
$ sudo dpkg -i hutch_2.0.0_debian_bullseye_x86_64.deb
```

If there's no package available for your distribution, you can recompile it manually using `CMake` or `Makefile`.

## Build API server

You must install the following libraries including their header files:

```
libmicrohttpd
libjansson
libgnutls
libsqlite3
libmariadbclient
libpq
libconfig
zlib
```

On a Debian based distribution (Debian, Ubuntu, Raspbian, etc.), you can install those dependencies using the following command:

```shell
$ sudo apt-get install libconfig-dev libsystemd-dev libjansson-dev libcurl4-gnutls-dev libmicrohttpd-dev libsqlite3-dev libpq-dev zlib1g-dev make default-libmysqlclient-dev
```

### CMake

Download Hutch from Github, then use the CMake script to build the application:

```shell
# Install Hutch
$ git clone https://github.com/babelouest/hutch.git
$ mkdir hutch/build
$ cd hutch/build
$ cmake ..
$ make
$ sudo make install
```

The available options for cmake are:
- `-DWITH_JOURNALD=[on|off]` (default `on`): Build with journald (SystemD) support for logging
- `-DCMAKE_BUILD_TYPE=[Debug|Release]` (default `Release`): Compile with debugging symbols or not
- `-DDOWNLOAD_DEPENDENCIES=[on|off]` (default `on`): Download some dependencies if missing or using an old version: `Orcania`, `Yder`, `Ulfius`, `Rhonabwy`, `Iddawc` and `Hoel`
- `-DBUILD_TESTING=[on|off]` (default `off`): Build testing tree

### Good ol' Makefile

Download Hutch and its dependendencies hosted in github, compile and install.

```shell
# Install Orcania
$ git clone https://github.com/babelouest/orcania.git
$ cd orcania/src/
$ make
$ sudo make install

# Install Yder
$ git clone https://github.com/babelouest/yder.git
$ cd yder/src/
$ make # Or make Y_DISABLE_JOURNALD=1 to disable journald logging
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

# Install Rhonabwy
$ git clone https://github.com/babelouest/rhonabwy.git
$ cd rhonabwy/src/
$ make
$ sudo make install

# Install Iddawc
$ git clone https://github.com/babelouest/iddawc.git
$ cd iddawc/src/
$ make
$ sudo make install

# Install Hutch
$ git clone https://github.com/babelouest/hutch.git
$ cd hutch/src/
$ make
$ sudo make install
```

## Configuration

Copy `docs/hutch.conf.sample` to `hutch.conf`, edit the file `hutch.conf` with your own settings.

### External url settings

The property `external_url` must be set with the url where your Hutch server will be available.

### Server signature keys

Every API return data in JWT format. To sign those JWTs, Hutch requires a JWKS with at least one private key. The JWKS file path is specified by the config property `sign_key`.

Every private key must have an `alg` property that will be used  to specify the signature algorithm.

### Data storage backend initialisation

You can use a MySql/MariaDB database, a SQLite3  or a PostgreSQL database file.
Use the dedicated script, `hutch.mariadb.sql`, `hutch.sqlite3.sql` or `hutch.postgre.sql` to initialize your database.

### OpenID Connect token validation

You must set the configuration values to correspond with your OpenID Connect server. Hutch requires access tokens that follow the [JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens](https://www.rfc-editor.org/rfc/rfc9068.html) standard.

#### OpenID Connect configuration using remote config

The simpliest way to configure OIDC in Hutch is to set the value `server_remote_config` with the url of the `.well-known/openid-configuration` url of the OIDC server. There, on startup, Hutch will retrieve the parameters required to authenticate the signed tokens. If the OIDC server rotates its signing keys, you must restart hutch to update the OIDC server configuration.

#### OpenID Connect configuration using server_public_jwks

You can also use `server_public_jwks` and manually set the public keys to verify the tokens signatures. In that case, you must also set the properties `iss`.

The properties `realm`, `aud` and `dpop_max_iat` are optional and will depend on your configuration.

### Install service

The files `hutch-init` (SysV init) and `hutch.service` (SystemD) can be used to have hutch as a daemon. They are fitted for a Raspbian distrbution, but can easily be changed for other systems.

#### Install as a SysV init daemon and run

```shell
$ sudo cp hutch-init /etc/init.d/hutch
$ sudo update-rc.d hutch defaults
$ sudo service hutch start
```

#### Install as a SystemD daemon and run

```shell
$ sudo cp hutch.service /etc/systemd/system
$ sudo systemctl enable hutch
$ sudo sudo systemctl start hutch
```

## Setup the web application

The web application is located in `webapp`, its source is located in `webapp-src`, go to `webapp-src/README.md` if you want more details on the front-end implementation.

You can either use the built-in static file server or host the web application in another place, e.g. an Apache or nginx instance.

To configure the front-end, rename the file `webapp/config.json.sample` to `webapp/config.json` and modify its content for your configuration.

```javascript
{
  "hutchRootUrl": "http://localhost:4884/",
  "lang": ["en","fr"],
  "profile_endpoint": "http://localhost:4884/api/profile", // Optional
  "safe_endpoint": "http://localhost:4884/api/safe", // Optional
  "storageType": "local",
  "oidc": {
    "responseType": "code", // values available are 'code' and 'token id_token'
    "redirectUri": "http://localhost:4884/",
    "clientId": "hutch", // Must be a public client
    "usePkce": true // Recommended
  }
}
```

### Protect behind Apache mod_proxy

A good practice consists to protect Hutch behind a http proxy. This way you can add specific security rules, redirect to a standard TCP port, e.g. 443, etc.

## Start the server

Run the application using the service command if you installed the init file:

```shell
$ sudo service hutch start
```

You can also manually start the application like this:

```shell
$ ./hutch --config-file=hutch.conf
```

By default, Hutch is available on TCP port 4884, the API is located at [http://localhost:4884/api](http://localhost:4884/api) and the web application is located at [http://localhost:4884/](http://localhost:4884/).
