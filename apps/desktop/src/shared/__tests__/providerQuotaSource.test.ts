import { describe, expect, it } from 'vitest';
import type { ProviderView } from '@cindy/model-providers';
import { providerWeeklyQuotaSource } from '../providerQuotaSource';

function provider(id: string, native?: string): ProviderView {
  return {
    id,
    source: 'builtin',
    connected: true,
    auth: { method: 'oauth', native },
    access: { kind: 'subscription' },
  } as ProviderView;
}

describe('subscription quota visibility', () => {
  it('does not expose the built-in Claude quota reader', () => {
    expect(providerWeeklyQuotaSource(provider('anthropic'))).toBeNull();
  });

  it('does not expose another Claude native account', () => {
    expect(providerWeeklyQuotaSource(provider('personal-claude', 'claude'))).toBeNull();
  });

  it('retains other providers and their connection requirements', () => {
    expect(providerWeeklyQuotaSource(provider('openai', 'codex'))).toBe('codex');
    expect(providerWeeklyQuotaSource(provider('xai', 'xai'))).toBe('xai');
    expect(providerWeeklyQuotaSource({ ...provider('openai', 'codex'), connected: false })).toBeNull();
  });
});
