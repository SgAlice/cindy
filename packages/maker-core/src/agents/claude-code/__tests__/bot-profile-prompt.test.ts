import { describe, expect, it } from 'vitest';

import { buildClaudeSystemPromptAppend } from '../system-prompt-append';

describe('Claude native context boundary', () => {
  it('excludes Cindy memory, custom instructions and companion context without removing unrelated rules', () => {
    expect(buildClaudeSystemPromptAppend({
      botProfilePrompt: 'BOT SOUL',
      answerDeliveryPrompt: 'DELIVERY PROTOCOL',
      botProfileContextPrompt: 'ACTIVE BOT PROFILE',
      makerMemoryRules: 'MEMORY RULES',
      ghostRosterPrompt: 'PLUGIN RULES',
      hostSystemPrompt: 'HOST RULES',
      makerMemoryIndex: 'MEMORY INDEX',
      botUserProfilePrompt: 'USER PROFILE SNAPSHOT',
      userPrompt: 'CINDY USER OVERRIDE',
      deviceHostedNote: 'EXECUTION WORKSPACE',
    })).toBe(['DELIVERY PROTOCOL', 'EXECUTION WORKSPACE', 'PLUGIN RULES', 'HOST RULES'].join(String.fromCharCode(10, 10)));
  });

  it('adds nothing when only removed context is supplied', () => {
    expect(buildClaudeSystemPromptAppend({ botProfilePrompt: 'BOT', userPrompt: 'CUSTOM', makerMemoryIndex: 'PRIVATE' })).toBe('');
  });
});
