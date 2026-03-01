import * as SecureStore from 'expo-secure-store';
import * as nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

const IDENTITY_STORE_KEY = 'nexus_p2p_identity_v1';

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface Identity {
  peerId: string;
  signingKeyPair: KeyPair;
  encryptionKeyPair: KeyPair;
}

interface SerializedIdentity {
  peerId: string;
  signingPublicKey: string;
  signingSecretKey: string;
  encryptionPublicKey: string;
  encryptionSecretKey: string;
}

/** Derive a 32-hex-char peerId from a signing public key. */
export function derivePeerId(signingPublicKey: Uint8Array): string {
  return Array.from(signingPublicKey.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a brand-new cryptographic identity. */
export function generateIdentity(): Identity {
  const signingKeyPair = nacl.sign.keyPair();
  const encryptionKeyPair = nacl.box.keyPair();
  const peerId = derivePeerId(signingKeyPair.publicKey);
  return { peerId, signingKeyPair, encryptionKeyPair };
}

/** Persist identity to secure storage (private keys never leave the device). */
export async function saveIdentity(identity: Identity): Promise<void> {
  const s: SerializedIdentity = {
    peerId: identity.peerId,
    signingPublicKey: encodeBase64(identity.signingKeyPair.publicKey),
    signingSecretKey: encodeBase64(identity.signingKeyPair.secretKey),
    encryptionPublicKey: encodeBase64(identity.encryptionKeyPair.publicKey),
    encryptionSecretKey: encodeBase64(identity.encryptionKeyPair.secretKey),
  };
  await SecureStore.setItemAsync(IDENTITY_STORE_KEY, JSON.stringify(s));
}

/** Load identity from secure storage. Returns null if not set up yet. */
export async function loadIdentity(): Promise<Identity | null> {
  const stored = await SecureStore.getItemAsync(IDENTITY_STORE_KEY);
  if (!stored) return null;
  const s: SerializedIdentity = JSON.parse(stored);
  return {
    peerId: s.peerId,
    signingKeyPair: {
      publicKey: decodeBase64(s.signingPublicKey),
      secretKey: decodeBase64(s.signingSecretKey),
    },
    encryptionKeyPair: {
      publicKey: decodeBase64(s.encryptionPublicKey),
      secretKey: decodeBase64(s.encryptionSecretKey),
    },
  };
}

export async function clearIdentity(): Promise<void> {
  await SecureStore.deleteItemAsync(IDENTITY_STORE_KEY);
}

/** Return base64-encoded public keys suitable for sharing in a QR code. */
export function exportPublicKeys(identity: Identity) {
  return {
    signingPublicKey: encodeBase64(identity.signingKeyPair.publicKey),
    encryptionPublicKey: encodeBase64(identity.encryptionKeyPair.publicKey),
  };
}
