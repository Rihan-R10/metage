export type ProviderId = 'openai' | 'anthropic' | 'groq' | 'openrouter' | 'gemini';

export type ProviderStatus = 'NORMAL' | 'WARN' | 'EXHAUSTED' | 'healthy' | 'degraded' | 'offline';

export type DateRangeOption = '24H' | '7D' | '30D' | '90D' | '1Y' | 'ALL' | '7d' | '30d' | '90d' | 'ytd';

export type DateRange = DateRangeOption;

export interface RateLimitStatus {
  requestsRemaining: number | null;
  requestsLimit: number | null;
  tokensRemaining: number | null;
  tokensLimit: number | null;
  creditsRemaining: number | null;
  creditsLimit: number | null;
  resetAt: string | null;
  polledAt: string;
}

export interface UsageLog {
  id: string;
  providerId: ProviderId;
  timestamp: string;
  inputTokens?: number;
  outputTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  requests?: number;
  cost?: number;
  model?: string;
  latencyMs?: number;
  status?: 'success' | 'error' | string;
}

export interface ProviderTelemetry {
  rateLimit: RateLimitStatus;
  latestLogs: UsageLog[];
}

export interface ProviderAccount {
  id: string;
  providerId: ProviderId;
  name: string;
  status: ProviderStatus;
  rateLimit: RateLimitStatus;
  apiKey?: string;
  hasKey?: boolean;
  balance?: number;
  usage?: number;
  limit?: number;
  lastSync?: string;
  errorMessage?: string;
  latencyMs?: number;
  errorRate?: number;
}

export interface KPIMetrics {
  totalMonthlyCost: number;
  costChangePercent: number;
  totalTokens: number;
  activeKeysCount: number;
  promptTokens: number;
  completionTokens: number;
  avgLatencyMs: number;
  errorRatePercent: number;
  todaySpend: number;
  activeBurnRate: number;
  projectedMonthlySpend: number;
}
export interface ProviderConfig {
  id: ProviderId;
  name: string;
}

export const PROVIDERS: ProviderConfig[] = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'groq', name: 'Groq' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'gemini', name: 'Google Gemini' },
];