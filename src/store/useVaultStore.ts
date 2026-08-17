import { create } from 'zustand';
import { ApiKeys, KeyStatuses, ProviderId } from '@/types/telemetry';

interface VaultState {
  isLocked: boolean;
  decryptedKeys: ApiKeys;
  statuses: KeyStatuses;
  unlockVault: (keys: ApiKeys) => void;
  lockVault: () => void;
  setKey: (provider: ProviderId, key: string) => void;
  setStatus: (provider: ProviderId, status: KeyStatuses[ProviderId]) => void;
  purgeVault: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  isLocked: true,
  decryptedKeys: {},
  statuses: {
    openai: 'unconfigured',
    anthropic: 'unconfigured',
    gemini: 'unconfigured',
    grok: 'unconfigured',
  },

  unlockVault: (keys) => set({ isLocked: false, decryptedKeys: keys }),
  lockVault: () => set({ isLocked: true, decryptedKeys: {} }),
  setKey: (provider, key) => set((state) => ({ decryptedKeys: { ...state.decryptedKeys, [provider]: key } })),
  setStatus: (provider, status) => set((state) => ({ statuses: { ...state.statuses, [provider]: status } })),
  purgeVault: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_api_keys_store_v1');
      localStorage.removeItem('api_vault_passcode_hash_v1');
    }
    set({
      isLocked: true,
      decryptedKeys: {},
      statuses: { openai: 'unconfigured', anthropic: 'unconfigured', gemini: 'unconfigured', grok: 'unconfigured' },
    });
  },
}));