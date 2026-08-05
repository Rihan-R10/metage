import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { ProviderId } from '@/types';

const PROVIDER_BASES: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

interface ProxyRequestBody {
  provider?: string;
  providerId?: ProviderId;
  apiKey?: string;
  endpoint?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
}

function decryptKeyIfNeeded(apiKey: string): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || !apiKey.includes(':')) {
    return apiKey;
  }
  try {
    const [ivHex, encryptedHex] = apiKey.split(':');
    if (!ivHex || !encryptedHex) return apiKey;
    const key = crypto.createHash('sha256').update(secret).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return apiKey;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  let payload: ProxyRequestBody;

  try {
    payload = (await request.json()) as ProxyRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400, headers: corsHeaders }
    );
  }

  const rawProvider = payload.provider || payload.providerId;
  const provider = rawProvider?.toLowerCase();

  if (!provider || !PROVIDER_BASES[provider]) {
    return NextResponse.json(
      { error: `Invalid or unsupported provider: ${rawProvider}` },
      { status: 400, headers: corsHeaders }
    );
  }

  const rawApiKey = payload.apiKey;
  if (!rawApiKey || typeof rawApiKey !== 'string') {
    return NextResponse.json(
      { error: 'Missing apiKey.' },
      { status: 400, headers: corsHeaders }
    );
  }

  const apiKey = decryptKeyIfNeeded(rawApiKey);

  const endpoint = payload.endpoint;
  if (!endpoint || typeof endpoint !== 'string') {
    return NextResponse.json(
      { error: 'Missing endpoint.' },
      { status: 400, headers: corsHeaders }
    );
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = PROVIDER_BASES[provider];
  const targetUrl = `${baseUrl}${normalizedEndpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(payload.headers || {}),
  };

  if (!requestHeaders['Authorization'] && !requestHeaders['x-api-key']) {
    if (provider === 'anthropic') {
      requestHeaders['x-api-key'] = apiKey;
      requestHeaders['anthropic-version'] = '2023-06-01';
    } else {
      requestHeaders['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  const method = payload.method || 'GET';

  try {
    const providerResponse = await fetch(targetUrl, {
      method,
      headers: requestHeaders,
      body:
        method === 'POST' && payload.body !== undefined
          ? JSON.stringify(payload.body)
          : undefined,
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

    const rateLimitHeaders: Record<string, string> = {};
    providerResponse.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('ratelimit')) {
        rateLimitHeaders[key] = value;
      }
    });

    return NextResponse.json(
      {
        status: providerResponse.status,
        body: responseBody,
        headers: rateLimitHeaders,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Proxy fetch failed',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
