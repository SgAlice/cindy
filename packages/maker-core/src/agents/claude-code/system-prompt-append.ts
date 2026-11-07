import promptText from './system-prompt-append.md?raw';

export const SYSTEM_PROMPT_APPEND = promptText.trim();

export function buildClaudeSystemPromptAppend(parts: {
  makerMemoryRules?: string;
  ghostRosterPrompt?: string;
  hostSystemPrompt?: string;
  makerMemoryIndex?: string;
  botProfilePrompt?: string;
  botProfileContextPrompt?: string;
  botUserProfilePrompt?: string;
  userPrompt?: string;
  answerDeliveryPrompt?: string;
  /** 设备托管：项目在哪台电脑、文件与命令工具是哪些。 */
  deviceHostedNote?: string;
}): string {
  return [
    parts.answerDeliveryPrompt,
    SYSTEM_PROMPT_APPEND,
    parts.deviceHostedNote,
    parts.ghostRosterPrompt,
    parts.hostSystemPrompt,
  ]
    .filter((part): part is string => !!part && part.trim().length > 0)
    .join('\n\n');
}
