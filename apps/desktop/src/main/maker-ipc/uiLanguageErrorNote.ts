import {
  DEFAULT_CLASSICAL_REPLY_STYLE,
  isClassicalReplyStyle,
  type ClassicalReplyStyleId,
} from '@cindy/maker-shared/classical-reply';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../../shared/locale.js';

export function isSupportedUiLanguage(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Accept only a supported locale. Arbitrary wire text never becomes prompt text. */
export function readClaimedUiLanguage(value: unknown): SupportedLocale | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const claimed = (value as { uiLanguage?: unknown }).uiLanguage;
  return isSupportedUiLanguage(claimed) ? claimed : null;
}

/**
 * Local turns use the desktop interface language. Remote controllers may name
 * their own interface language; an invalid or missing claim falls back.
 */
export function resolveTurnUiLanguage(input: {
  remote: boolean;
  claimed: SupportedLocale | null;
  fallback: SupportedLocale;
}): SupportedLocale {
  return input.remote && input.claimed ? input.claimed : input.fallback;
}

export interface TurnLanguageStampInput {
  remote: boolean;
  claimed: SupportedLocale | null;
  fallback: SupportedLocale;
  /** The remote client's classical output style, if it sent one. */
  claimedClassicalStyle?: ClassicalReplyStyleId | null;
  /** This computer's own classical output style. */
  fallbackClassicalStyle?: ClassicalReplyStyleId;
}

/**
 * The output style travels with the language it belongs to: a remote client that
 * named its own language also brings its own style (or the default); otherwise this
 * computer's choice applies.
 */
export function resolveTurnClassicalStyle(input: TurnLanguageStampInput): ClassicalReplyStyleId {
  if (input.remote && input.claimed) return input.claimedClassicalStyle ?? DEFAULT_CLASSICAL_REPLY_STYLE;
  return input.fallbackClassicalStyle ?? DEFAULT_CLASSICAL_REPLY_STYLE;
}

export function stampTurnUiLanguage<T extends { uiLanguage?: string; classicalStyle?: string }>(
  item: T,
  input: TurnLanguageStampInput,
): T {
  return { ...item, uiLanguage: resolveTurnUiLanguage(input), classicalStyle: resolveTurnClassicalStyle(input) };
}

/** Accept only a known style id from the wire. */
export function readClaimedClassicalStyle(value: unknown): ClassicalReplyStyleId | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const claimed = (value as { classicalStyle?: unknown }).classicalStyle;
  return isClassicalReplyStyle(claimed) ? claimed : null;
}

export function turnUiLanguageFromSendOpts(
  sendOpts: { uiLanguage?: unknown } | null | undefined,
  fallback: SupportedLocale,
): SupportedLocale {
  // Present only after main stamps a supported locale. Wire values are stripped first.
  return isSupportedUiLanguage(sendOpts?.uiLanguage) ? sendOpts.uiLanguage : fallback;
}

export function turnClassicalStyleFromSendOpts(
  sendOpts: { classicalStyle?: unknown } | null | undefined,
  fallback: ClassicalReplyStyleId,
): ClassicalReplyStyleId {
  return isClassicalReplyStyle(sendOpts?.classicalStyle) ? sendOpts.classicalStyle : fallback;
}

export function buildUiLanguageErrorNote(
  _locale: SupportedLocale,
  _opts: { readonly replyStyle?: boolean; readonly classicalStyle?: ClassicalReplyStyleId } = {},
): string {
  return '';
}
