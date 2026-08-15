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

export interface TokenStoreState {
  accounts: ProviderAccount[];
  logs: UsageLog[];
  usageLogs: UsageLog[];
  dateRange: DateRangeOption;
  isMockMode: boolean;
  isPolling: boolean;
  lastRefreshAt: string | null;
  masterPasscode: string;
  monthlyBudget: number;
  hasKeys: boolean;

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
}

export const useTokenStore = create<TokenStoreState>((set, get) => ({
  accounts: MOCK_ACCOUNTS,
  logs: MOCK_USAGE_LOGS,
  usageLogs: MOCK_USAGE_LOGS,
  dateRange: '7D',
  isMockMode: true,
  isPolling: false,
  lastRefreshAt: new Date().toISOString(),
  masterPasscode: '',
  monthlyBudget: 500,
  hasKeys: true,

  setDateRange: (dateRange) => set({ dateRange }),

  updateAccountStatus: (id, status) =>
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, status } : acc
      ),
    })),

  addUsageLog: (log) =>
    set((state) => {
      const updatedLogs = [log, ...state.logs];
      return {
        logs: updatedLogs,
        usageLogs: updatedLogs,
      };
    }),

  toggleMockMode: () => set((state) => ({ isMockMode: !state.isMockMode })),

  pollAllProviders: async () => {
    set({ isPolling: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ isPolling: false, lastRefreshAt: new Date().toISOString() });
  },

  checkKeysStatus: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ hasKeys: get().accounts.some((a) => Boolean(a.apiKey || a.hasKey)) });
  },

  getVaultStatus: () => {
    const accounts = get().accounts;
    const count = accounts.length;
    return {
      totalKeys: count,
      activeKeys: accounts.filter((a) => a.status !== 'EXHAUSTED').length,
      keysConfiguredCount: count,
      encrypted: true,
      isEncrypted: true,
      algorithm: 'AES-256-GCM',
    };
  },

  getFilteredUsageLogs: (): UsageLog[] => {
    const { logs, dateRange } = get();
    if (dateRange === 'ALL') return logs;
    const now = Date.now();
    const rangeMs: Record<string, number> = {
      '24H': 24 * 60 * 60 * 1000,
      '7D': 7 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30D': 30 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90D': 90 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1Y': 365 * 24 * 60 * 60 * 1000,
      ytd: now - new Date(new Date().getFullYear(), 0, 1).getTime(),
    };
    const cutoff = now - (rangeMs[dateRange] || 7 * 24 * 60 * 60 * 1000);
    return logs.filter((log) => new Date(log.timestamp).getTime() >= cutoff);
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