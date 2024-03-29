# Hutch Changelog

## 2.1.0

- UI bug fixes and improvements
- Fix timeout when using token response type
- Fix disconnection bug
- Upgrade front-end dependencies to last version
- Add password generator modal to generate passwords outside of a coin
- Fix `static_compressed_inmemory_website_callback`
- Allow to disable static files server
- Allow offline mode and offline safe
- cmake: remove `DownloadProject` feature, now dependencies must be previously installed
- Add QR-code support to exchange data
- Add safe key and export encryption using Webauthn PRF extension (Experimental)
- Remove algorithms RSA1_5, RSA-OAEP and ECDH-ES as algs allowed in key generation

## 2.0.0

- Complete rework for the better good
- Rewrite backend to sign output data
- Rewrite front-end in ReactJs and handle secrets and safe keys as JWTs
- Use Access Tokens from any OIDC server who sends JWT access tokens, rather than glewlwyd only

## 1.1.2

- Update library versions
- Improve documentation
- Update glewlwyd access_token functions

## 1.1.1

- Use last static_file_callback
- Move doc files to doc/
- Add redirect to / on 404 error
