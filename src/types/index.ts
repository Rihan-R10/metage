export type ProviderId = 'openai' | 'anthropic' | 'groq' | 'openrouter';

export type ProviderStatus = 'NORMAL' | 'WARN' | 'EXHAUSTED';

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
  totalTokens?: number;
  requests?: number;
  cost?: number;
  model?: string;
}

export interface ProviderTelemetry {
  rateLimit: RateLimitStatus;
  latestLogs: UsageLog[];
}
