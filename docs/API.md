# Hutch API Documentation

Here is the full documentaition of the REST API.

All the endpoints in `/api`prefix return data in JWT format. The JWTs are signed using the JWKS specified by the property `sign_key` in the `hutch.config` file. The key used to sign every response is the one specified in the user profile or the first key if none is specified.

The response format specified in this document is in JSON to make this document easier to read, but you must assume all responses are in JWT format.

Example of JWT response:

```
HTTP/1.1 200 OK
Content-Type: application/jwt
Pragma: no-cache
Cache-Control: no-store

eyJpYXQiOjE2MzY2Nzk0MDIsImV4cCI6MTYzNjY4MDAwMiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYiLCJraWQiOiJyc2EifQ.eyJrZXlzIjpbeyJraWQiOiJyc2EiLC[...]PY2lGWTFjVFQwIn1dfQ.Ewrzjss88[...]R-afaT3A
```

A JWT response will contain the header values `iat` and `exp` which should be verified by the client to mitigate replay attacks.

The API prefix is `/api` by default, so this value will be used in this document, you can change this in the `hutch.config` file.

## Authentication

Authentication is required for all endpoints in the `/api` prefix, those endpoints rely on a valid bearer access token using the [JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens](https://www.rfc-editor.org/rfc/rfc9068.html) standards, with a valid signature. For all requests, the user identifier used is the `sub` claim in the access token.

The configuration endpoints `/.well-known/hutch-configuration` and `/jwks` don't need authentication.

## Hutch configuration

The configuration endpoints `/.well-known/hutch-configuration` and `/jwks` are the only one which send response in JSON format by default.
If the client adds the header `Accept: application/jwt` in the request, the response will be in JWT format using the first key of the signing JWKS.

### Get general configuration

#### URL

`/.well-known/hutch-configuration/`

#### Method

`GET`

#### Success response

Code 200

Content
```javascript
{
  "jwks_uri":                  URL to the Hutch server JWKS, mandatory
  "oidc_server_remote_config": URL to the openid-configuration, optional
  "profile_endpoint":          URL to the profile API, mandatory
  "safe_endpoint":             URL to the safe API, mandatory
  "scope":                     List of scopes required by Hutch separated by spaces, mandatory
}
```

### Get server public keys

This endpoint return a JWKS containing the public keys required to verify the JWTs signatures.

#### URL

`/jwks`

#### Method

`GET`

#### Success response

Code 200

Content
```javascript
// Example of JWKS output
{
  "keys": [
    {
      "alg": "RS256",
      "e": "AQAB",
      "kid": "rsa",
      "kty": "RSA",
      "n": "zHpJ7[...]TRaxUQ"
    },
    {
      "alg": "ES256",
      "crv": "P-256",
      "kid": "ecdsa",
      "kty": "EC",
      "x": "MPx0yi[...]yZH1tY",
      "y": "N29F26[...]Y1cTT0"
    }
  ]
}
```

## Profile management

### Get the current profile

#### URL

`/api/profile/`

#### Method

`GET`

#### Success response

Code 200

Content
```javascript
{
  "last_updated": Epoch time when the profile was last updated, integer
  "message":      Profile fortune message, string
  "name":         Profile user name, string
  "picture":      Profile picture, string
  "sign_kid":     kid of the key used to signe responses, string
}
```

#### Error Response

Code 404

No profile set for this user

### Set current profile

#### URL

`/profile`

#### Method

`PUT`

#### Data Parameters

```javascript
{
  "name"    : string, max 256 characters
  "fortune" : string, max 512 characters
  "picture" : string, max 16MB characters (mediumblob)
  "sign_kid": string, must match an existing kid in the server JWKS
}
```

#### Success response

Code 200

#### Error Response

Code 400

Error input parameters

Content: json array containing all errors

### Delete current profile

#### URL

`/profile`

#### Method

`DELETE`

#### Success response

Code 200

## Safe management

### Get all safe for the current user

#### URL

`/safe/`

#### Method

`GET`

#### Success response

Code 200

Content
```javascript
[ // Array of safe
  {
    "name"         : string, 128 characters max
    "display_name" : string, 512 characters max
    "enc_type"     : string
    "alg_type"     : string
  }
]
```

#### Error Response

Code 403

Profile not set

### Get a safe by its name

#### URL

`/safe/@safe_name`

#### Method

`GET`

#### URL Parameters

**Required**

`@safe_name`: Safe name

#### Success response

Code 200

Content
```javascript
{
  "name"         : string, 128 characters max
  "display_name" : string, 512 characters max
  "enc_type"     : string, 128 characters max
  "alg_type"     : string, 128 characters max
}
```

#### Error Response

Code 403

Profile not set

OR

Code 404

Safe not found

### Add a new safe

#### URL

`/safe/`

#### Method

`POST`

#### Data Parameters

```javascript
{
  "name"         : string, 128 characters max, must be unique for the current user
  "display_name" : string, 512 characters max
  "enc_type"     : string, 128 characters max
  "alg_type"     : string, 128 characters max
}
```

#### Success response

Code 200

#### Error Response

Code 403

Profile not set

OR

Code 400

Error input parameters

Content: json array containing all errors

### Modify an existing safe

#### URL

`/safe/@safe_name`

#### Method

`PUT`

#### URL Parameters

**Required**

`@safe_name`: Safe name

#### Data Parameters

```javascript
{
  "display_name" : string, 512 characters max
  "enc_type"     : string, 128 characters max
  "alg_type"     : string, 128 characters max
}
```

#### Success response

Code 200

#### Error Response

Code 403

Profile not set

OR

Code 400

Error input parameters

Content: json array containing all errors

OR

Code 404

Safe not found

### Remove a safe

#### URL

`/safe/@safe_name`

#### Method

`DELETE`

#### URL Parameters

**Required**

`@safe_name`: Safe name

#### Success response

Code 200

#### Error Response

Code 403

Profile not set

OR

Code 404

Safe not found

## Safe key management

### Get all safe keys for the current safe

#### URL

`/safe/@safe_name/key/`

#### Method

`GET`

#### URL Parameters

**Required**

`@safe_name`: Safe name

#### Success response

Code 200

Content
```javascript
[ // Array of safe keys
  {
    "type"         : string, 128 characters max
    "name"         : string, 128 characters max
    "display_name" : string, 512 characters max
    "data"         : string, 16M characters max
  }
]
```

#### Error Response

Code 403

Profile not set

### Get a safe key by its name

#### URL

`/safe/@safe_name/key/@key/`

#### Method

`GET`

#### URL Parameters

**Required**

`@safe_name`: Safe name
`@key`      : safe key name

#### Success response

Code 200

Content
```javascript
{
  "type"         : string, 128 characters max
  "name"         : string, 128 characters max
  "display_name" : string, 512 characters max
  "data"         : string, 16M characters max
}
```

#### Error Response

Code 403

Profile not set

OR

Code 404

Safe key not found

### Add a new safe key

#### URL

`/safe/@safe_name/key/`

#### Method

`POST`

#### URL Parameters

**Required**

`@safe_name`: Safe name

#### Data Parameters

```javascript
{
  "type"         : string, 128 characters max
  "name"         : string, 128 characters max
  "display_name" : string, 512 characters max
  "data"         : string, 16M characters max
}
```

#### Success response

Code 200

#### Error Response

Code 403

Profile not set

OR

Code 400

Error input parameters

Content: json array containing all errors

### Modify an existing safe key

#### URL

`/safe/@name/key/@key`

#### Method

`PUT`

#### URL Parameters

**Required**

`@safe_name`: Safe name
`@key`      : Safe key name

#### Data Parameters

```javascript
{
  "type"         : string, 128 characters max
  "display_name" : string, 512 characters max
  "data"         : string, 16M characters max
}
```

#### Success response

Code 200

#### Error Response

Code 403

Profile not set

OR

Code 400

Error input parameters

Content: json array containing all errors

OR

Code 404

Safe key not found

### Remove a safe key

#### URL

`/safe/@safe_name/key/@key`

#### Method

`DELETE`

#### URL Parameters

**Required**

`@safe_name`: Safe name
`@key`      : Safe key name

#### Success response

Code 200

#### Error Response

Code 403

Profile not set

OR

Code 404

Safe key not found

## Coin management

### Get all coins of a safe

#### URL

`/safe/@safe_name/coin`

#### Method

`GET`

#### URL Parameters

**Required**

`@safe_name`: Safe name

#### Success response

Code 200

Content
```javascript
[ // Array of coins
  {
    "name":string, 128 characters max
    "data":string, 16MB max
  }
]
```

#### Error Response

Code 500

Internal Error

### Get a coin of a safe by its name

#### URL

`/safe/@safe_name/coin/@coin_name`

#### Method

`GET`

#### URL Parameters

**Required**

`@safe_name`: Safe name
`@coin_name`: Coin name

#### Success response

Code 200
Content
```javascript
{
  "name":string, 128 characters max
  "data":string, 16MB max
}
```

#### Error Response

Code 500

Internal Error

OR

Code 404

Coin not found

### Add a new coin on a safe

#### URL

`/safe/@safe_name/coin`

#### Method

`POST`

#### URL Parameters

**Required**

`@safe_name`: Safe name

#### Data Parameters

```javascript
{
  "name":string, 128 characters max, must be unique for the current safe
  "data":string, 16MB max
}
```

#### Success response

Code 200

#### Error Response

Code 500

Internal Error

OR

Code 400

Error input parameters

Content: json array containing all errors

### Modify an existing coin on a safe

#### URL

`/safe/@safe_name/coin/@coin_name`

#### Method

`PUT`

#### URL Parameters

**Required**

`@safe_name`: Safe name

`@coin_name`: Coin name

#### Data Parameters

```javascript
{
  "data":string, 16MB max
}
```

#### Success response

Code 200

#### Error Response

Code 500

Internal Error

OR

Code 400

Error input parameters

Content: json array containing all errors

OR

Code 404

Coin not found

### Remove a coin on a safe

#### URL

`/safe/@safe_name/coin/@coin_name`

#### Method

`DELETE`

#### URL Parameters

**Required**

`@safe_name`: Safe name

`@coin_name`: Coin name

#### Success response

Code 200

#### Error Response

Code 500

Internal Error

OR

Code 404

Coin not found
