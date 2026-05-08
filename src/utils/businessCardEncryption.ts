// Client-side encryption utilities for business card data
// Uses Web Crypto API for secure encryption

export type ContactTypeLabel =
  | "client"
  | "broker"
  | "brokerage_agency"
  | "developer"
  | "investor"
  | "partner"
  | "media"
  | "supplier"
  | "other";

export interface ScannedContact {
  id: string;
  name: string;
  // Legacy fields kept for backwards compatibility
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  website?: string;
  notes?: string;
  scannedAt: string;
  imagePreview?: string;
  confidence: number;

  // New rich fields from upgraded OCR
  title?: string;
  company_name?: string;
  agency_name?: string;
  developer_name?: string;
  whatsapp?: string;
  landline?: string;
  linkedin?: string;
  instagram?: string;
  city?: string;
  country?: string;
  event_source?: string;
  raw_text?: string;

  // Original full image data URL (for saving to CRM bucket)
  imageDataUrl?: string;

  // Per-card classification chosen by user before saving
  contactType?: ContactTypeLabel;
  labels?: string[];

  // Save status
  savedLeadId?: string | null;
  saveStatus?: "idle" | "saving" | "saved" | "error";
}

// Generate a random encryption key
export const generateEncryptionKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Convert hex string to Uint8Array
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

// Convert Uint8Array to hex string
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Import encryption key for use with Web Crypto API
const importKey = async (keyHex: string): Promise<CryptoKey> => {
  const keyBytes = hexToBytes(keyHex);
  return await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt data with AES-GCM
export const encryptData = async (data: string, keyHex: string): Promise<string> => {
  try {
    const key = await importKey(keyHex);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);
    
    return bytesToHex(combined);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data with AES-GCM
export const decryptData = async (encryptedHex: string, keyHex: string): Promise<string> => {
  try {
    const key = await importKey(keyHex);
    const combined = hexToBytes(encryptedHex);
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Encrypt contact object
export const encryptContact = async (contact: ScannedContact, keyHex: string): Promise<string> => {
  const jsonString = JSON.stringify(contact);
  return await encryptData(jsonString, keyHex);
};

// Decrypt contact object
export const decryptContact = async (encryptedHex: string, keyHex: string): Promise<ScannedContact> => {
  const jsonString = await decryptData(encryptedHex, keyHex);
  return JSON.parse(jsonString);
};

// Securely clear sensitive data from memory (best effort)
export const secureClear = (data: string | object): void => {
  if (typeof data === 'string') {
    // Overwrite string content (limited effectiveness in JS)
    const length = data.length;
    for (let i = 0; i < length; i++) {
      (data as any)[i] = '0';
    }
  }
};

// Generate a unique ID for contacts
export const generateContactId = (): string => {
  return `bc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
