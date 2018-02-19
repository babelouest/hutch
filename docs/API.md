# Hutch API Documentation

Here is the full documentaition of the REST API.

All the return data are in JSON format.

The prefix is `/api` by default, so this value will be used in this document, but you can change this in the `hutch.config` file.

## Authentication

All endpoints relies on a valid Glewlwyd Bearer token in the header, with a valid signature. For all requests, the username is provided by the Bearer token.

## Profile management

### Get the current profile

#### URL

`/profile/`

#### Method

`GET`

#### Success response

Code 200

Content
```javascript
{
  "fortune": string, max 512 characters
  "picture": string, max 16MB characters (mediumblob)
}
```

#### Error Response

Code 404

No profile set for this user

Code 500

Internal Error

### Set current profile

#### URL

`/profile`

#### Method

`PUT`

#### Data Parameters

```javascript
{
  "fortune": string, max 512 characters
  "picture": string, max 16MB characters (mediumblob)
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
    "name":string, 128 characters max
    "description":string, 512 characters max
    "key":string, 512 characters max
  }
]
```

#### Error Response

Code 500

Internal Error

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
  "name":string, 128 characters max
  "description":string, 512 characters max
  "key":string, 512 characters max
}
```

#### Error Response

Code 500

Internal Error

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
  "name":string, 128 characters max, must be unique for the current user
  "description":string, 512 characters max
  "key":string, 512 characters max
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
  "description":string, 512 characters max
  "key":string, 512 characters max
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

Code 500

Internal Error

OR

Code 404

Safe not found

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
