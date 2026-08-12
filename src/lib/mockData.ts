import type { ProviderAccount } from '@/store/useTokenStore';
import type { ProviderId, RateLimitStatus, UsageLog } from '@/types';

const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'o1-mini'];
const ANTHROPIC_MODELS = ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'];
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'];

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function createRateLimit(
  partial: Partial<RateLimitStatus> & Pick<RateLimitStatus, 'polledAt'>
): RateLimitStatus {
  return {
    requestsRemaining: partial.requestsRemaining ?? null,
    requestsLimit: partial.requestsLimit ?? null,
    tokensRemaining: partial.tokensRemaining ?? null,
    tokensLimit: partial.tokensLimit ?? null,
    creditsRemaining: partial.creditsRemaining ?? null,
    creditsLimit: partial.creditsLimit ?? null,
    resetAt: partial.resetAt ?? null,
    polledAt: partial.polledAt,
  };
}

export const MOCK_ACCOUNTS: ProviderAccount[] = [
  {
    id: 'openai-prod',
    providerId: 'openai',
    name: 'OpenAI',
    status: 'NORMAL',
    rateLimit: createRateLimit({
      requestsRemaining: 482,
      requestsLimit: 500,
      tokensRemaining: 138_420,
      tokensLimit: 150_000,
      polledAt: hoursAgo(0.05),
      resetAt: '42s',
    }),
  },
  {
    id: 'anthropic-prod',
    providerId: 'anthropic',
    name: 'Anthropic',
    status: 'WARN',
    rateLimit: createRateLimit({
      requestsRemaining: 142,
      requestsLimit: 1000,
      tokensRemaining: 18_600,
      tokensLimit: 80_000,
      polledAt: hoursAgo(0.08),
      resetAt: '2026-08-04T18:01:00Z',
    }),
  },
  {
    id: 'groq-prod',
    providerId: 'groq',
    name: 'Groq',
    status: 'EXHAUSTED',
    rateLimit: createRateLimit({
      requestsRemaining: 3,
      requestsLimit: 100,
      tokensRemaining: 1_240,
      tokensLimit: 32_000,
      polledAt: hoursAgo(0.12),
      resetAt: '58s',
    }),
  },
];

function buildLog(
  index: number,
  providerId: ProviderId,
  model: string,
  hoursBack: number,
  inputTokens: number,
  outputTokens: number,
  requests: number,
  cost: number
): UsageLog {
  return {
    id: `mock-log-${index}`,
    providerId,
    model,
    timestamp: hoursAgo(hoursBack),
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    requests,
    cost,
  };
}

export const MOCK_USAGE_LOGS: UsageLog[] = [
  buildLog(1, 'openai', 'gpt-4o', 2, 8420, 1260, 18, 0.42),
  buildLog(2, 'anthropic', 'claude-3-5-sonnet-latest', 4, 6230, 980, 12, 0.31),
  buildLog(3, 'groq', 'llama-3.3-70b-versatile', 6, 4120, 640, 24, 0.08),
  buildLog(4, 'openai', 'gpt-4o-mini', 8, 2840, 420, 31, 0.06),
  buildLog(5, 'anthropic', 'claude-3-5-haiku-latest', 10, 1920, 310, 15, 0.04),
  buildLog(6, 'groq', 'mixtral-8x7b-32768', 12, 3560, 520, 28, 0.05),
  buildLog(7, 'openai', 'o1-mini', 14, 5120, 890, 9, 0.28),
  buildLog(8, 'openai', 'gpt-4o', 18, 9340, 1420, 22, 0.51),
  buildLog(9, 'anthropic', 'claude-3-5-sonnet-latest', 22, 7120, 1180, 14, 0.36),
  buildLog(10, 'groq', 'llama-3.3-70b-versatile', 26, 4680, 720, 35, 0.09),
  buildLog(11, 'openai', 'gpt-4o-mini', 30, 3240, 510, 42, 0.07),
  buildLog(12, 'anthropic', 'claude-3-5-haiku-latest', 34, 2180, 360, 19, 0.05),
  buildLog(13, 'groq', 'mixtral-8x7b-32768', 38, 3890, 580, 31, 0.06),
  buildLog(14, 'openai', 'gpt-4o', 42, 8760, 1310, 20, 0.44),
  buildLog(15, 'anthropic', 'claude-3-5-sonnet-latest', 48, 6540, 1020, 11, 0.33),
  buildLog(16, 'groq', 'llama-3.3-70b-versatile', 54, 4320, 670, 26, 0.08),
  buildLog(17, 'openai', 'o1-mini', 60, 5480, 920, 8, 0.3),
  buildLog(18, 'openai', 'gpt-4o-mini', 68, 2980, 440, 38, 0.06),
  buildLog(19, 'anthropic', 'claude-3-5-haiku-latest', 76, 2040, 330, 17, 0.04),
  buildLog(20, 'groq', 'mixtral-8x7b-32768', 84, 3720, 560, 29, 0.06),
  buildLog(21, 'openai', 'gpt-4o', 92, 9120, 1380, 21, 0.48),
  buildLog(22, 'anthropic', 'claude-3-5-sonnet-latest', 100, 6880, 1100, 13, 0.35),
  buildLog(23, 'groq', 'llama-3.3-70b-versatile', 108, 4460, 690, 27, 0.08),
  buildLog(24, 'openai', 'gpt-4o-mini', 118, 3120, 480, 40, 0.07),
  buildLog(25, 'anthropic', 'claude-3-5-haiku-latest', 128, 2100, 340, 16, 0.05),
  buildLog(26, 'groq', 'mixtral-8x7b-32768', 138, 3810, 570, 30, 0.06),
  buildLog(27, 'openai', 'o1-mini', 148, 5320, 880, 7, 0.29),
  buildLog(28, 'openai', 'gpt-4o', 158, 8640, 1290, 19, 0.43),
  buildLog(29, 'anthropic', 'claude-3-5-sonnet-latest', 162, 6720, 1050, 10, 0.34),
  buildLog(30, 'groq', 'llama-3.3-70b-versatile', 166, 4580, 710, 32, 0.09),
];

export const PROVIDER_MODELS: Record<'openai' | 'anthropic' | 'groq', string[]> = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  groq: GROQ_MODELS,
};

