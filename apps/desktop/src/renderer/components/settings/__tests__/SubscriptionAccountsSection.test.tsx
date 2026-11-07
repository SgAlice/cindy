// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubscriptionPoolView } from '../../../../shared/subscriptionAccounts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en', resolvedLanguage: 'en' },
    t: (key: string, options: Record<string, unknown> = {}) =>
      key === 'quotaCard.modelWeeklyLabel' ? `${String(options.model)} weekly` : key,
  }),
}));
vi.mock('@/components/ui/confirm-dialog-provider', () => ({
  useConfirmDialog: () => ({ confirm: vi.fn() }),
}));

import { SubscriptionAccountsSection } from '../SubscriptionAccountsSection';

/* 测试价值：多账号设置页曾给每个账号另画一条周用量条，又在底部重复原用量卡，且漏掉
 * 5 小时与分模型周窗口。经真实组件验证：默认账号行放原用量卡，其他账号用同一张卡显示
 * 自己的全部窗口。tier: unit；IPC 以 mock 注入，无外网/Agent。 */
const resetsAt = Date.now() / 1000 + 3600;
const view: SubscriptionPoolView = {
  providerId: 'anthropic',
  configured: true,
  strategy: 'least',
  accounts: [
    { id: 'default', paused: false, limit: 4, weight: 1, directory: '/home/.claude', status: 'ready', running: 0, identity: 'first@example.test' },
    {
      id: 'cindy-owner-second',
      paused: false,
      limit: 4,
      weight: 1,
      directory: '/home/.claude-second',
      status: 'ready',
      running: 0,
      identity: 'second@example.test',
      usage: {
        claude: {
          source: 'oauth-endpoint',
          updatedAt: Date.now(),
          fiveHour: { utilization: 30, resetsAt },
          sevenDay: { utilization: 40, resetsAt },
          scoped: [{ modelId: 'claude-fable', modelDisplayName: 'Fable', utilization: 16, resetsAt }],
        },
      },
    },
  ],
};

beforeEach(() => {
  (window as unknown as { electronAPI: unknown }).electronAPI = {
    subscriptionAccounts: {
      command: vi.fn(async () => view),
      onChanged: vi.fn(() => () => undefined),
    },
  };
});

describe('SubscriptionAccountsSection usage', () => {
  it('keeps Claude account controls but hides all default and cached quota cards', async () => {
    render(
      <SubscriptionAccountsSection
        providerId="anthropic"
        defaultUsage={<div data-testid="original-card">original</div>}
      />,
    );
    await screen.findByText('first@example.test');
    const rows = screen.getByTestId('subscription-accounts').querySelectorAll('.py-4');
    expect(rows).toHaveLength(2);
    expect(screen.queryByTestId('original-card')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
  // Regression: a failed refresh kept the list and also showed the provider card below it.
  it('does not restore Claude quota cards when an account refresh fails', async () => {
    render(
      <SubscriptionAccountsSection
        providerId="anthropic"
        defaultUsage={<div data-testid="original-card">original</div>}
      />,
    );
    await screen.findByText('first@example.test');
    vi.mocked(window.electronAPI.subscriptionAccounts.command).mockRejectedValueOnce(new Error('offline'));
    fireEvent.focus(window);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByTestId('original-card')).toBeNull();
  });
  // Regression: a connected account's menu offered plain "Sign in", reading as if it were signed out.
  it.each([
    ['ready', 'subscriptionAccounts.loginAgain'],
    ['signed-out', 'subscriptionAccounts.login'],
  ] as const)('labels sign-in for a %s account by its state', async (status, label) => {
    vi.mocked(window.electronAPI.subscriptionAccounts.command).mockResolvedValue({
      ...view,
      accounts: [{ ...view.accounts[0], status }],
    });
    render(<SubscriptionAccountsSection providerId="anthropic" />);
    const trigger = await screen.findByRole('button', { name: 'providerGroup.member.moreAria' });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
    expect(await screen.findByRole('menuitem', { name: label })).toBeTruthy();
  });
});
