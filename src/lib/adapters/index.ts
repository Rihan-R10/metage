import { pollAnthropic } from '@/lib/adapters/anthropic';
import { pollOpenAI } from '@/lib/adapters/openai';
import { pollOpenRouter } from '@/lib/adapters/openrouter';
import type { ProviderId, ProviderTelemetry } from '@/types';

const ADAPTERS: Partial<
  Record<ProviderId, (apiKey: string) => Promise<ProviderTelemetry>>
> = {
  openai: pollOpenAI,
  anthropic: pollAnthropic,
  openrouter: pollOpenRouter,
};

export async function pollProviderTelemetry(
  providerId: ProviderId,
  apiKey: string
): Promise<ProviderTelemetry> {
  const adapter = ADAPTERS[providerId];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${providerId}`);
  }

  return adapter(apiKey);
}

export { pollOpenAI } from '@/lib/adapters/openai';
export { pollAnthropic } from '@/lib/adapters/anthropic';
export { pollOpenRouter } from '@/lib/adapters/openrouter';
export { proxyFetch } from '@/lib/adapters/proxy';
export type { ProxyRequest, ProxyResponse } from '@/lib/adapters/proxy';
