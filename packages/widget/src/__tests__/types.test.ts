import { describe, expect, expectTypeOf, it } from 'vitest';
import type { AgentState, ChatMessage, WebAgentConfig } from '../agent/types';

describe('types', () => {
  it('WebAgentConfig requires apiBase', () => {
    const validConfig: WebAgentConfig = { apiBase: 'https://api.example.com' };
    expect(validConfig.apiBase).toBe('https://api.example.com');

    // @ts-expect-error apiBase is required
    const invalidConfig: WebAgentConfig = {};
    expect(invalidConfig).toBeDefined();
  });

  it('ChatMessage has required fields', () => {
    const message: ChatMessage = {
      id: 'msg_1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    };

    expect(message.id).toBe('msg_1');
    expect(message.role).toBe('user');
  });

  it('AgentState is a union type', () => {
    expectTypeOf<AgentState>().toEqualTypeOf<
      'idle' | 'thinking' | 'executing-tool' | 'streaming'
    >();

    const states: AgentState[] = ['idle', 'thinking', 'executing-tool', 'streaming'];
    expect(states).toHaveLength(4);
  });
});
