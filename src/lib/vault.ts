const VAULT_STORAGE_KEY = 'tokendash_vault_keys';
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function assertBrowserCrypto(): void {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API is only available in the browser.');
  }
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(
  masterPasscode: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const normalizedSalt = Uint8Array.from(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPasscode),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
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

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(masterPasscode, salt);
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainKey)
  );

  const payload = new Uint8Array(
    salt.length + iv.length + ciphertext.byteLength
  );
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
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error('Failed to decrypt API key. Check your master passcode.');
  }
}

function readVault(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function writeVault(vault: Record<string, string>): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
}

export function storeEncryptedKey(
  providerAccountId: string,
  encryptedKey: string
): void {
  const vault = readVault();
  vault[providerAccountId] = encryptedKey;
  writeVault(vault);
}

export function getEncryptedKey(providerAccountId: string): string | null {
  return readVault()[providerAccountId] ?? null;
}

export function removeEncryptedKey(providerAccountId: string): void {
  const vault = readVault();
  delete vault[providerAccountId];
  writeVault(vault);
}

export function clearVault(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(VAULT_STORAGE_KEY);
}

export function hasAnyEncryptedKey(): boolean {
  const vault = readVault();
  return Object.values(vault).some(
    (val) => typeof val === 'string' && val.trim().length > 0
  );
}

