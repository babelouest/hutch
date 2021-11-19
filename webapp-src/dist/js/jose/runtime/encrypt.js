import { concat, uint64be } from '../lib/buffer_utils.js';
import checkIvLength from '../lib/check_iv_length.js';
import checkCekLength from './check_cek_length.js';
import crypto, { isCryptoKey } from './webcrypto.js';
import invalidKeyInput from './invalid_key_input.js';
async function cbcEncrypt(enc, plaintext, cek, iv, aad) {
    const keySize = parseInt(enc.substr(1, 3), 10);
    const encKey = await crypto.subtle.importKey('raw', cek.subarray(keySize >> 3), 'AES-CBC', false, ['encrypt']);
    const macKey = await crypto.subtle.importKey('raw', cek.subarray(0, keySize >> 3), {
        hash: { name: `SHA-${keySize << 1}` },
        name: 'HMAC',
    }, false, ['sign']);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({
        iv,
        name: 'AES-CBC',
    }, encKey, plaintext));
    const macData = concat(aad, iv, ciphertext, uint64be(aad.length << 3));
    const tag = new Uint8Array((await crypto.subtle.sign('HMAC', macKey, macData)).slice(0, keySize >> 3));
    return { ciphertext, tag };
}
async function gcmEncrypt(plaintext, cek, iv, aad) {
    const encKey = cek instanceof Uint8Array
        ? await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
        : cek;
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({
        additionalData: aad,
        iv,
        name: 'AES-GCM',
        tagLength: 128,
    }, encKey, plaintext));
    const tag = encrypted.slice(-16);
    const ciphertext = encrypted.slice(0, -16);
    return { ciphertext, tag };
}
const encrypt = async (enc, plaintext, cek, iv, aad) => {
    if (!isCryptoKey(cek) && !(cek instanceof Uint8Array)) {
        throw new TypeError(invalidKeyInput(cek, 'CryptoKey', 'Uint8Array'));
    }
    checkCekLength(enc, cek);
    checkIvLength(enc, iv);
    if (enc.substr(4, 3) === 'CBC') {
        return cbcEncrypt(enc, plaintext, cek, iv, aad);
    }
    return gcmEncrypt(plaintext, cek, iv, aad);
};
export default encrypt;
