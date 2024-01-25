# Hutch Installation

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
