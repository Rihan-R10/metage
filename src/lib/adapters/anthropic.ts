import type { ProviderTelemetry } from '@/types';
import { proxyFetch } from '@/lib/adapters/proxy';
import {
  parseAnthropicRateLimitHeaders,
  readErrorMessage,
} from '@/lib/adapters/utils';

async function probeAnthropicRateLimit(apiKey: string) {
  return proxyFetch({
    providerId: 'anthropic',
    apiKey,
    endpoint: '/messages',
    method: 'POST',
    body: {
      model: 'claude-3-5-haiku-latest',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'ping' }],
    },
  });
}

export async function pollAnthropic(apiKey: string): Promise<ProviderTelemetry> {
  const response = await probeAnthropicRateLimit(apiKey);

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(
      `Anthropic telemetry failed (${response.status}): ${message}`
    );
  }

  return {
    rateLimit: parseAnthropicRateLimitHeaders(response.headers),
    latestLogs: [],
  };
}
