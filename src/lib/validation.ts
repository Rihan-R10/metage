// src/lib/validation.ts

export interface KeyValidationResult {
  isValid: boolean;
  sanitizedKey: string;
  error?: string;
}

export function validateApiKey(providerId: string, rawKey: string): KeyValidationResult {
  // 1. Clean extra spaces
  const sanitizedKey = rawKey.trim();

  if (!sanitizedKey) {
    return { isValid: false, sanitizedKey, error: 'API key cannot be empty.' };
  }

  // 2. Reject keys containing spaces inside
  if (/\s/.test(sanitizedKey)) {
    return { isValid: false, sanitizedKey, error: 'API key must not contain spaces.' };
  }

  // 3. Provider-specific pattern checks
  switch (providerId.toLowerCase()) {
    case 'openai':
      if (!sanitizedKey.startsWith('sk-')) {
        return {
          isValid: false,
          sanitizedKey,
          error: 'OpenAI API keys typically start with "sk-".',
        };
      }
      break;

    case 'openrouter':
    case 'openrouter-prod':
      if (!sanitizedKey.startsWith('sk-or-')) {
        return {
          isValid: false,
          sanitizedKey,
          error: 'OpenRouter API keys typically start with "sk-or-".',
        };
      }
      break;

    case 'anthropic':
      if (!sanitizedKey.startsWith('sk-ant-')) {
        return {
          isValid: false,
          sanitizedKey,
          error: 'Anthropic API keys typically start with "sk-ant-".',
        };
      }
      break;

    case 'grok':
    case 'xai':
      if (!sanitizedKey.startsWith('xai-') && !sanitizedKey.startsWith('grok-')) {
        return {
          isValid: false,
          sanitizedKey,
          error: 'Grok (xAI) API keys typically start with "xai-" or "grok-".',
        };
      }
      break;

    default:
      if (sanitizedKey.length < 8) {
        return {
          isValid: false,
          sanitizedKey,
          error: 'API key is too short to be valid.',
        };
      }
  }

  return { isValid: true, sanitizedKey };
}