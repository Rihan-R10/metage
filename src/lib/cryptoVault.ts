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

async function deriveKey(masterPasscode: string, salt: Uint8Array): Promise<CryptoKey> {
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