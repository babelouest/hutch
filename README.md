# Hutch

Experimental online password and secret locker. This is a personal project used to learn concepts and cryptographic programming.

Store password and other secret data in an encrypted safe on the server.

Can generate random password and answers to _secret questions_.

The API backend is fully written in language C, it's based on [Ulfius](https://github.com/babelouest/ulfius) HTTP framework, [Hoel](https://github.com/babelouest/hoel) database framework, [Rhonabwy](https://github.com/babelouest/rhonabwy) JOSE library and [Iddawc](https://github.com/babelouest/iddawc) OIDC Client and RP library.

Authentication relies on an OpenID Connect server like [Glewlwyd](https://github.com/babelouest/glewlwyd) providing access tokens using the [JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens](https://www.rfc-editor.org/rfc/rfc9068.html) standards.

## Documentation

Installation documentation is available in the file [INSTALL.md](https://github.com/babelouest/hutch/blob/master/docs/INSTALL.md).

User guide documentation is available in the file [FRONT-END.md](https://github.com/babelouest/hutch/blob/master/docs/FRONT-END.md).

Server API description is available in the file [API.md](https://github.com/babelouest/hutch/blob/master/docs/API.md).
