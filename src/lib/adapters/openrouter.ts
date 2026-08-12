import type { ProviderTelemetry, UsageLog } from '@/types';
import { proxyFetch } from '@/lib/adapters/proxy';
import { createRateLimitStatus, readErrorMessage } from '@/lib/adapters/utils';

interface OpenRouterKeyResponse {
  data?: {
    label?: string;
    limit?: number | null;
    limit_remaining?: number | null;
    limit_reset?: string | null;
    usage?: number;
    usage_daily?: number;
    usage_weekly?: number;
    usage_monthly?: number;
  };
}

export async function pollOpenRouter(apiKey: string): Promise<ProviderTelemetry> {
  const response = await proxyFetch({
    providerId: 'openrouter',
    apiKey,
    endpoint: '/key',
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(
      `OpenRouter telemetry failed (${response.status}): ${message}`
    );
  }

  const payload = await response.json<OpenRouterKeyResponse>();
  const data = payload.data;

  const latestLogs: UsageLog[] = data
    ? [
        {
          id: `openrouter-${Date.now()}`,
          providerId: 'openrouter',
          timestamp: new Date().toISOString(),
          cost: data.usage,
          requests: undefined,
        },
      ]
    : [];

  return {
    rateLimit: createRateLimitStatus({
      creditsRemaining: data?.limit_remaining ?? null,
      creditsLimit: data?.limit ?? null,
      resetAt: data?.limit_reset ?? null,
    }),
    latestLogs,
  };
}
