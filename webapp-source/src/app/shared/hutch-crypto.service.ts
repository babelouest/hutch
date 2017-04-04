// Because https://github.com/Microsoft/TypeScript/issues/8639
declare function escape(s: string): string;
declare function unescape(s: string): string;

// All crypto calls return a PromiseLike
// But for some reason, a PromiseLike has no catch function
// And if I cast a PromiseLike into a Promise, ng2 zone seems to have problems to refresh data
// So I wrap them into a Promise, so the catch is available
// See https://github.com/Microsoft/TypeScript/issues/13947
export class HutchCryptoService {

  constructor() { }

  // Generate a new key for the new safe
  generateSafeKey(): Promise<any> {
    return new Promise((resolve) => {
      window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256, }, true, ['encrypt', 'decrypt'])
      .then((safeKey) => {
        window.crypto.subtle.exportKey('jwk', safeKey).then((key) => {
          resolve(key);
        });
      });
    });
  }

  getKeyFromExport(exportedKey): Promise<any> {
    return new Promise((resolve) => {
      window.crypto.subtle.importKey('jwk', exportedKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
      .then((key) => {
        resolve(key);
      });
    });
  }

  // Import a key based on the password
  getKeyFromPassword(password: string): Promise<any> {
    return new Promise((resolve) => {
      window.crypto.subtle.digest({name: 'SHA-256'}, this.convertStringToArrayBufferView(password))
      .then((hashedPassword) => {
        window.crypto.subtle.importKey('raw', hashedPassword, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
        .then((key) => {
          resolve(key);
        });
      });
    });
  }

  // Encrypt safe key with the password key
  encryptData(data, passwordKey): Promise<string> {
    return new Promise((resolve, reject) => {
      let iv = window.crypto.getRandomValues(new Uint8Array(12));
      window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128}, passwordKey,
      this.convertStringToArrayBufferView(unescape(encodeURIComponent(JSON.stringify(data)))))
      .then((result) => {
        resolve(this.arrayBufferToBase64(result) + '.' + this.arrayBufferToBase64(iv));
      }, (error) => {
        reject(error);
      });
    });
  }

  decryptData(data: string, passwordKey): Promise<any> {
    return new Promise((resolve, reject) => {
      let splitted = data.split('.');
      window.crypto.subtle.decrypt({ name: 'AES-GCM',
                                     iv: this.base64ToArrayBuffer(splitted[1]),
                                     tagLength: 128
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
