/** Cached-first Claude subscription quota; Main owns account identity and expiry. */
import type { ClaudeSubscriptionUsageSnapshot } from '../../shared/claudeSubscriptionUsage';
export type { ClaudeSubscriptionUsageSnapshot };

function isSnapshot(v: unknown): v is ClaudeSubscriptionUsageSnapshot {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

/** push payload → 下一个缓存值(纯函数, 供单测): null 清空, 快照覆盖, 异常保留。 */
export function reduceClaudeSubscriptionPush(
  current: ClaudeSubscriptionUsageSnapshot | null,
  payload: unknown,
): ClaudeSubscriptionUsageSnapshot | null {
  if (payload === null) return null;
  if (isSnapshot(payload)) return payload;
  return current;
}

export function resolvePersistedClaudeSubscriptionRead(
  persisted: unknown,
):
  | { action: 'clear' }
  | { action: 'apply'; snapshot: ClaudeSubscriptionUsageSnapshot }
  | { action: 'ignore' } {
  if (persisted === null) return { action: 'clear' };
  if (isSnapshot(persisted)) return { action: 'apply', snapshot: persisted };
  return { action: 'ignore' };
}

export function requestClaudeSubscriptionRefresh(_providerId = 'anthropic'): void {
  return;
}

export function useClaudeSubscriptionUsage(
  _enabled: boolean,
  _providerId = 'anthropic',
): ClaudeSubscriptionUsageSnapshot | null {
  return null;
}
