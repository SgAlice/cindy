import { describe, expect, it, vi } from 'vitest';
import { useRemoteClaudeSubscriptionUsage, requestRemoteClaudeSubscriptionRefresh } from '../hooks/useRemoteClaudeSubscriptionUsage';

describe('disabled remote Claude quota', () => {
  it('does not query another computer or subscribe to cached quota pushes', () => {
    const access = vi.fn(() => { throw new Error('Device link must not be accessed'); });
    vi.stubGlobal('window', { get electronAPI() { return access(); } });
    try {
      expect(useRemoteClaudeSubscriptionUsage('computer', 'anthropic')).toBeNull();
      expect(useRemoteClaudeSubscriptionUsage(null)).toBeNull();
      requestRemoteClaudeSubscriptionRefresh('computer', 'anthropic');
      expect(access).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});
