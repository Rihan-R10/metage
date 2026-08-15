'use client';

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  openrouter?: string;
}

export interface KeyStatuses {
  openai: 'unconfigured' | 'valid' | 'invalid' | 'testing';
  anthropic: 'unconfigured' | 'valid' | 'invalid' | 'testing';
  openrouter: 'unconfigured' | 'valid' | 'invalid' | 'testing';
}

const STORAGE_KEY = 'tokendash_api_keys';

export function loadSavedKeys(): ApiKeys {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(atob(stored));
  } catch {
    return {};
  }
}

export function saveKeysToStorage(keys: ApiKeys): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, btoa(JSON.stringify(keys)));
  } catch (e) {
    console.error('Failed to save API keys', e);
  }
}

export async function verifyOpenAIKey(apiKey: string): Promise<boolean> {
  if (!apiKey || !apiKey.trim()) return false;
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function verifyAnthropicKey(apiKey: string): Promise<boolean> {
  if (!apiKey || !apiKey.trim()) return false;
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true',
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}
