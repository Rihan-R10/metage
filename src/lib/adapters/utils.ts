import type { RateLimitStatus } from '@/types';

export function parseIntHeader(
  headers: Headers,
  name: string
): number | null {
  const value = headers.get(name);
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function createRateLimitStatus(
  partial: Partial<RateLimitStatus> = {}
): RateLimitStatus {
  return {
    requestsRemaining: partial.requestsRemaining ?? null,
    requestsLimit: partial.requestsLimit ?? null,
    tokensRemaining: partial.tokensRemaining ?? null,
    tokensLimit: partial.tokensLimit ?? null,
    creditsRemaining: partial.creditsRemaining ?? null,
    creditsLimit: partial.creditsLimit ?? null,
    resetAt: partial.resetAt ?? null,
    polledAt: partial.polledAt ?? new Date().toISOString(),
  };
}

export function parseOpenAiRateLimitHeaders(headers: Headers): RateLimitStatus {
  return createRateLimitStatus({
    requestsRemaining: parseIntHeader(headers, 'x-ratelimit-remaining-requests'),
    requestsLimit: parseIntHeader(headers, 'x-ratelimit-limit-requests'),
    tokensRemaining: parseIntHeader(headers, 'x-ratelimit-remaining-tokens'),
    tokensLimit: parseIntHeader(headers, 'x-ratelimit-limit-tokens'),
    resetAt: headers.get('x-ratelimit-reset-requests'),
  });
}

export function parseAnthropicRateLimitHeaders(
  headers: Headers
): RateLimitStatus {
  return createRateLimitStatus({
    requestsRemaining: parseIntHeader(
      headers,
      'anthropic-ratelimit-requests-remaining'
    ),
    requestsLimit: parseIntHeader(headers, 'anthropic-ratelimit-requests-limit'),
    tokensRemaining: parseIntHeader(
      headers,
      'anthropic-ratelimit-tokens-remaining'
    ),
    tokensLimit: parseIntHeader(headers, 'anthropic-ratelimit-tokens-limit'),
    resetAt: headers.get('anthropic-ratelimit-requests-reset'),
  });
}

interface ErrorResponseLike {
  status: number;
  json<T = unknown>(): Promise<T>;
}

export async function readErrorMessage(
  response: ErrorResponseLike
): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string } | string;
      message?: string;
    };

    if (typeof body.error === 'string') {
      return body.error;
    }

    return body.error?.message ?? body.message ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}
