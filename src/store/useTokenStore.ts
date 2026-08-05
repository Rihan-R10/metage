import { create } from 'zustand';
import { pollProviderTelemetry } from '@/lib/adapters';
import { decryptApiKey, getEncryptedKey } from '@/lib/vault';
import type { ProviderId, RateLimitStatus, UsageLog, ProviderStatus } from '@/types';
import { MOCK_ACCOUNTS, MOCK_LAST_REFRESH_AT, MOCK_REFERENCE_NOW, MOCK_USAGE_LOGS } from '@/lib/mockData';

export interface ProviderAccount {
  id: string;
  providerId: ProviderId;
  name: string;
  rateLimit: RateLimitStatus | null;
  status: ProviderStatus;
  errorMessage?: string;
}

export interface MetricsSummary {
  todaySpend: number;
  activeBurnRate: number;
  projectedMonthlySpend: number;
  totalTokens: number;
}

interface TokenStore {
  accounts: ProviderAccount[];
  usageLogs: UsageLog[];
  isPolling: boolean;
  lastRefreshAt: string | null;
  masterPasscode: string | null;
  setMasterPasscode: (passcode: string | null) => void;
  pollAllProviders: () => Promise<void>;
  getMetricsSummary: () => MetricsSummary;
}

function deriveStatus(rateLimit: RateLimitStatus | null): ProviderStatus {
  if (!rateLimit) {
    return 'WARN';
  }

  const ratios: number[] = [];

  for (const { remaining, limit } of [
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
  ]) {
    if (remaining === null || limit === null || limit <= 0) {
      continue;
    }
    ratios.push(remaining / limit);
  }

  if (ratios.length === 0) {
    return 'NORMAL';
  }

  const lowest = Math.min(...ratios);
  if (lowest <= 0.05) {
    return 'EXHAUSTED';
  }
  if (lowest <= 0.25) {
    return 'WARN';
  }
  return 'NORMAL';
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const useTokenStore = create<TokenStore>((set, get) => ({
  accounts: MOCK_ACCOUNTS,
  usageLogs: MOCK_USAGE_LOGS,
  isPolling: false,
  lastRefreshAt: MOCK_LAST_REFRESH_AT,
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
          status: account.status,
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
          status: deriveStatus(telemetry.rateLimit),
          errorMessage: undefined,
        });
        aggregatedLogs.push(...telemetry.latestLogs);
      } catch (error) {
        updatedAccounts.push({
          ...account,
          status: 'EXHAUSTED',
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
      accounts: updatedAccounts.length > 0 ? updatedAccounts : get().accounts,
      usageLogs:
        aggregatedLogs.length > 0 ? aggregatedLogs : get().usageLogs,
      isPolling: false,
      lastRefreshAt: new Date().toISOString(),
    });
  },

  getMetricsSummary: () => {
    const { usageLogs } = get();
    const now = new Date(MOCK_REFERENCE_NOW);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const todayLogs = usageLogs.filter((log) =>
      isSameDay(new Date(log.timestamp), now)
    );
    const recentLogs = usageLogs.filter(
      (log) => new Date(log.timestamp) >= last24Hours
    );

    const todaySpend = todayLogs.reduce((sum, log) => sum + (log.cost ?? 0), 0);
    const last24hSpend = recentLogs.reduce(
      (sum, log) => sum + (log.cost ?? 0),
      0
    );
    const activeBurnRate = last24hSpend / 24;
    const projectedMonthlySpend = activeBurnRate * 24 * 30;
    const totalTokens = usageLogs.reduce(
      (sum, log) => sum + (log.totalTokens ?? 0),
      0
    );

    return {
      todaySpend,
      activeBurnRate,
      projectedMonthlySpend,
      totalTokens,
    };
  },
}));
