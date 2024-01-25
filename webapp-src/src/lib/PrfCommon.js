
class PrfCommon {

  constructor() {
    this.webauthnTimeout = 60000;
  }

  createCredential(name, displayName) {
    let challenge = new Uint8Array(32), salt = new Uint8Array(32), userId = new Uint8Array(16);

    window.crypto.getRandomValues(challenge);
    window.crypto.getRandomValues(salt);
    window.crypto.getRandomValues(userId);

    var createCredentialDefaultArgs = {
      publicKey: {
        rp: {
          name: "Hutch"
        },
        user: {
          id: userId,
          name: name,
          displayName: displayName
        },
        pubKeyCredParams: [
          { alg: -8, type: "public-key" }, // Ed25519
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          userVerification: "required",
        },
        timeout: this.webauthnTimeout,
        extensions: {
          prf: {
            eval: {
              first: salt
            },
          },
        },
        challenge: challenge.buffer
      }
    };

    return navigator.credentials.create(createCredentialDefaultArgs)
    .then((cred) => {

      if (cred.getClientExtensionResults().prf?.enabled) {
        return Promise.resolve({credentialId: cred.rawId, salt: salt.buffer});
      } else {
        return Promise.reject("prfDisabled");
      }
    })
    .catch((err) => {
      if (err === "prfDisabled") {
        return Promise.reject("prfDisabled");
      } else {
        return Promise.reject("creationError");
      }
    });
  }

  createPrfFromKey(credentialId, salt) {
    let challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    var credentialArgs = {
      publicKey: {
        timeout: this.webauthnTimeout,
        allowCredentials: [
          {
            id: credentialId,
            transports: ["usb", "nfc", "ble", "internal"],
            type: "public-key"
          }
        ],
        challenge: challenge,
        extensions: {
          prf: {
            eval: {
              first: salt
            },
          },
        }
      }
    };

    return navigator.credentials.get(credentialArgs)
    .then((assertion) => {
      if (assertion.getClientExtensionResults().prf?.results?.first.byteLength >= 32) {
        return Promise.resolve({prfResult: assertion.getClientExtensionResults().prf.results.first});
      } else {
        return Promise.reject("assertionError");
      }
    })
    .catch((err) => {
      return Promise.reject("assertionError");
    });
  }
}

let prfCommon = new PrfCommon();

export default prfCommon;
