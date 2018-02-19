# Hutch

Online password and secret locker.

![example snapshot](screenshots/safe.png)

Store password and other secret data in an encrypted safe on the server.

Can generate random password and answers to _secret questions_.

The API backend is fully written in language C, it's based on [Ulfius](https://github.com/babelouest/ulfius) HTTP framework, and [Hoel](https://github.com/babelouest/hoel) database framework.

Authentication relies on a [Glewlwyd OAuth2 server](https://github.com/babelouest/glewlwyd), you must have one available first.

## Documentation

Installation documentation is available in the file [INSTALL.md](https://github.com/babelouest/hutch/blob/master/docs/INSTALL.md).

User guide documentation is available in the file [FRONT-END.md](https://github.com/babelouest/hutch/blob/master/docs/FRONT-END.md).

Server API description is available in the file [API.md](https://github.com/babelouest/hutch/blob/master/docs/API.md).

## How does it work?

Before creating a safe, the user must set its profile, by selecting a fortune image and a fortune message. This is a 2-way authentication method, for the user to make sure he or she is connected on the right server. Once the profile is set, the user can create and manage safe.

The user will store its secrets (login, passwords, secret questions, etc.) in a safe. Each safe is protected by a master password. The user can copy every value in the clipboard by clicking on the `Copy to clipboard` button to safely paste them in the input fields of the service.

Within the front-end application, the user can generate a random password or answers to secret questions.
A password can be generated with lower or uppercase letters, numbers, special characters and spaces. The user can select all patterns indepentently, for example if a service requires a password with letters and numbers only, or a password without spaces (yes, this still exists...).
A generated answer will be two words picked at random on a set of most common words in the user language, so it will be imposible for an attacker to guess the answer based on the knowledge he has on the user.

All encryption/decryption and cryptographic manipulation is executed in the front-end application via the [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/). The Web cryptography API is a cryptography API standardized by the W3C and implemented in most web browser.
For now, Hutch can use the 3 following encryption algorithms:
- AES-CBC
- AES-CTR
- AES-GCM

The key length is also parametrable, the length available are 128, 192 or 256 bits.

Basically, the API server is just a container that stores encrypted data.

This also means that if the user has lost its password, it's impossible to reset the password if the user hasn't exported its safe key.

To prevent password loss, the user can export a safe master key in a file, export all the secrets, or export each secret individually. A secret export can be protected with a password. This way the users can exchange secrets between users with more safety.

Every encryption (keys or secrets) uses a salt randomly generated. To be able to decrypt the data, the salt must be known, so the salt is stored with the encrypted data in the database. The advantage of this technique is if you have exactly the same data in 2 different secrets (which shouldn't happen but still), their encrypted value will be different enough for an attacker not being able to know that the 2 secrets are the same.

The advantage of having a safe key and a password key is that the user can change the password of the safe without having to re-encrypt all the secrets.

```
model: base64(encrypt(data+salt)) + "." + base64(salt)
example: YS7vMhPx0h7aHX0J8XEHx6Y84Y/vjBUe[...]zZznqV8dcTU=.gxRjCxRftUBsbP76VLzC3A==
```

### Safe key

When the user create a safe, an AES 256 bits key is generated by the Web Cryptography API. This will be the master key used to encrypt and decrypt all secrets stored in this safe. To safely store the master key on the server, it's encrypted with a key generated by a password provided by the user.

#### Generate, encrypt and store safe key

![store safe key](docs/images/Store_safe_key.png)

When the user comes back to Hutch, he or she must retrieve the safe key by entering his password to decrypt the encrypted key stored in the database.

#### Decrypt safe key

![get safe key](docs/images/Get_safe_key.png)

### Encrypt and decrypt secrets

Each secret is encrypted and decrypted with the safe key using the same model as the encryption/decryption to store and retrieve the safe key.

A secret has a name of 128 characters maximum, and data of 16MB maximum. The name of the secret must be unique in the safe. For better secrecy, the front-end application generates a random name with letters and numbers. This way, it's impossible to know the content of the secret based on its name.

#### Encrypt a secret

![encrypt coin](docs/images/Encrypt_coins.png)

#### Decrypt a secret

![decrypt coin](docs/images/Decrypt_coins.png)

## Is it secure?

Hutch is open-source, it uses [GNU General Public License licence](https://www.gnu.org/licenses/gpl.html) for the API server, and [GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.en.html) for the front-end. It uses languages, technologies and standards that are open and public. It has been developped using all the security design I know, but it's as secure as the trust you have in your chain of trust (server, network, device, OS, browser, Hutch, etc.), and without any warranty.

## Get involved

Hutch was first developped for my own use and for my own needs, but I'm very open to questions, suggestions, and participation. Feel free to contact me (mail@babelouest.org), open an issue or send a pull request if you feel like it.

### Add a new language

If you want to add translation for another language, all you need to do is to create a new `i18n` file in `hutch/webapp/src/public/i18n/` and add a new file for generating secrets anwser. This file is a JSON serialized aray of strings containing a set of most common used words int the language. This file is located in `hutch/webapp/src/public/words-xx.json` with `xx` as the language short name. When those 2 files are done, update the file `hutch/webapp/src/public/config.json` to set the new language.

```javascript
"lang": {
  "available": [
    { "code": "en", "display": "English" },
    { "code": "fr", "display": "Français" },
    // Add the new language here like, for example
    { "code": "es", "display": "Español" }
  ],
  "default": "en" // Update the default language if needed
}
```

### Other tasks

My TODO list for this program is mainly the following tasks, but this list is not final or closed.

### Improve front-end

I use bootstrap but I'm very bad at UI design as you can see. Also, I used Angular 2 for the UI framework, but it's the first project I make with Angular 2, there may be a lot of improvements to make in the code or the architecture.

### Write front-end unit tests

For now there is no unit-tests for the front-end. I tried to understand how it works with Angular 2 applications, but I wasn't able to run a valid test, and also I'm not sure what to test. All examples available seem to test if a tag is present in the html of a component, I didn't understand the purpose.
