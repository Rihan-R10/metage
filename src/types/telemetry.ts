export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'grok';

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  gemini?: string;
  grok?: string;
}

export type KeyStatus = 'unconfigured' | 'testing' | 'valid' | 'invalid';
export type KeyStatuses = Record<ProviderId, KeyStatus>;

export interface TelemetryLog {
  id: string;
  timestamp: string;
  provider: ProviderId;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  costEstimate: number;
  status: '200' | '401' | '429' | '500';
}