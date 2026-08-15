'use client';

import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Trash2, Shield } from 'lucide-react';
import { loadSavedKeys, saveKeysToStorage, verifyOpenAIKey, verifyAnthropicKey, ApiKeys, KeyStatuses } from '@/lib/apiVault';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [statuses, setStatuses] = useState<KeyStatuses>({
    openai: 'unconfigured',
    anthropic: 'unconfigured',
    openrouter: 'unconfigured',
  });

  useEffect(() => {
    if (isOpen) {
      const saved = loadSavedKeys();
      setKeys(saved);
      if (saved.openai) testKey('openai', saved.openai);
      if (saved.anthropic) testKey('anthropic', saved.anthropic);
    }
  }, [isOpen]);

  const testKey = async (provider: 'openai' | 'anthropic', keyVal: string) => {
    if (!keyVal) {
      setStatuses((prev) => ({ ...prev, [provider]: 'unconfigured' }));
      return;
    }
    setStatuses((prev) => ({ ...prev, [provider]: 'testing' }));
    const isValid = provider === 'openai' ? await verifyOpenAIKey(keyVal) : await verifyAnthropicKey(keyVal);
    setStatuses((prev) => ({ ...prev, [provider]: isValid ? 'valid' : 'invalid' }));
  };

  const handleSave = (provider: 'openai' | 'anthropic', keyVal: string) => {
    const updated = { ...keys, [provider]: keyVal };
    setKeys(updated);
    saveKeysToStorage(updated);
    testKey(provider, keyVal);
  };

  const handleClear = (provider: 'openai' | 'anthropic') => {
    const updated = { ...keys, [provider]: '' };
    setKeys(updated);
    saveKeysToStorage(updated);
    setStatuses((prev) => ({ ...prev, [provider]: 'unconfigured' }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">API Key Vault</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">✕</button>
        </div>

        <p className="text-xs text-zinc-400">
          Keys are encrypted locally in your browser storage and never sent to our servers.
        </p>

        {/* OpenAI Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
            <span>OpenAI API Key</span>
            {statuses.openai === 'testing' && <span className="text-amber-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Testing</span>}
            {statuses.openai === 'valid' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
            {statuses.openai === 'invalid' && <span className="text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Invalid</span>}
          </div>
          <div className="relative">
            <input
              type={showOpenAI ? 'text' : 'password'}
              value={keys.openai || ''}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white pr-20 focus:outline-none focus:border-cyan-500"
            />
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <button onClick={() => setShowOpenAI(!showOpenAI)} className="text-zinc-400 hover:text-white p-1">
                {showOpenAI ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              {keys.openai && (
                <button onClick={() => handleClear('openai')} className="text-zinc-400 hover:text-rose-400 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => handleSave('openai', keys.openai || '')}
            className="w-full py-1.5 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition"
          >
            Save & Test OpenAI Key
          </button>
        </div>

        {/* Anthropic Key */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/60">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
            <span>Anthropic API Key</span>
            {statuses.anthropic === 'testing' && <span className="text-amber-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Testing</span>}
            {statuses.anthropic === 'valid' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
            {statuses.anthropic === 'invalid' && <span className="text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Invalid</span>}
          </div>
          <div className="relative">
            <input
              type={showAnthropic ? 'text' : 'password'}
              value={keys.anthropic || ''}
              onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
              placeholder="sk-ant-..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white pr-20 focus:outline-none focus:border-cyan-500"
            />
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <button onClick={() => setShowAnthropic(!showAnthropic)} className="text-zinc-400 hover:text-white p-1">
                {showAnthropic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              {keys.anthropic && (
                <button onClick={() => handleClear('anthropic')} className="text-zinc-400 hover:text-rose-400 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => handleSave('anthropic', keys.anthropic || '')}
            className="w-full py-1.5 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition"
          >
            Save & Test Anthropic Key
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs rounded-lg transition mt-4"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default ApiKeyModal;
