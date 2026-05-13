/**
 * Simple credential encryption for IMAP/SMTP passwords stored in JSONB.
 * Uses AES-256-GCM via Web Crypto API. The master key is derived from an
 * environment variable (COMM_CREDENTIAL_KEY or HOSTINGER_CREDENTIAL_KEY).
 */

const ALGO = "AES-GCM";
const KEY_LEN = 256;
const IV_LEN = 12;

async function getKeyMaterial(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = enc.encode(secret);
  // Derive a fixed-length key via HKDF-like SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hashBuffer, { name: ALGO, length: KEY_LEN }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function bufToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuf(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptCredential(plainText: string, secret: string): Promise<string> {
  const key = await getKeyMaterial(secret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, enc.encode(plainText));
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return bufToBase64(combined.buffer);
}

export async function decryptCredential(cipherText: string, secret: string): Promise<string> {
  const key = await getKeyMaterial(secret);
  const combined = new Uint8Array(base64ToBuf(cipherText));
  const iv = combined.slice(0, IV_LEN);
  const data = combined.slice(IV_LEN);
  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data);
  return new TextDecoder().decode(decrypted);
}
