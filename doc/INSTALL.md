# Hutch Installation

## Build API server

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

### Glewlwyd token validation

You must set the configuration values to correspond with your OAuth2 glewlwyd server. The glewlwyd configuration block is labelled `jwt`

In this block, you must set the value `use_rsa` to `true` if you use RSA signatures for the tokens, then specify the path to the RSA public key file in the value `rsa_pub_file`. If you use `sha` digest as signature, set `use_sha` to `true`, then specify the secret used to encode the tokens in the value `sha_secret`.

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

### Setup Hutch in your Glewlwyd Oauth2 server

If you use a [Glewlwyd](https://github.com/babelouest/glewlwyd) instance as Oauth2 server, you must setup a new client, don't forget to setup properly the new scope, here set to `hutch`, the `client_id` and at least one correct `redirect_uri` value.

Hutch front-end is a Angular2 application, it will need a non confidential client_id, and the authorization types `code` and/or `token`.

![glewlwyd client configuration](https://github.com/babelouest/hutch/raw/master/doc/images/glewlwyd.png)

## Setup the web application

The web application is located in `webapp/dist`, its source is located in `webapp/src`, go to `webapp/README.md` if you want more details on the front-end implementation.

You can either use the built-in static file server or host the web application in another place, e.g. an Apache or nginx instance.

By design, the web application must be accessible on a root path, e.g. `https://hutch.mydomain.tld/`.

To configure the front-end, rename the file `webapp/dist/config.json.sample` to `webapp/dist/config.json` and modify its content for your configuration.

```javascript
{
  "lang": { // Languages available and default lang
    "available": [
      { "code": "en", "display": "English" },
      { "code": "fr", "display": "Français" }
    ],
    "default": "en"
  },
// Algorithms available are "AES-CBC", "AES-CTR" and "AES-GCM"
// Although, AES-CBC is for now the only one available for browser Safari (Apple devices)
  "webCryptography": {
    "algorithm": "AES-CBC",
    "keyLength": 256  // Values avbailable are 128, 192 or 256 bits
  },
  "api": {
    "baseUrl": "https://resource.server.url/", // Url to your Hutch API base URL
    "maxLength": 16777215                      // Maximum length used for data upload in bytes
  },
  "oauth2Connect": {
      "serverUri": "https://oauth.server.url/",    // URI to the Oauth2 service
      "clientId": "clientxyz",                     // client_id used
      "responseType": "code",                      // can be 'code' or 'token'
      "redirectUri": "https://client.server.url/", // Redirect URI set in your OAuth2 service
      "scope": "hutch",                            // scope required for hutch API
      "authorizePath": "auth/",
      "tokenPath": "token/",
      "storage": "localStorage"                    // Can be 'localStorage' or 'cookie'
  }
}
```

For more strength, 256 bits is recommended as key length. The algorithm choice depends on the clients and your security choices. Although Safari Webkit (MacOS and iOS users) implements only `AES-CBC`. So the default key algorithm is `AES-CBC 256 bits`. You can change it in this file if you like, but if safes are already created before you change the algorithm, their secrets will no longer be available.

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

By default, Hutch is available on TCP port 4884, the API is located in [http://localhost:4884/](http://localhost:4884/) and the web application is located in the url [http://localhost:4884/app/](http://localhost:4884/app/).
