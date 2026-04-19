import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import type { WebAgentConfig, ChatMessage, TodoItem, AgentState } from '../agent/types';
import { ChatMessage as MessageComponent } from './ChatMessage';
import { TodoPanel } from './TodoPanel';

interface ChatWindowProps {
  messages: ChatMessage[];
  todos: TodoItem[];
  agentState: AgentState;
  onSendMessage: (content: string) => void;
  onClose: () => void;
  config: WebAgentConfig;
}

export function ChatWindow({ messages, todos, agentState, onSendMessage, onClose, config }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [showTodos, setShowTodos] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentState]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || agentState !== 'idle') return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div class="webagent-window">
      {/* Header */}
      <div class="webagent-header">
        <div class="webagent-header-title">
          <span class="webagent-header-icon">💬</span>
          <span>Support</span>
        </div>
        <div class="webagent-header-actions">
          {todos.length > 0 && (
            <button
              class="webagent-header-btn"
              onClick={() => setShowTodos(!showTodos)}
              title="Toggle tasks"
            >
              📋 {todos.filter(t => !t.completed).length}
            </button>
          )}
          <button class="webagent-header-btn" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      {/* Todo Panel */}
      {showTodos && <TodoPanel todos={todos} />}

      {/* Messages */}
      <div class="webagent-messages">
        {messages.map(msg => (
          <MessageComponent key={msg.id} message={msg} onSuggestionClick={onSendMessage} />
        ))}
        {agentState !== 'idle' && (
          <div class="webagent-typing">
            <div class="webagent-typing-dots">
              <span /><span /><span />
            </div>
            <span class="webagent-typing-text">
              {agentState === 'thinking' ? 'Thinking...' : 'Running tool...'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form class="webagent-input-bar" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          class="webagent-input"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={agentState !== 'idle'}
        />
        <button
          class="webagent-send-btn"
          type="submit"
          disabled={!input.trim() || agentState !== 'idle'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
