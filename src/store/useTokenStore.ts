import { create } from 'zustand';
import { validateApiKey } from '@/lib/validation';
import { fetchOpenRouterTelemetry, pollProviderTelemetry } from '@/lib/adapters';
import { encryptApiKey, decryptApiKey } from '@/lib/cryptoVault';
import {
  storeEncryptedKey,
  getEncryptedKey,
  removeEncryptedKey,
  clearVault,
  hasAnyEncryptedKey,
} from '@/lib/vault';
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
  providerId: ProviderId;
  status: 'healthy' | 'degraded' | 'offline' | 'NORMAL' | 'WARN' | 'EXHAUSTED';
  latencyMs: number;
  uptime: string;
}

export interface VaultStatusInfo {
  isEncrypted: boolean;
  algorithm: string;
  keysConfiguredCount: number;
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

const MOCK_TIMELINE: TimelineDataPoint[] = [
  { time: '00:00', gpt4o: 12000, claudeSonnet: 8500, openRouter: 4200 },
  { time: '04:00', gpt4o: 8000, claudeSonnet: 5100, openRouter: 2100 },
  { time: '08:00', gpt4o: 28000, claudeSonnet: 19400, openRouter: 9800 },
  { time: '12:00', gpt4o: 45000, claudeSonnet: 32000, openRouter: 14500 },
  { time: '16:00', gpt4o: 52000, claudeSonnet: 41000, openRouter: 18200 },
  { time: '20:00', gpt4o: 31000, claudeSonnet: 22000, openRouter: 11000 },
];

const MOCK_SPEND: ModelSpendPoint[] = [
  { name: 'GPT-4o (OpenAI)', value: 78.30, color: '#00f3ff' },
  { name: 'Claude 3.5 Sonnet', value: 48.20, color: '#a855f7' },
  { name: 'OpenRouter Models', value: 16.00, color: '#10b981' },
  { name: 'Grok 2 (xAI)', value: 12.40, color: '#f59e0b' },
];

const MOCK_HEALTH: ProviderHealthInfo[] = [
  { name: 'OpenAI', providerId: 'openai', status: 'healthy', latencyMs: 380, uptime: '99.98%' },
  { name: 'Anthropic', providerId: 'anthropic', status: 'healthy', latencyMs: 440, uptime: '99.95%' },
  { name: 'OpenRouter', providerId: 'openrouter', status: 'degraded', latencyMs: 820, uptime: '98.80%' },
];

interface TokenStore {
  accounts: ProviderAccount[];
  usageLogs: UsageLog[];
  logs: UsageLog[];
  isPolling: boolean;
  lastRefreshAt: string | null;
  lastSync: string | null;
  masterPasscode: string | null;
  hasKeys: boolean;

  isMockMode: boolean;
  toggleMockMode: () => void;
  timelineData: TimelineDataPoint[];
  modelSpendData: ModelSpendPoint[];
  providerHealth: ProviderHealthInfo[];

  getVaultStatus: () => VaultStatusInfo;
  getKPIMetrics: () => KPIMetrics;
  setMasterPasscode: (passcode: string | null) => void;
  pollAllProviders: () => Promise<void>;
  syncNow: () => Promise<void>;
  getMetricsSummary: () => MetricsSummary;
  saveApiKeys: (keys: ApiKeysInput) => Promise<{ success: boolean; error?: string }>;
  clearApiKeys: () => void;
  checkKeysStatus: () => boolean;
}

function deriveStatus(rateLimit: RateLimitStatus | null): ProviderStatus {
  if (!rateLimit) return 'WARN';

  const ratios: number[] = [];
  const checks = [
    { remaining: rateLimit.requestsRemaining, limit: rateLimit.requestsLimit },
    { remaining: rateLimit.tokensRemaining, limit: rateLimit.tokensLimit },
    { remaining: rateLimit.creditsRemaining, limit: rateLimit.creditsLimit },
  ];

  for (const { remaining, limit } of checks) {
    if (
      remaining === undefined ||
      remaining === null ||
      limit === undefined ||
      limit === null ||
      limit <= 0
    ) {
      continue;
    }
    ratios.push(remaining / limit);
  }

  if (ratios.length === 0) return 'NORMAL';

  const lowest = Math.min(...ratios);
  if (lowest <= 0.05) return 'EXHAUSTED';
  if (lowest <= 0.25) return 'WARN';
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
  lastRefreshAt: MOCK_LAST_REFRESH_AT,
  lastSync: MOCK_LAST_REFRESH_AT,
  masterPasscode: null,
  hasKeys: false,

  isMockMode: true,
  timelineData: MOCK_TIMELINE,
  modelSpendData: MOCK_SPEND,
  providerHealth: MOCK_HEALTH,

  toggleMockMode: () => set((state) => ({ isMockMode: !state.isMockMode })),

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

  setMasterPasscode: (passcode) => set({ masterPasscode: passcode }),

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
      if (rawKey === undefined) return;

      if (!rawKey.trim()) {
        removeEncryptedKey(providerId as any);
        return;
      }

      const validation = validateApiKey(providerId, rawKey);
      if (!validation.isValid) {
        throw new Error(`[${providerId}] ${validation.error}`);
      }

      const enc = await encryptApiKey(validation.sanitizedKey, passcode);
      storeEncryptedKey(providerId as any, enc);
    };

    try {
      await processKey('openai', keys.openai);
      await processKey('anthropic', keys.anthropic);
      await processKey('openrouter', keys.openrouter);
      await processKey('grok', keys.grok);

      const hasConfigured = hasAnyEncryptedKey();
      set({ hasKeys: hasConfigured, isMockMode: false });

      if (hasConfigured) {
        void get().syncNow();
      }
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      return { success: false, error: errorMessage };
    }
  },

  clearApiKeys: () => {
    clearVault();
    set({ hasKeys: false });
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
          let telemetry;

          if (account.providerId === 'openrouter') {
            telemetry = await fetchOpenRouterTelemetry(apiKey);
          } else {
            telemetry = await pollProviderTelemetry(account.providerId, apiKey);
          }

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