'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Trash2, Shield, Lock, Unlock } from 'lucide-react';
import {
  loadSavedKeys,
  saveKeysToStorage,
  encryptApiKey,
  decryptApiKey,
  verifyPasscode,
  verifyOpenAIKey,
  verifyAnthropicKey,
  verifyGeminiKey,
  verifyGrokKey,
  ApiKeys,
  KeyStatuses,
} from '@/lib/apiVault';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProviderId = keyof ApiKeys;

interface ProviderConfig {
  id: ProviderId;
  name: string;
  placeholder: string;
}

const PROVIDERS: ProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'gemini', name: 'Google Gemini', placeholder: 'AIzaSy...' },
  { id: 'grok', name: 'xAI Grok', placeholder: 'xai-...' },
];

const PASSCODE_STORAGE_KEY = 'api_vault_passcode_hash_v1';

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [isSettingNewPasscode, setIsSettingNewPasscode] = useState(() =>
    typeof window === 'undefined'
      ? false
      : !Boolean(localStorage.getItem(PASSCODE_STORAGE_KEY))
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [keys, setKeys] = useState<ApiKeys>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<ProviderId, boolean>>({
    openai: false,
    anthropic: false,
    gemini: false,
    grok: false,
  });
  const [statuses, setStatuses] = useState<KeyStatuses>({
    openai: 'unconfigured',
    anthropic: 'unconfigured',
    gemini: 'unconfigured',
    grok: 'unconfigured',
  });

  const handleUnlockOrCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const savedEncryptedKeys = loadSavedKeys() as unknown as Record<string, string>;

      if (isSettingNewPasscode) {
        if (passcode.length < 6) {
          throw new Error('Master passcode must be at least 6 characters.');
        }
        if (passcode !== confirmPasscode) {
          throw new Error('Passcodes do not match.');
        }

        const testToken = await encryptApiKey('VALID_VAULT_PASSCODE', passcode);
        localStorage.setItem(PASSCODE_STORAGE_KEY, testToken);
        setIsLocked(false);
        await decryptAllKeys(passcode, savedEncryptedKeys);
      } else {
        const storedToken = localStorage.getItem(PASSCODE_STORAGE_KEY);
        if (!storedToken) {
          setIsSettingNewPasscode(true);
          throw new Error('No passcode set. Please create a new master passcode.');
        }

        const isValid = await verifyPasscode(storedToken, passcode);
        if (!isValid) {
          throw new Error('Incorrect master passcode.');
        }

        setIsLocked(false);
        await decryptAllKeys(passcode, savedEncryptedKeys);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const decryptAllKeys = async (pass: string, encryptedStore: Record<string, string>) => {
    const decrypted: ApiKeys = {};
    for (const provider of PROVIDERS) {
      const encVal = encryptedStore[provider.id];
      if (encVal) {
        try {
          decrypted[provider.id] = await decryptApiKey(encVal, pass);
          testKey(provider.id, decrypted[provider.id] || '');
        } catch {
          decrypted[provider.id] = '';
        }
      }
    }
    setKeys(decrypted);
  };

  const testKey = async (provider: ProviderId, keyVal: string) => {
    if (!keyVal) {
      setStatuses((prev) => ({ ...prev, [provider]: 'unconfigured' }));
      return;
    }

    setStatuses((prev) => ({ ...prev, [provider]: 'testing' }));

    let isValid = false;
    switch (provider) {
      case 'openai':
        isValid = await verifyOpenAIKey(keyVal);
        break;
      case 'anthropic':
        isValid = await verifyAnthropicKey(keyVal);
        break;
      case 'gemini':
        isValid = await verifyGeminiKey(keyVal);
        break;
      case 'grok':
        isValid = await verifyGrokKey(keyVal);
        break;
    }

    setStatuses((prev) => ({ ...prev, [provider]: isValid ? 'valid' : 'invalid' }));
  };

  const handleSave = async (provider: ProviderId, keyVal: string) => {
    try {
      const encrypted = keyVal ? await encryptApiKey(keyVal, passcode) : '';
      const updatedStorage: ApiKeys = { ...loadSavedKeys(), [provider]: encrypted };
      saveKeysToStorage(updatedStorage);

      setKeys((prev) => ({ ...prev, [provider]: keyVal }));
      testKey(provider, keyVal);
    } catch (err) {
      console.error('Failed to encrypt/save key:', err);
    }
  };

  const handleClear = (provider: ProviderId) => {
    handleSave(provider, '');
    setStatuses((prev) => ({ ...prev, [provider]: 'unconfigured' }));
  };

  const toggleVisibility = (provider: ProviderId) => {
    setVisibleKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">API Key Vault</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">
            ✕
          </button>
        </div>

        {isLocked ? (
          <form onSubmit={handleUnlockOrCreate} className="space-y-4">
            <div className="flex flex-col items-center justify-center text-center py-4 space-y-2">
              <div className="p-3 bg-zinc-800 rounded-full text-cyan-400 mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                {isSettingNewPasscode ? 'Create Master Passcode' : 'Unlock API Vault'}
              </h3>
              <p className="text-xs text-zinc-400 px-4">
                {isSettingNewPasscode
                  ? 'Set a master passcode to securely encrypt your API keys locally using AES-GCM.'
                  : 'Enter your master passcode to decrypt and access your stored keys.'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-mono">Master Passcode</label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              {isSettingNewPasscode && (
                <div>
                  <label className="text-xs text-zinc-300 font-mono">Confirm Passcode</label>
                  <input
                    type="password"
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value)}
                    placeholder="Confirm passcode..."
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {errorMsg && <p className="text-xs text-rose-400 font-mono">{errorMsg}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isSettingNewPasscode ? 'Set Passcode & Encrypt Vault' : 'Unlock Vault'}
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <Unlock className="w-4 h-4" /> Vault Unlocked
              </div>
              <button
                onClick={() => setIsLocked(true)}
                className="text-xs text-zinc-400 hover:text-white underline font-mono"
              >
                Lock Vault
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Keys are encrypted locally in your browser storage and never sent to our servers.
            </p>

            <div className="space-y-4">
              {PROVIDERS.map((provider) => {
                const status = statuses[provider.id] || 'unconfigured';
                const keyVal = keys[provider.id] || '';
                const isVisible = Boolean(visibleKeys[provider.id]);

                return (
                  <div key={provider.id} className="space-y-2 pt-2 first:pt-0 border-t border-zinc-800/60 first:border-none">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>{provider.name} API Key</span>
                      {status === 'testing' && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Testing
                        </span>
                      )}
                      {status === 'valid' && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      )}
                      {status === 'invalid' && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Invalid
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={keyVal}
                        onChange={(e) => setKeys({ ...keys, [provider.id]: e.target.value })}
                        placeholder={provider.placeholder}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white pr-20 focus:outline-none focus:border-cyan-500"
                      />
                      <div className="absolute right-2 top-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleVisibility(provider.id)}
                          className="text-zinc-400 hover:text-white p-1"
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {keyVal && (
                          <button
                            type="button"
                            onClick={() => handleClear(provider.id)}
                            className="text-zinc-400 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSave(provider.id, keyVal)}
                      className="w-full py-1.5 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition"
                    >
                      Save & Test {provider.name} Key
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs rounded-lg transition mt-4"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ApiKeyModal;