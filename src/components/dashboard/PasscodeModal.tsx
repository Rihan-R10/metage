// src/components/PasscodeModal.tsx
'use client';

import React, { useState } from 'react';

interface PasscodeModalProps {
  isOpen: boolean;
  mode: 'SET' | 'UNLOCK';
  onConfirm: (passcode: string) => void;
  onCancel?: () => void;
}

export function PasscodeModal({ isOpen, mode, onConfirm, onCancel }: PasscodeModalProps) {
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passcode.length < 6) {
      setError('Passcode must be at least 6 characters long.');
      return;
    }

    if (mode === 'SET' && passcode !== confirmPasscode) {
      setError('Passcodes do not match.');
      return;
    }

    onConfirm(passcode);
    setPasscode('');
    setConfirmPasscode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-6 border border-slate-800 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">
          {mode === 'SET' ? 'Set Master Passcode' : 'Unlock Your Vault'}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {mode === 'SET'
            ? 'This passcode derives your AES-256 key. It is never stored on disk.'
            : 'Enter your passcode to decrypt your local API keys.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Master Passcode
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {mode === 'SET' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm Passcode
              </label>
              <input
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            >
              {mode === 'SET' ? 'Save Passcode' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}