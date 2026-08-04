import type { ProviderTelemetry, UsageLog } from '@/types';
import { proxyFetch } from '@/lib/adapters/proxy';
import { parseOpenAiRateLimitHeaders, readErrorMessage } from '@/lib/adapters/utils';

interface OpenAiUsageBucket {
  start_time: number;
  end_time: number;
  results?: Array<{
    input_tokens?: number;
    output_tokens?: number;
    num_model_requests?: number;
    model?: string | null;
  }>;
}

async function fetchOpenAiRateLimit(apiKey: string) {
  return proxyFetch({
    providerId: 'openai',
    apiKey,
    endpoint: '/models',
  });
}

async function fetchOpenAiUsage(apiKey: string): Promise<UsageLog[]> {
  const startTime = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  const endpoint = `/organization/usage/completions?start_time=${startTime}&bucket_width=1d&limit=7`;

  const response = await proxyFetch({
    providerId: 'openai',
    apiKey,
    endpoint,
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json<{ data?: OpenAiUsageBucket[] }>();
  const buckets = payload.data ?? [];

  return buckets.flatMap((bucket) =>
    (bucket.results ?? []).map((result, index) => {
      const inputTokens = result.input_tokens ?? 0;
      const outputTokens = result.output_tokens ?? 0;

      return {
        id: `openai-${bucket.start_time}-${index}`,
        providerId: 'openai' as const,
        timestamp: new Date(bucket.end_time * 1000).toISOString(),
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        requests: result.num_model_requests,
        model: result.model ?? undefined,
      };
    })
  );
}

export async function pollOpenAI(apiKey: string): Promise<ProviderTelemetry> {
  const [rateLimitResponse, latestLogs] = await Promise.all([
    fetchOpenAiRateLimit(apiKey),
    fetchOpenAiUsage(apiKey),
  ]);

  if (!rateLimitResponse.ok) {
    const message = await readErrorMessage(rateLimitResponse);
    throw new Error(`OpenAI telemetry failed (${rateLimitResponse.status}): ${message}`);
  }

  return {
    rateLimit: parseOpenAiRateLimitHeaders(rateLimitResponse.headers),
    latestLogs,
  };
}
