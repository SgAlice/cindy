import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryOne: vi.fn(),
  exec: vi.fn(async () => undefined),
  getCurrentDbClientUserId: vi.fn(() => 'user-1'),
  tapWindowBroadcast: vi.fn(),
}));

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: () => [] },
}));
vi.mock('../device-link/broadcast-tap.js', () => ({
  tapWindowBroadcast: mocks.tapWindowBroadcast,
}));
vi.mock('../logger', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));
vi.mock('../localDb/dailySpend', () => ({
  incrementDailySpend: vi.fn(),
  getTodaySpend: vi.fn(async () => 0),
  localDayKey: () => '2026-07-02',
}));
vi.mock('../localDb/dailyModelUsage', () => ({
  incrementDailyModelUsage: vi.fn(),
}));
vi.mock('../localDb/client/current', () => ({
  getDbClient: () => ({ queryOne: mocks.queryOne, exec: mocks.exec, drizzle: {} }),
  getCurrentDbClientUserId: mocks.getCurrentDbClientUserId,
}));

vi.mock('../usage/modelPricing', () => ({ getGatewayModelPricing: vi.fn() }));
vi.mock('../localDb/dailySessionUsage', () => ({ incrementDailySessionUsage: vi.fn() }));
vi.mock('../security/trustedAppRenderer.js', () => ({ isTrustedAppRendererWindow: () => true }));

import * as broadcaster from '../usageBroadcaster';

describe('disabled Claude quota persistence', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ignores incoming quota and never hydrates or writes a persisted snapshot', async () => {
    mocks.queryOne.mockResolvedValue({ snapshot: JSON.stringify({ fiveHour: { utilization: 99 } }) });
    await broadcaster.recordClaudeSubscriptionUsageSnapshot({ fiveHour: { utilization: 10 } });
    expect(await broadcaster.readClaudeSubscriptionUsageSnapshot()).toBeNull();
    expect(mocks.queryOne).not.toHaveBeenCalled();
    expect(mocks.exec).not.toHaveBeenCalled();
    expect(mocks.tapWindowBroadcast).not.toHaveBeenCalled();
  });

  it('clears the visible snapshot without deleting existing user data', async () => {
    await broadcaster.clearClaudeSubscriptionUsageSnapshot();
    expect(await broadcaster.readClaudeSubscriptionUsageSnapshot()).toBeNull();
    expect(mocks.exec).not.toHaveBeenCalled();
    expect(mocks.tapWindowBroadcast).toHaveBeenCalledWith('usage:claude-subscription-changed', null);
  });
});
