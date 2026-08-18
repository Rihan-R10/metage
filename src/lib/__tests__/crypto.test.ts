import { describe, it, expect, beforeAll } from 'vitest';
import {
  encryptApiKey,
  decryptApiKey,
  verifyPasscode,
  deriveKey,
} from '../cryptoVault';

beforeAll(() => {
  const globalWin = globalThis as { window?: { crypto?: Crypto } };
  if (!globalWin.window) {
    globalWin.window = { crypto: globalThis.crypto };
  }
});

describe('Web Crypto Vault (AES-256-GCM + PBKDF2)', () => {
  const passcode = 'Passcode123!';
  const plaintext = 'sk-test-abcdefghijklmnopqrstuvwxyz';

  it('round-trips encryption and decryption with the correct passcode', async () => {
    const ciphertext = await encryptApiKey(plaintext, passcode);
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext.length).toBeGreaterThan(0);

    const decrypted = await decryptApiKey(ciphertext, passcode);
    expect(decrypted).toBe(plaintext);
  });

  it('produces a unique ciphertext each encryption (random salt + IV)', async () => {
    const a = await encryptApiKey(plaintext, passcode);
    const b = await encryptApiKey(plaintext, passcode);
    expect(a).not.toBe(b);
  });

  it('deterministically derives the same key from the same passcode and salt (PBKDF2)', async () => {
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const keyA = await deriveKey(passcode, salt);
    const keyB = await deriveKey(passcode, salt);

    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const ciphertext = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyA,
      encoder.encode(plaintext)
    );

    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyB,
      ciphertext
    );
    expect(new TextDecoder().decode(decrypted)).toBe(plaintext);
  });

  it('fails to decrypt with a wrong passcode (GCM authentication)', async () => {
    const ciphertext = await encryptApiKey(plaintext, passcode);
    await expect(decryptApiKey(ciphertext, 'WrongPasscode!')).rejects.toThrow();
  });

  it('verifyPasscode returns true for the correct passcode and false otherwise', async () => {
    const ciphertext = await encryptApiKey(plaintext, passcode);
    expect(await verifyPasscode(ciphertext, passcode)).toBe(true);
    expect(await verifyPasscode(ciphertext, 'Nope')).toBe(false);
  });

  it('fails to decrypt when the ciphertext is tampered with (tag check)', async () => {
    const ciphertext = await encryptApiKey(plaintext, passcode);

    const bytes = Buffer.from(ciphertext, 'base64');
    const lastIndex = bytes.length - 1;
    bytes[lastIndex] = bytes[lastIndex] ^ 0x01;
    const tampered = bytes.toString('base64');

    await expect(decryptApiKey(tampered, passcode)).rejects.toThrow();
  });

  it('fails to decrypt a malformed payload', async () => {
    await expect(decryptApiKey('not-valid-base64!!!', passcode)).rejects.toThrow();
  });
});
