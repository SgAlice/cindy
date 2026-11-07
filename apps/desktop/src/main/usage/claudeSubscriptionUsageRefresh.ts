import type { ClaudeSubscriptionUsageSnapshot } from '../../shared/claudeSubscriptionUsage.js';

export function triggerClaudeSubscriptionUsageRefresh(_providerId?: string): void {
  return;
}

export function syncClaudeSubscriptionUsageForAuthChange(_providerId?: string): void {
  return;
}

export async function readClaudeSubscriptionUsageSnapshotForDeviceLink(
  _providerId?: string,
  _options?: { fresh?: boolean },
): Promise<ClaudeSubscriptionUsageSnapshot | null> {
  return null;
}
