/** The remote Claude account uses the same snapshot contract as a local account. */
import type { ClaudeSubscriptionUsageSnapshot } from '../../shared/claudeSubscriptionUsage';

export function useRemoteClaudeSubscriptionUsage(_deviceId: string | null, _providerId = 'anthropic'): ClaudeSubscriptionUsageSnapshot | null {
  return null;
}

export function requestRemoteClaudeSubscriptionRefresh(_deviceId: string, _providerId = 'anthropic'): void {
  return;
}

export function resetRemoteClaudeSubscriptionUsageCacheForTest(): void {
  return;
}

export function reduceRemoteClaudeSubscriptionPush(
  current: ClaudeSubscriptionUsageSnapshot | null,
  payload: unknown,
): ClaudeSubscriptionUsageSnapshot | null {
  if (payload === null) return null;
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as ClaudeSubscriptionUsageSnapshot)
    : current;
}
