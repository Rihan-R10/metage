import { create } from 'zustand';
import { pollProviderTelemetry } from '@/lib/adapters';
import { decryptApiKey, getEncryptedKey } from '@/lib/vault';
import type { ProviderId, RateLimitStatus, UsageLog } from '@/types';

export type ProviderHealth = 'online' | 'degraded' | 'offline' | 'unknown';

export interface ProviderAccount {
  id: string;
  providerId: ProviderId;
  name: string;
  rateLimit: RateLimitStatus | null;
  health: ProviderHealth;
  errorMessage?: string;
}

export interface DashboardKpis {
  requestsRemaining: number | null;
  tokensRemaining: number | null;
  creditsRemaining: number | null;
  providersOnline: number;
  totalProviders: number;
}

const DEFAULT_ACCOUNTS: ProviderAccount[] = [
  {
    id: 'openai-default',
    providerId: 'openai',
    name: 'OpenAI',
    rateLimit: null,
    health: 'unknown',
  },
  {
    id: 'anthropic-default',
    providerId: 'anthropic',
    name: 'Anthropic',
    rateLimit: null,
    health: 'unknown',
  },
  {
    id: 'openrouter-default',
    providerId: 'openrouter',
    name: 'OpenRouter',
    rateLimit: null,
    health: 'unknown',
  },
];

function deriveHealth(rateLimit: RateLimitStatus | null): ProviderHealth {
  if (!rateLimit) {
    return 'unknown';
  }

  const checks: Array<{ remaining: number | null; limit: number | null }> = [
    {
      remaining: rateLimit.requestsRemaining,
      limit: rateLimit.requestsLimit,
    },
    {
      remaining: rateLimit.tokensRemaining,
      limit: rateLimit.tokensLimit,
    },
    {
      remaining: rateLimit.creditsRemaining,
      limit: rateLimit.creditsLimit,
    },
  ];

  for (const { remaining, limit } of checks) {
    if (remaining === null || limit === null || limit <= 0) {
      continue;
    }

    const ratio = remaining / limit;
    if (ratio <= 0.2) {
      return 'degraded';
    }
  }

  return 'online';
}

function sumNullable(values: Array<number | null>): number | null {
  const defined = values.filter((value): value is number => value !== null);
  if (defined.length === 0) {
    return null;
  }
  return defined.reduce((total, value) => total + value, 0);
}

interface TokenStore {
  accounts: ProviderAccount[];
  usageLogs: UsageLog[];
  isPolling: boolean;
  lastRefreshAt: string | null;
  masterPasscode: string | null;
  setMasterPasscode: (passcode: string | null) => void;
  pollAllProviders: () => Promise<void>;
  getKpis: () => DashboardKpis;
}

export const useTokenStore = create<TokenStore>((set, get) => ({
  accounts: DEFAULT_ACCOUNTS,
  usageLogs: [],
  isPolling: false,
  lastRefreshAt: null,
  masterPasscode: null,

  setMasterPasscode: (passcode) => set({ masterPasscode: passcode }),

  pollAllProviders: async () => {
    const { accounts, masterPasscode } = get();
    set({ isPolling: true });

    const updatedAccounts: ProviderAccount[] = [];
    const aggregatedLogs: UsageLog[] = [];

    for (const account of accounts) {
      const encryptedKey = getEncryptedKey(account.id);
      if (!encryptedKey || !masterPasscode) {
        updatedAccounts.push({
          ...account,
          health: 'unknown',
          errorMessage: 'No encrypted API key configured.',
        });
        continue;
      }

      try {
        const apiKey = await decryptApiKey(encryptedKey, masterPasscode);
        const telemetry = await pollProviderTelemetry(account.providerId, apiKey);

        updatedAccounts.push({
          ...account,
          rateLimit: telemetry.rateLimit,
          health: deriveHealth(telemetry.rateLimit),
          errorMessage: undefined,
        });
        aggregatedLogs.push(...telemetry.latestLogs);
      } catch (error) {
        updatedAccounts.push({
          ...account,
          health: 'offline',
          errorMessage:
            error instanceof Error ? error.message : 'Telemetry poll failed.',
        });
      }
    }

    aggregatedLogs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    set({
      accounts: updatedAccounts,
      usageLogs: aggregatedLogs,
      isPolling: false,
      lastRefreshAt: new Date().toISOString(),
    });
  },

  getKpis: () => {
    const { accounts } = get();

    return {
      requestsRemaining: sumNullable(
        accounts.map((account) => account.rateLimit?.requestsRemaining ?? null)
      ),
      tokensRemaining: sumNullable(
        accounts.map((account) => account.rateLimit?.tokensRemaining ?? null)
      ),
      creditsRemaining: sumNullable(
        accounts.map((account) => account.rateLimit?.creditsRemaining ?? null)
      ),
      providersOnline: accounts.filter((account) => account.health === 'online')
        .length,
      totalProviders: accounts.length,
    };
  },
}));
