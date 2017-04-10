/**
 * Algorithms available for hutch are AES-GCM, AES-CTR, AES-CBC
 *
 * Algorithm recommended by https://github.com/diafygi/webcrypto-examples is AES-GCM, with key length of 256 bits
 *
 * But (as of April 9, 2017), AES-GCM nor AES-CTR aren't implemented in Webkit version of Safari I've tested:
 * An Iphone 6s, an iPad Mini and a MacBook Air
 * Although Firefox and Chrome seemed fine
 * So I suggest AES-CBC for compatibility with most browsers
 * But anyway, it's configurable so do as you want
 */
import { Injectable } from '@angular/core';

import { HutchConfigService } from './hutch-config.service';

// Because https://github.com/Microsoft/TypeScript/issues/8639
declare function escape(s: string): string;
declare function unescape(s: string): string;

// All crypto calls return a PromiseLike
// But for some reason, a PromiseLike has no catch function
// And if I cast a PromiseLike into a Promise, ng2 zone seems to have problems to refresh data
// So I wrap them into a Promise, so the catch is available
// See https://github.com/Microsoft/TypeScript/issues/13947
@Injectable()
export class HutchCryptoService {
  alg = '';
  keyLength: number;
  crytoSubtle: any;
  isWebkit = false;

  constructor(private configService: HutchConfigService) {
    this.crytoSubtle = false;
    this.configService.get().then((config) => {
      if (config.webCryptography &&
          config.webCryptography.algorithm &&
          (config.webCryptography.algorithm === 'AES-GCM' ||
          config.webCryptography.algorithm === 'AES-CTR' ||
          config.webCryptography.algorithm === 'AES-CBC') &&
          config.webCryptography.keyLength &&
          (config.webCryptography.keyLength === 128 ||
          config.webCryptography.keyLength === 192 ||
          config.webCryptography.keyLength === 256)) {
        this.alg = config.webCryptography.algorithm;
        this.keyLength = config.webCryptography.keyLength;
        if (window.crypto) {
          if (window.crypto.subtle) {
            this.crytoSubtle = window.crypto.subtle;
          } else if (!window.crypto.subtle && (<any> window.crypto).webkitSubtle) {
            // iOS webkit workaround
            this.crytoSubtle = (<any> window.crypto).webkitSubtle;
            this.isWebkit = true;
          }
        }
      }
    });
  }

  cryptoAvailable() {
    return !!this.crytoSubtle;
  }

  // Generate a new key for the new safe
  generateSafeKey(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.cryptoAvailable()) {
        this.crytoSubtle.generateKey({ name: this.alg, length: this.keyLength }, true, ['encrypt', 'decrypt'])
        .then((safeKey) => {
          this.crytoSubtle.exportKey('jwk', safeKey).then((key) => {
            let compatKey: any;
            if (this.isWebkit) {
              compatKey = JSON.parse(this.convertArrayBufferViewtoString(key));
            } else {
              compatKey = key;
            }
            resolve(compatKey);
          })
          .catch((error) => {
            reject(error);
          });
        });
      } else {
        reject('web crypto not available');
      }
    });
  }

  getKeyFromExport(exportedKey, canImport = false): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.cryptoAvailable()) {
        let compatKey: any;
        if (this.isWebkit) {
          compatKey = this.convertStringToArrayBufferView(JSON.stringify(exportedKey));
        } else {
          compatKey = exportedKey;
        }
        this.crytoSubtle.importKey('jwk',
                                   compatKey,
                                   { name: this.alg }, canImport, ['encrypt', 'decrypt'])
        .then((key) => {
          resolve(key);
        })
        .catch((error) => {
          reject(error);
        });
      } else {
        reject('web crypto not available');
      }
    });
  }

  // Import a key based on the password
  getKeyFromPassword(password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.cryptoAvailable()) {
        this.crytoSubtle.digest({name: 'SHA-256'}, this.convertStringToArrayBufferView(password))
        .then((hashedPassword) => {
          this.crytoSubtle.importKey('raw', hashedPassword, { name: this.alg }, false, ['encrypt', 'decrypt'])
          .then((key) => {
            resolve(key);
          })
          .catch((error) => {
            reject(error);
          });
        })
        .catch((error) => {
          reject(error);
        });
      } else {
        reject('web crypto not available');
      }
    });
  }

  // Encrypt safe key with the password key
  encryptData(data: any, passwordKey): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.cryptoAvailable()) {
        let salt: any;
        let payload: any;
        if (this.alg === 'AES-CTR') {
          salt = window.crypto.getRandomValues(new Uint8Array(16));
          payload = { name: this.alg, counter: salt, length: 128};
        } else if (this.alg === 'AES-CBC') {
          salt = window.crypto.getRandomValues(new Uint8Array(16));
          payload = { name: this.alg, iv: salt, tagLength: 128};
        } else if (this.alg === 'AES-GCM') {
          salt = window.crypto.getRandomValues(new Uint8Array(12));
          payload = { name: this.alg, iv: salt, tagLength: 128};
        }
        this.crytoSubtle.encrypt(payload, passwordKey,
        this.convertStringToArrayBufferView(unescape(encodeURIComponent(JSON.stringify(data)))))
        .then((result) => {
          resolve(this.arrayBufferToBase64(result) + '.' + this.arrayBufferToBase64(salt));
        }, (error) => {
          reject(error);
        });
      } else {
        reject('web crypto not available');
      }
    });
  }

  decryptData(data: string, passwordKey): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.cryptoAvailable()) {
        let splitted = data.split('.');
        this.crytoSubtle.decrypt({ name: this.alg,
                                       iv: this.base64ToArrayBuffer(splitted[1]),
                                       counter: this.base64ToArrayBuffer(splitted[1]),
                                       tagLength: 128,
                                       length: 128
                                     },
                                     passwordKey,
                                     this.base64ToArrayBuffer(splitted[0]))
        .then((result) => {
          try {
            resolve(JSON.parse(decodeURIComponent(escape(this.convertArrayBufferViewtoString(result)))));
          } catch (e) {
            reject(e);
          }
        }, (error) => {
          reject(error);
        });
      } else {
        reject('web crypto not available');
      }
    });
  }

  convertStringToArrayBufferView(str) {
    let bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }

    return bytes;
  }

  convertArrayBufferViewtoString(buffer) {
    let str = '';
    let view = new Uint8Array(buffer);
    for (let i = 0; i < buffer.byteLength; i++) {
      str += String.fromCharCode(view[i]);
    }
    return str;
  }

  arrayBufferToBase64(arrayBuffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
  }

  base64ToArrayBuffer(base64: string) {
    let binary_string =  window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array( len );
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  }
}
