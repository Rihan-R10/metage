import { create } from 'zustand';
import { pollProviderTelemetry } from '@/lib/adapters';
import {
  decryptApiKey,
  encryptApiKey,
  getEncryptedKey,
  storeEncryptedKey,
  removeEncryptedKey,
  clearVault,
  hasAnyEncryptedKey,
} from '@/lib/vault';
import { validateApiKey } from '@/lib/validation';
import type { ProviderId, RateLimitStatus, UsageLog, ProviderStatus } from '@/types';
import { MOCK_ACCOUNTS, MOCK_USAGE_LOGS } from '@/lib/mockData';


export type DateRange = '7d' | '30d' | '90d' | 'ytd';
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

export interface ApiKeysInput {
  openai?: string;
  anthropic?: string;
  openrouter?: string;
  grok?: string;
}

export interface TimelineDataPoint {
  time: string;
  gpt4o: number;
  claudeSonnet: number;
  openRouter: number;
}

export interface ModelSpendPoint {
  name: string;
  value: number;
  color: string;
}

export interface ProviderHealthInfo {
  name: string;
  uptime: string;
  latencyMs: number;
  status: string;
}

export interface KPIMetrics {
  totalMonthlyCost: number;
  costChangePercent: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  avgLatencyMs: number;
  todaySpend: number;
  activeBurnRate: number;
  projectedMonthlySpend: number;
}

export interface VaultStatusInfo {
  isEncrypted: boolean;
  algorithm: string;
  keysConfiguredCount: number;
}

export interface TokenStore {
  accounts: ProviderAccount[];
  usageLogs: UsageLog[];
  logs: UsageLog[];
  isPolling: boolean;
  lastRefreshAt: string | null;
  lastSync: string | null;
  masterPasscode: string | null;
  hasKeys: boolean;
  isMockMode: boolean;
  monthlyBudget: number;

  timelineData: TimelineDataPoint[];
  modelSpendData: ModelSpendPoint[];
  providerHealth: ProviderHealthInfo[];

  setMasterPasscode: (passcode: string | null) => void;
  setMonthlyBudget: (budget: number) => void;
  toggleMockMode: () => void;
  pollAllProviders: () => Promise<void>;
  syncNow: () => Promise<void>;
  getMetricsSummary: () => MetricsSummary;
  getKPIMetrics: () => KPIMetrics;
  getVaultStatus: () => VaultStatusInfo;
  saveApiKeys: (keys: ApiKeysInput) => Promise<{ success: boolean; error?: string }>;
  clearApiKeys: () => void;
  checkKeysStatus: () => boolean;

  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  getFilteredUsageLogs: () => UsageLog[];
}

export const MOCK_TIMELINE: TimelineDataPoint[] = [
  { time: '00:00', gpt4o: 1200, claudeSonnet: 800, openRouter: 400 },
  { time: '04:00', gpt4o: 1900, claudeSonnet: 1100, openRouter: 600 },
  { time: '08:00', gpt4o: 3400, claudeSonnet: 2400, openRouter: 1200 },
  { time: '12:00', gpt4o: 4800, claudeSonnet: 3100, openRouter: 1800 },
  { time: '16:00', gpt4o: 3800, claudeSonnet: 2800, openRouter: 1400 },
  { time: '20:00', gpt4o: 2600, claudeSonnet: 1900, openRouter: 900 },
];

export const MOCK_SPEND: ModelSpendPoint[] = [
  { name: 'OpenAI (GPT-4o)', value: 85.5, color: '#00f3ff' },
  { name: 'Anthropic (Claude 3.5)', value: 42.1, color: '#a855f7' },
  { name: 'OpenRouter / Grok', value: 14.9, color: '#10b981' },
];

export const MOCK_HEALTH: ProviderHealthInfo[] = [
  { name: 'OpenAI API', uptime: '99.98%', latencyMs: 180, status: 'operational' },
  { name: 'Anthropic API', uptime: '99.95%', latencyMs: 240, status: 'operational' },
  { name: 'OpenRouter', uptime: '99.90%', latencyMs: 310, status: 'degraded' },
];

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
  logs: MOCK_USAGE_LOGS,
  isPolling: false,
  lastRefreshAt: new Date().toISOString(),
  lastSync: new Date().toISOString(),
  masterPasscode: null,
  hasKeys: false,
  isMockMode: true,
  monthlyBudget: 150,

  timelineData: MOCK_TIMELINE,
  modelSpendData: MOCK_SPEND,
  providerHealth: MOCK_HEALTH,

  dateRange: '30d',

  setMasterPasscode: (passcode) => set({ masterPasscode: passcode }),
  setMonthlyBudget: (budget) => set({ monthlyBudget: budget }),
  toggleMockMode: () => set((state) => ({ isMockMode: !state.isMockMode })),

  setDateRange: (range) => set({ dateRange: range }),

  getFilteredUsageLogs: () => {
    const { usageLogs, dateRange } = get();
    const now = new Date();
    let cutoff: Date;

    if (dateRange === 'ytd') {
      cutoff = new Date(now.getFullYear(), 0, 1);
    } else {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    return usageLogs.filter((log) => new Date(log.timestamp) >= cutoff);
  },

  getVaultStatus: () => {
    let configuredCount = 0;
    if (getEncryptedKey('openai')) configuredCount++;
    if (getEncryptedKey('anthropic')) configuredCount++;
    if (getEncryptedKey('openrouter')) configuredCount++;
    if (getEncryptedKey('grok')) configuredCount++;

    return {
      isEncrypted: true,
      algorithm: 'AES-256-GCM',
      keysConfiguredCount: configuredCount > 0 ? configuredCount : (get().isMockMode ? 4 : 0),
    };
  },

  checkKeysStatus: () => {
    const hasConfigured = hasAnyEncryptedKey();
    set({ hasKeys: hasConfigured });
    return hasConfigured;
  },

  saveApiKeys: async (keys) => {
    let passcode = get().masterPasscode;
    if (!passcode) {
      passcode = 'tokendash-vault-passcode';
      set({ masterPasscode: passcode });
    }

    const processKey = async (providerId: string, rawKey: string | undefined) => {
      if (rawKey === undefined || rawKey === null) return;
      const trimmed = rawKey.trim();
      if (!trimmed) {
        removeEncryptedKey(providerId);
        return;
      }

      const validation = validateApiKey(providerId, trimmed);
      if (!validation.isValid) {
        throw new Error(`[${providerId}] ${validation.error}`);
      }

      const enc = await encryptApiKey(validation.sanitizedKey, passcode);
      storeEncryptedKey(providerId, enc);
    };

    try {
      if (keys.openai !== undefined) await processKey('openai', keys.openai);
      if (keys.anthropic !== undefined) await processKey('anthropic', keys.anthropic);
      if (keys.openrouter !== undefined) await processKey('openrouter', keys.openrouter);
      if (keys.grok !== undefined) await processKey('grok', keys.grok);

      const hasConfigured = hasAnyEncryptedKey();
      set({ hasKeys: hasConfigured, isMockMode: !hasConfigured });

      if (hasConfigured) {
        void get().pollAllProviders();
      }
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      throw new Error(errorMessage);
    }
  },

  clearApiKeys: () => {
    clearVault();
    set({ hasKeys: false, isMockMode: true });
  },

  syncNow: async () => {
    await get().pollAllProviders();
  },

  pollAllProviders: async () => {
    const { accounts, masterPasscode } = get();
    const passcode = masterPasscode ?? 'tokendash-vault-passcode';
    set({ isPolling: true });

    try {
      const updatedAccounts: ProviderAccount[] = [];
      const aggregatedLogs: UsageLog[] = [];

      for (const account of accounts) {
        const encryptedKey =
          getEncryptedKey(account.id) ?? getEncryptedKey(account.providerId);
        if (!encryptedKey) {
          updatedAccounts.push({
            ...account,
            status: account.status,
            errorMessage: 'No encrypted API key configured.',
          });
          continue;
        }

        try {
          const apiKey = await decryptApiKey(encryptedKey, passcode);
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

      const nowIso = new Date().toISOString();
      const finalLogs =
        aggregatedLogs.length > 0 ? aggregatedLogs : get().usageLogs;

      set({
        accounts: updatedAccounts.length > 0 ? updatedAccounts : get().accounts,
        usageLogs: finalLogs,
        logs: finalLogs,
        lastRefreshAt: nowIso,
        lastSync: nowIso,
      });
    } finally {
      set({ isPolling: false });
    }
  },

  getMetricsSummary: () => {
    const { usageLogs, isMockMode } = get();

    if (isMockMode) {
      return {
        todaySpend: 14.25,
        activeBurnRate: 0.59,
        projectedMonthlySpend: 142.50,
        totalTokens: 4200000,
      };
    }

    const now = new Date();
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

  getKPIMetrics: () => {
    const summary = get().getMetricsSummary();
    const { isMockMode } = get();

    return {
      totalMonthlyCost: isMockMode ? 142.50 : (summary.projectedMonthlySpend || 0),
      costChangePercent: 12,
      totalTokens: isMockMode ? 4200000 : summary.totalTokens,
      promptTokens: isMockMode ? 3100000 : Math.round(summary.totalTokens * 0.74),
      completionTokens: isMockMode ? 1100000 : Math.round(summary.totalTokens * 0.26),
      avgLatencyMs: 420,
      todaySpend: summary.todaySpend,
      activeBurnRate: summary.activeBurnRate,
      projectedMonthlySpend: summary.projectedMonthlySpend,
    };
  },
}));
