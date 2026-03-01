/**
 * End-to-end encryption using NaCl box (X25519 + XSalsa20-Poly1305).
 *
 * Every message is encrypted with:
 *   - sender's encryption SECRET key
 *   - recipient's encryption PUBLIC key
 *
 * Only the recipient (holding their secret key) can decrypt it.
 * The server sees only encrypted ciphertext and routing metadata (from/to peerId).
 */
// tweetnacl-util naming: decodeUTF8(string)→Uint8Array, encodeUTF8(Uint8Array)→string
import * as nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, decodeUTF8, encodeUTF8 } from 'tweetnacl-util';

export interface EncryptedPayload {
  nonce: string;           // base64, 24 bytes
  ciphertext: string;      // base64
  senderEpk: string;       // sender's encryption public key, base64
}

/** Encrypt a JSON-serializable message for a specific recipient. */
export function encryptMessage(
  message: object,
  recipientEncPublicKey: Uint8Array,
  senderEncSecretKey: Uint8Array,
  senderEncPublicKey: Uint8Array,
): EncryptedPayload {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const plaintext = decodeUTF8(JSON.stringify(message)); // string → Uint8Array
  const ciphertext = nacl.box(plaintext, nonce, recipientEncPublicKey, senderEncSecretKey);
  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
    senderEpk: encodeBase64(senderEncPublicKey),
  };
}

/** Decrypt a payload. Returns the parsed object or null if tampered / wrong key. */
export function decryptMessage<T = unknown>(
  payload: EncryptedPayload,
  senderEncPublicKey: Uint8Array,
  recipientEncSecretKey: Uint8Array,
): T | null {
  try {
    const nonce = decodeBase64(payload.nonce);
    const ciphertext = decodeBase64(payload.ciphertext);
    const decrypted = nacl.box.open(ciphertext, nonce, senderEncPublicKey, recipientEncSecretKey);
    if (!decrypted) return null;
    return JSON.parse(encodeUTF8(decrypted)) as T; // Uint8Array → string
  } catch {
    return null;
  }
}

/** Encrypt raw bytes (image/video data) for a recipient. */
export function encryptBytes(
  data: Uint8Array,
  recipientEncPublicKey: Uint8Array,
  senderEncSecretKey: Uint8Array,
  senderEncPublicKey: Uint8Array,
): EncryptedPayload {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ciphertext = nacl.box(data, nonce, recipientEncPublicKey, senderEncSecretKey);
  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
    senderEpk: encodeBase64(senderEncPublicKey),
  };
}

/** Decrypt raw bytes. Returns Uint8Array or null. */
export function decryptBytes(
  payload: EncryptedPayload,
  senderEncPublicKey: Uint8Array,
  recipientEncSecretKey: Uint8Array,
): Uint8Array | null {
  try {
    const nonce = decodeBase64(payload.nonce);
    const ciphertext = decodeBase64(payload.ciphertext);
    return nacl.box.open(ciphertext, nonce, senderEncPublicKey, recipientEncSecretKey) ?? null;
  } catch {
    return null;
  }
}

/** Sign a message string with an Ed25519 secret key, returns base64 signature. */
export function sign(message: string, signingSecretKey: Uint8Array): string {
  const bytes = decodeUTF8(message); // string → Uint8Array
  const signed = nacl.sign(bytes, signingSecretKey);
  return encodeBase64(signed);
}

/** Verify a signed message. Returns original string or null if invalid. */
export function verify(signed: string, signingPublicKey: Uint8Array): string | null {
  try {
    const opened = nacl.sign.open(decodeBase64(signed), signingPublicKey);
    if (!opened) return null;
    return encodeUTF8(opened); // Uint8Array → string
  } catch {
    return null;
  }
}
