import { NextRequest, NextResponse } from 'next/server';
import type { ProviderId } from '@/types';

const PROVIDER_BASES: Partial<Record<ProviderId, string>> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
};

const RATE_LIMIT_HEADER_PREFIXES = ['x-ratelimit-', 'anthropic-ratelimit-'];

interface ProxyRequestBody {
  providerId?: ProviderId;
  apiKey?: string;
  endpoint?: string;
  method?: 'GET' | 'POST';
  body?: unknown;
}

function isProviderId(value: unknown): value is ProviderId {
  return (
    value === 'openai' ||
    value === 'anthropic' ||
    value === 'groq' ||
    value === 'openrouter' ||
    value === 'gemini'
  );
}

function buildProviderHeaders(
  providerId: ProviderId,
  apiKey: string
): Record<string, string> {
  switch (providerId) {
    case 'openai':
    case 'groq':
    case 'openrouter':
      return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
    case 'anthropic':
      return {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      };
    case 'gemini':
      return {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      };
  }
}

function extractRateLimitHeaders(headers: Headers): Record<string, string> {
  const rateLimitHeaders: Record<string, string> = {};

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (
      RATE_LIMIT_HEADER_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))
    ) {
      rateLimitHeaders[key] = value;
    }
  });

  return rateLimitHeaders;
}

function normalizeEndpoint(endpoint: string): string | null {
  if (!endpoint.startsWith('/') || endpoint.startsWith('//')) {
    return null;
  }

  try {
    const parsed = new URL(endpoint, 'https://proxy.local');
    if (parsed.origin !== 'https://proxy.local') {
      return null;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let payload: ProxyRequestBody;

  try {
    payload = (await request.json()) as ProxyRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { providerId, apiKey, endpoint, method = 'GET', body } = payload;

  if (!isProviderId(providerId)) {
    return NextResponse.json({ error: 'Invalid providerId.' }, { status: 400 });
  }

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'Missing apiKey.' }, { status: 400 });
  }

  if (!endpoint || typeof endpoint !== 'string') {
    return NextResponse.json({ error: 'Missing endpoint.' }, { status: 400 });
  }

  const normalizedEndpoint = normalizeEndpoint(endpoint);
  if (!normalizedEndpoint) {
    return NextResponse.json({ error: 'Invalid endpoint.' }, { status: 400 });
  }

  if (method !== 'GET' && method !== 'POST') {
    return NextResponse.json({ error: 'Invalid method.' }, { status: 400 });
  }

  const baseUrl = PROVIDER_BASES[providerId];
  if (!baseUrl) {
    return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 });
  }

  const url = `${baseUrl}${normalizedEndpoint}`;
  const headers = buildProviderHeaders(providerId, apiKey);

  try {
    const providerResponse = await fetch(url, {
      method,
      headers,
      body: method === 'POST' && body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    const responseText = await providerResponse.text();
    let responseBody: unknown = responseText;

    if (responseText) {
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }
    } else {
      responseBody = null;
    }

    return NextResponse.json({
      status: providerResponse.status,
      body: responseBody,
      headers: extractRateLimitHeaders(providerResponse.headers),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect to AI provider base URL.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}