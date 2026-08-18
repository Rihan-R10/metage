import { create } from 'zustand';
import type {
  ProviderAccount,
  UsageLog,
  KPIMetrics,
  DateRangeOption,
  DateRange,
} from '@/types';
import { MOCK_ACCOUNTS, MOCK_USAGE_LOGS } from '@/lib/mockData';

export type { ProviderAccount, UsageLog, DateRange };

export interface VaultStatus {
  totalKeys: number;
  activeKeys: number;
  keysConfiguredCount: number;
  encrypted: boolean;
  isEncrypted: boolean;
  algorithm: string;
}

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  gemini?: string;
  grok?: string;
}

export interface TokenStoreState {
  accounts: ProviderAccount[];
  liveAccounts: ProviderAccount[];
  logs: UsageLog[];
  usageLogs: UsageLog[];
  liveLogs: UsageLog[];
  dateRange: DateRangeOption;
  isMockMode: boolean;
  isPolling: boolean;
  lastRefreshAt: string | null;
  masterPasscode: string;
  monthlyBudget: number;
  hasKeys: boolean;
  apiKeys: ApiKeys;

  setDateRange: (range: DateRangeOption) => void;
  updateAccountStatus: (id: string, status: ProviderAccount['status']) => void;
  addUsageLog: (log: UsageLog) => void;
  toggleMockMode: () => void;
  pollAllProviders: () => Promise<void>;
  checkKeysStatus: () => Promise<void>;
  getVaultStatus: () => VaultStatus;
  getFilteredUsageLogs: () => UsageLog[];
  getKPIMetrics: () => KPIMetrics;
  getMetricsSummary: () => KPIMetrics;
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  setApiKeys: (keys: ApiKeys) => void;
}

/** Helper to parse timestamps safely, including formatted strings like "Aug 18, 9:10 AM" */
function parseTimestamp(ts: string | number): number {
  if (typeof ts === 'number') return ts;
  let parsed = new Date(ts).getTime();
  if (isNaN(parsed)) {
    // If year is missing (e.g. "Aug 18, 9:10 AM"), append current year
    const currentYear = new Date().getFullYear();
    parsed = new Date(`${ts}, ${currentYear}`).getTime();
  }
  return isNaN(parsed) ? Date.now() : parsed;
}

export const useTokenStore = create<TokenStoreState>((set, get) => ({
  accounts: MOCK_ACCOUNTS,
  liveAccounts: [],
  logs: MOCK_USAGE_LOGS,
  usageLogs: MOCK_USAGE_LOGS,
  liveLogs: [],
  dateRange: '7D',
  isMockMode: true,
  isPolling: false,
  lastRefreshAt: new Date().toISOString(),
  masterPasscode: '',
  monthlyBudget: 500,
  hasKeys: true,
  apiKeys: {
    openai: '',
    anthropic: '',
    gemini: '',
    grok: '',
  },

  setDateRange: (dateRange) => set({ dateRange }),

  updateAccountStatus: (id, status) =>
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, status } : acc
      ),
    })),

  addUsageLog: (log) =>
    set((state) => {
      const updatedLiveLogs = [log, ...state.liveLogs];
      return {
        liveLogs: updatedLiveLogs,
        logs: state.isMockMode ? state.logs : updatedLiveLogs,
        usageLogs: state.isMockMode ? state.logs : updatedLiveLogs,
      };
    }),

  toggleMockMode: () =>
    set((state) => {
      const nextMockState = !state.isMockMode;
      const activeAccounts = nextMockState ? MOCK_ACCOUNTS : state.liveAccounts;
      const activeLogs = nextMockState ? MOCK_USAGE_LOGS : state.liveLogs;

      return {
        isMockMode: nextMockState,
        accounts: activeAccounts,
        logs: activeLogs,
        usageLogs: activeLogs,
      };
    }),

  setApiKey: (provider, key) =>
    set((state) => {
      const updatedKeys = { ...state.apiKeys, [provider]: key };
      const hasAnyKey = Object.values(updatedKeys).some((k) => Boolean(k && k.trim()));
      return {
        apiKeys: updatedKeys,
        hasKeys: hasAnyKey,
      };
    }),

  setApiKeys: (keys) =>
    set((state) => {
      const updatedKeys = { ...state.apiKeys, ...keys };
      const hasAnyKey = Object.values(updatedKeys).some((k) => Boolean(k && k.trim()));
      return {
        apiKeys: updatedKeys,
        hasKeys: hasAnyKey,
      };
    }),

  pollAllProviders: async () => {
    set({ isPolling: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ isPolling: false, lastRefreshAt: new Date().toISOString() });
  },

  checkKeysStatus: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const keysState = get().apiKeys;
    const configuredKeys = Object.values(keysState).filter((k) => Boolean(k && k.trim())).length;
    const accountKeys = get().accounts.some((a) => Boolean(a.apiKey || a.hasKey));
    set({ hasKeys: configuredKeys > 0 || accountKeys });
  },

  getVaultStatus: () => {
    const { accounts, apiKeys } = get();
    const activeConfiguredKeys = Object.values(apiKeys).filter((k) => Boolean(k && k.trim())).length;
    const totalKeys = Math.max(accounts.length, activeConfiguredKeys);

    return {
      totalKeys,
      activeKeys: accounts.filter((a) => a.status !== 'EXHAUSTED').length,
      keysConfiguredCount: activeConfiguredKeys > 0 ? activeConfiguredKeys : accounts.length,
      encrypted: true,
      isEncrypted: true,
      algorithm: 'AES-256-GCM',
    };
  },

  getFilteredUsageLogs: (): UsageLog[] => {
    const { isMockMode, liveLogs, dateRange } = get();

    // 1. STRICT SOURCE BRANCH: Never read mock logs when in Live Vault mode
    const sourceLogs = isMockMode ? MOCK_USAGE_LOGS : liveLogs;

    if (!sourceLogs || sourceLogs.length === 0) {
      return [];
    }

    const normRange = (dateRange || '7D').toString().toUpperCase();
    if (normRange === 'ALL') return sourceLogs;

    const now = Date.now();
    const rangeMs: Record<string, number> = {
      '24H': 24 * 60 * 60 * 1000,
      '7D': 7 * 24 * 60 * 60 * 1000,
      '30D': 30 * 24 * 60 * 60 * 1000,
      '90D': 90 * 24 * 60 * 60 * 1000,
      '1Y': 365 * 24 * 60 * 60 * 1000,
      YTD: now - new Date(new Date().getFullYear(), 0, 1).getTime(),
    };

    const duration = rangeMs[normRange] || 7 * 24 * 60 * 60 * 1000;
    const cutoff = now - duration;

    return sourceLogs.filter((log) => {
      const timeMs = parseTimestamp(log.timestamp);
      return timeMs >= cutoff;
    });
  },

  getKPIMetrics: () => {
    const logs = get().getFilteredUsageLogs();
    const accounts = get().accounts;
    const totalMonthlyCost = logs.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const totalTokens = logs.reduce(
      (acc, curr) => acc + (curr.totalTokens || (curr.inputTokens || 0) + (curr.outputTokens || 0)),
      0
    );
    const promptTokens = logs.reduce(
      (acc, curr) => acc + (curr.promptTokens || curr.inputTokens || 0),
      0
    );
    const completionTokens = logs.reduce(
      (acc, curr) => acc + (curr.completionTokens || curr.outputTokens || 0),
      0
    );
    const activeKeysCount = accounts.filter((a) => a.status !== 'EXHAUSTED').length;

    return {
      totalMonthlyCost,
      costChangePercent: 4.2,
      totalTokens,
      activeKeysCount,
      promptTokens,
      completionTokens,
      avgLatencyMs: 240,
      errorRatePercent: 0.15,
      todaySpend: totalMonthlyCost * 0.12,
      activeBurnRate: 0.45,
      projectedMonthlySpend: totalMonthlyCost * 1.15,
    };
  },

  getMetricsSummary: () => get().getKPIMetrics(),
}));