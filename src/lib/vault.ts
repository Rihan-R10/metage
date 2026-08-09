const VAULT_STORAGE_KEY = 'tokendash_vault_keys';

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