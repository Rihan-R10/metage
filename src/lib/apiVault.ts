export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  gemini?: string;
  grok?: string;
}

export type KeyStatuses = Record<keyof ApiKeys, 'unconfigured' | 'testing' | 'valid' | 'invalid'>;

const STORAGE_KEY = 'user_api_keys_store_v1';

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

// Derive CryptoKey from passcode using PBKDF2
async function getDerivedKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptApiKey(plainText: string, passcode: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const derivedKey = await getDerivedKey(passcode, salt);

  const enc = new TextEncoder();
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    enc.encode(plainText)
  );

  const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptApiKey(base64Ciphertext: string, passcode: string): Promise<string> {
  const combined = Uint8Array.from(atob(base64Ciphertext), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);

  const derivedKey = await getDerivedKey(passcode, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    data
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

export async function verifyPasscode(storedToken: string, passcode: string): Promise<boolean> {
  try {
    const decrypted = await decryptApiKey(storedToken, passcode);
    return decrypted === 'VALID_VAULT_PASSCODE';
  } catch {
    return false;
  }
}

export async function verifyOpenAIKey(key: string): Promise<boolean> {
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
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    return res.status !== 401;
  } catch {
    return false;
  }
}

export async function verifyGeminiKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function verifyGrokKey(key: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
