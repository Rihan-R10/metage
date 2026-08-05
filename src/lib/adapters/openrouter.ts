import type { ProviderStatus, ProviderTelemetry, UsageLog } from '@/types';
import { proxyFetch } from '@/lib/adapters/proxy';
import { createRateLimitStatus } from '@/lib/adapters/utils';

interface OpenRouterCreditsResponse {
  data?: {
    total_credits?: number;
    total_usage?: number;
  };
}

interface OpenRouterKeyResponse {
  data?: {
    label?: string;
    limit?: number | null;
    limit_remaining?: number | null;
    limit_reset?: string | null;
    usage?: number;
    is_free_tier?: boolean;
  };
}

export interface OpenRouterTelemetryResult extends ProviderTelemetry {
  totalSpend: number;
  status: ProviderStatus;
}

export async function fetchOpenRouterTelemetry(
  apiKey: string
): Promise<OpenRouterTelemetryResult> {
  const [creditsRes, keyRes] = await Promise.allSettled([
    proxyFetch({
      providerId: 'openrouter',
      apiKey,
      endpoint: '/credits',
    }),
    proxyFetch({
      providerId: 'openrouter',
      apiKey,
      endpoint: '/auth/key',
    }),
  ]);

  let totalCredits: number | null = null;
  let creditsUsage = 0;

  if (creditsRes.status === 'fulfilled' && creditsRes.value.ok) {
    try {
      const creditsPayload = await creditsRes.value.json<OpenRouterCreditsResponse>();
      if (creditsPayload?.data) {
        totalCredits = creditsPayload.data.total_credits ?? null;
        creditsUsage = creditsPayload.data.total_usage ?? 0;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  let limit: number | null = null;
  let limitRemaining: number | null = null;
  let resetAt: string | null = null;
  let keyUsage = 0;

  if (keyRes.status === 'fulfilled' && keyRes.value.ok) {
    try {
      const keyPayload = await keyRes.value.json<OpenRouterKeyResponse>();
      if (keyPayload?.data) {
        limit = keyPayload.data.limit ?? null;
        limitRemaining = keyPayload.data.limit_remaining ?? null;
        resetAt = keyPayload.data.limit_reset ?? null;
        keyUsage = keyPayload.data.usage ?? 0;
      }
    } catch {
      // Ignore JSON parse errors
    }
  } else {
    try {
      const fallbackKeyRes = await proxyFetch({
        providerId: 'openrouter',
        apiKey,
        endpoint: '/key',
      });
      if (fallbackKeyRes.ok) {
        const keyPayload = await fallbackKeyRes.json<OpenRouterKeyResponse>();
        if (keyPayload?.data) {
          limit = keyPayload.data.limit ?? null;
          limitRemaining = keyPayload.data.limit_remaining ?? null;
          resetAt = keyPayload.data.limit_reset ?? null;
          keyUsage = keyPayload.data.usage ?? 0;
        }
      }
    } catch {
      // Ignore fallback errors
    }
  }

  const totalSpend = Math.max(creditsUsage, keyUsage);

  const rateLimit = createRateLimitStatus({
    creditsRemaining:
      limitRemaining ?? (totalCredits !== null ? totalCredits - totalSpend : null),
    creditsLimit: limit ?? totalCredits,
    resetAt,
  });

  let status: ProviderStatus = 'NORMAL';
  if (
    rateLimit.creditsRemaining !== null &&
    rateLimit.creditsLimit !== null &&
    rateLimit.creditsLimit > 0
  ) {
    const ratio = rateLimit.creditsRemaining / rateLimit.creditsLimit;
    if (ratio <= 0.05) status = 'EXHAUSTED';
    else if (ratio <= 0.25) status = 'WARN';
  }

  const latestLogs: UsageLog[] = [
    {
      id: `openrouter-${Date.now()}`,
      providerId: 'openrouter',
      timestamp: new Date().toISOString(),
      cost: totalSpend,
    },
  ];

  return {
    rateLimit,
    latestLogs,
    totalSpend,
    status,
  };
}

export async function pollOpenRouter(
  apiKey: string
): Promise<ProviderTelemetry> {
  return fetchOpenRouterTelemetry(apiKey);
}
