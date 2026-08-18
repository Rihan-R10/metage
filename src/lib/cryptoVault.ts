// ==========================================
// Web Crypto Encryption Settings
// ==========================================
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function assertBrowserCrypto(): void {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API is only available in browser environments.');
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveKey(masterPasscode: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const normalizedSalt = Uint8Array.from(salt);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPasscode),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: normalizedSalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptApiKey(
  plainKey: string,
  masterPasscode: string
): Promise<string> {
  assertBrowserCrypto();

  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(masterPasscode, salt);
  const encoder = new TextEncoder();

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainKey)
  );

  const payload = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  payload.set(salt, 0);
  payload.set(iv, salt.length);
  payload.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return toBase64(payload);
}

export async function decryptApiKey(
  encryptedData: string,
  masterPasscode: string
): Promise<string> {
  assertBrowserCrypto();

  const payload = fromBase64(encryptedData);
  if (payload.length <= SALT_BYTES + IV_BYTES) {
    throw new Error('Invalid encrypted payload.');
  }

  const salt = payload.slice(0, SALT_BYTES);
  const iv = Uint8Array.from(payload.slice(SALT_BYTES, SALT_BYTES + IV_BYTES));
  const ciphertext = payload.slice(SALT_BYTES + IV_BYTES);
  const key = await deriveKey(masterPasscode, salt);

  try {
    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error('Failed to decrypt API key. Check your master passcode.');
  }
}

export async function verifyPasscode(
  encryptedData: string,
  masterPasscode: string
): Promise<boolean> {
  try {
    await decryptApiKey(encryptedData, masterPasscode);
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// API Key Types & Vault Storage
// ==========================================
export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  gemini?: string;
  grok?: string;
}

export type KeyStatus = 'unconfigured' | 'testing' | 'valid' | 'invalid';

export type KeyStatuses = Record<keyof ApiKeys, KeyStatus>;

const STORAGE_KEY = 'api_vault_keys_v1';

export function loadSavedKeys(): ApiKeys {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveKeysToStorage(keys: ApiKeys): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to save API keys to storage:', error);
  }
}

// ==========================================
// Provider Key Verification Functions
// ==========================================
export async function verifyOpenAIKey(key: string): Promise<boolean> {
  if (!key.startsWith('sk-')) return false;
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function verifyAnthropicKey(key: string): Promise<boolean> {
  if (!key.startsWith('sk-ant-')) return false;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
    return res.status !== 401 && res.status !== 403;
  } catch {
    return false;
  }
}

export async function verifyGeminiKey(key: string): Promise<boolean> {
  if (!key.trim()) return false;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function verifyGrokKey(key: string): Promise<boolean> {
  if (!key.trim()) return false;
  try {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}