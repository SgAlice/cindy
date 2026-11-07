import { describe, expect, it, vi } from 'vitest';
import { readClaudeSubscriptionUsageSnapshotForDeviceLink, triggerClaudeSubscriptionUsageRefresh, syncClaudeSubscriptionUsageForAuthChange } from '../claudeSubscriptionUsageRefresh';

describe('disabled Claude subscription quota endpoints', () => {
  it.each([undefined, 'anthropic', 'another-claude-account'])('returns no quota for %s, including forced refresh', async (providerId) => {
    const fetch = vi.fn(() => { throw new Error('No network access allowed'); });
    vi.stubGlobal('fetch', fetch);
    try {
      triggerClaudeSubscriptionUsageRefresh(providerId);
      syncClaudeSubscriptionUsageForAuthChange(providerId);
      expect(await readClaudeSubscriptionUsageSnapshotForDeviceLink(providerId)).toBeNull();
      expect(await readClaudeSubscriptionUsageSnapshotForDeviceLink(providerId, { fresh: true })).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});
