import type { MessageSourceDevice, MessageSourceHostDevice } from '@cindy/maker-shared/message-source';

export function buildMobileClientPromptNote(): string {
  return '';
}

export function buildClientEnvironmentNote(_params: {
  device?: MessageSourceDevice;
  host?: MessageSourceHostDevice;
  legacyMobile?: boolean;
}): string | null {
  return null;
}

function singleTextContent(message: unknown): string | null {
  if (typeof message === 'string') return message;
  if (!message || typeof message !== 'object' || Array.isArray(message)) return null;
  const content = (message as { content?: unknown }).content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content) || content.length !== 1) return null;
  const part = content[0];
  if (!part || typeof part !== 'object' || Array.isArray(part)) return null;
  const { type, text } = part as { type?: unknown; text?: unknown };
  return (
    (type === 'text' || type === 'input_text' || type === 'output_text')
    && typeof text === 'string'
  ) ? text : null;
}

/**
 * 原生命令必须位于消息开头；环境说明不能抢占这个位置。
 * Claude 旁路 /compact 和 Learn 技能调用；Pi 的 slash 输入交由运行时自己的命令发现处理。
 */
export function shouldPrependMobileClientPromptNote(
  message: unknown,
  agentKind: string,
): boolean {
  const text = singleTextContent(message);
  // Pi owns command discovery. Leave slash inputs intact so its runtime can
  // execute installed commands (or treat unknown ones as literal text).
  if (agentKind === 'pi') {
    const content = message && typeof message === 'object'
      ? (message as { content?: unknown }).content : null;
    const parts = Array.isArray(content) ? content : [];
    const firstText = parts.find((part) => part?.type === 'text' && typeof part.text === 'string')?.text;
    return !(text ?? firstText ?? '').trimStart().startsWith('/');
  }
  if (agentKind !== 'claude-code') return true;
  if (text === null) return true;
  // Learn's exact-path pin is expanded at the provider boundary, where the
  // command must still lead the input. Keep its aliases free of wire notes.
  return !/^\/compact(?:\s|$)/.test(text)
    && !/^\/(?:(?:skill|cindy):)?learn(?:\s|$)/i.test(text.trimStart());
}

/**
 * 在 IPC 边界给队列项盖上手机来源(返回新对象,不原地改入参)。
 *
 * **必须无条件覆盖**:`item` 来自 wire,客户端可以自己填 `fromMobileClient: true`。
 * 由被控端按可信来源判据重写(不是手机就删掉该字段),客户端自报一律不生效。
 *
 * 为什么要盖在队列项上:手机会话页的所有发送都走 input:enqueue / input:steer,而
 * drain 派发与 steer 投递都在原 invoke 的 AsyncLocalStorage 之外发生 —— 只在
 * invoke context 里读来源的话,真实使用中几乎永远读不到(review P1 实捉)。
 */
export function stampMobileClientOrigin<T extends { fromMobileClient?: boolean }>(
  item: T,
  fromMobileClient: boolean,
): T {
  if (fromMobileClient) return { ...item, fromMobileClient: true };
  const { fromMobileClient: _ignored, ...rest } = item;
  return rest as T;
}

/**
 * Main-owned input boundary captured at an IPC entry point.  The generation is
 * intentionally carried alongside the wall-clock clear token: two clears can
 * share the same millisecond timestamp, while the generation still proves that
 * a request started before the later clear.
 */
export interface MainOwnedInputBoundaryStamp {
  expectedClearBoundaryMs: number | null;
  expectedInputGeneration: number;
  /** Main-only cancellation scope; never comes from a device-link payload. */
  inputAbortSignal?: AbortSignal;
}

/**
 * Strip fields that are only valid when constructed by main.  The clear token
 * itself remains a valid controller precondition: the IPC boundary validates it
 * before `attachMainOwnedInputBoundary` replaces it with the authoritative host
 * stamp.  Keeping it when no stamp is available also preserves old test harnesses
 * and non-device-link callers.
 */
export function attachMainOwnedInputBoundary(
  sendOpts: unknown,
  stamp: MainOwnedInputBoundaryStamp | undefined,
): unknown {
  const sanitized = stripMainOnlySendOpts(sendOpts);
  if (!stamp) return sanitized;
  if (!sanitized || typeof sanitized !== 'object' || Array.isArray(sanitized)) {
    return {
      expectedClearBoundaryMs: stamp.expectedClearBoundaryMs,
      expectedInputGeneration: stamp.expectedInputGeneration,
      ...(stamp.inputAbortSignal ? { signal: stamp.inputAbortSignal } : {}),
    };
  }
  return {
    ...(sanitized as Record<string, unknown>),
    expectedClearBoundaryMs: stamp.expectedClearBoundaryMs,
    expectedInputGeneration: stamp.expectedInputGeneration,
    ...(stamp.inputAbortSignal ? { signal: stamp.inputAbortSignal } : {}),
  };
}

const MAIN_ONLY_PERSIST_FIELDS = [
  'botTaskCoordination', 'sharedTaskAuthor', 'origin', 'sourceDevice', 'sourcePlugin', 'sourceGroup',
] as const;
const MAIN_ONLY_SEND_FIELDS = [
  'fromMobileClient',
  'fromDeviceLinkClient',
  'uiLanguage',
  'classicalStyle',
  'expectedInputGeneration',
  'expectedTurnSession',
  'expectedTurnGeneration',
  'inputAbortSignal',
  'signal',
  'turnPermissionPolicy',
  'toolsDisabled',
  'origin',
  'sourceDevice',
  'sourcePlugin',
  'sourceGroup',
  'sourceOrigin',
  'sharedTaskAuthor',
] as const;

/**
 * 剥掉 sendOpts 里「只允许 main 写」的字段。
 *
 * `fromMobileClient` 是 coordinator 从队列项透传给 send 事务的内部字段;直连
 * `maker:send` 的 sendOpts 却来自 wire —— 不剥的话客户端自填一个就能让 agent 收到手机
 * 说明。直连路径的来源判据只能是 async context(invoke-context),不看 sendOpts。
 * `turnPermissionPolicy` 同样只能由 Main 的 IM dispatcher 创建；Renderer/device-link
 * 即使伪造相同字段形状，也不能把普通文本升级成已认证 IM 指令。
 *
 * `origin` 只能由宿主 dispatcher / coordinator 构造，wire 不能自报 scheduler
 * 来源并借此恢复历史授权。
 *
 * 消息来源字段(`sourceDevice` / `sourcePlugin` / steer 透传的 `sourceOrigin` /
 * `sharedTaskAuthor`,以及 `persistUserMessage` 里的 `origin` / `sourceDevice` /
 * `sourcePlugin` / `sharedTaskAuthor`)同样只由 main 盖章:它们决定落库标签与发给模型的
 * `[消息来源]` / `[客户端说明]`,客户端自报一律剥掉。直连路径的设备来源由 IPC 边界
 * 按 invoke context 重新盖章。
 *
 * 非对象输入原样返回(事务自己会按 `?? {}` 兜底)。
 */
export function stripMainOnlySendOpts(sendOpts: unknown): unknown {
  if (!sendOpts || typeof sendOpts !== 'object' || Array.isArray(sendOpts)) return sendOpts;
  let opts = sendOpts as Record<string, unknown>;
  const persisted = opts.persistUserMessage;
  if (
    persisted && typeof persisted === 'object' && !Array.isArray(persisted)
    && MAIN_ONLY_PERSIST_FIELDS.some((key) => key in persisted)
  ) {
    const content = { ...(persisted as Record<string, unknown>) };
    for (const key of MAIN_ONLY_PERSIST_FIELDS) delete content[key];
    opts = { ...opts, persistUserMessage: content };
  }
  if (!MAIN_ONLY_SEND_FIELDS.some((key) => key in opts)) return opts;
  const rest = { ...opts };
  for (const key of MAIN_ONLY_SEND_FIELDS) delete rest[key];
  return rest;
}

/**
 * 直连 maker:send / maker:steer 的设备来源盖章:剥掉 wire 值后,只在同账号控制端且
 * 平台已知时写入 main 读到的 `sourceDevice`(返回新对象,不改入参)。
 */
export function stampDirectSendSourceDevice(
  sendOpts: unknown,
  sourceDevice: MessageSourceDevice | undefined,
): unknown {
  const base = sendOpts && typeof sendOpts === 'object' && !Array.isArray(sendOpts)
    ? { ...(sendOpts as Record<string, unknown>) }
    : sendOpts === undefined || sendOpts === null ? {} : undefined;
  if (!base) return sendOpts;
  delete base.sourceDevice;
  if (sourceDevice) base.sourceDevice = { ...sourceDevice };
  return base;
}
