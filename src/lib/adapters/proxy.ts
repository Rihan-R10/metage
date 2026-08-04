import type { ProviderId } from '@/types';

export interface ProxyRequest {
  providerId: ProviderId;
  apiKey: string;
  endpoint: string;
  method?: 'GET' | 'POST';
  body?: unknown;
}

export interface ProxyResponsePayload {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

export interface ProxyResponse {
  ok: boolean;
  status: number;
  headers: Headers;
  json<T = unknown>(): Promise<T>;
}

function toHeaders(headerMap: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(headerMap)) {
    headers.set(key, value);
  }
  return headers;
}

export async function proxyFetch(request: ProxyRequest): Promise<ProxyResponse> {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorBody = (await response.json()) as { error?: string };
      message = errorBody.error ?? message;
    } catch {
      // Keep default status text when proxy error body is not JSON.
    }
    throw new Error(`Proxy request failed (${response.status}): ${message}`);
  }

  const payload = (await response.json()) as ProxyResponsePayload;

  return {
    ok: payload.status >= 200 && payload.status < 300,
    status: payload.status,
    headers: toHeaders(payload.headers),
    json: async <T = unknown>() => payload.body as T,
  };
}
