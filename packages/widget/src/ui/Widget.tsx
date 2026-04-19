import { h, Component } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import type { WebAgentConfig, ChatMessage, TodoItem, AgentState } from '../agent/types';
import { SessionStore } from '../store/session';
import { runAgent } from '../agent/loop';
import { ChatFAB } from './ChatFAB';
import { ChatWindow } from './ChatWindow';
import { styles } from './styles';

interface WidgetProps {
  config: WebAgentConfig;
  sessionStore: SessionStore;
}

export function Widget({ config, sessionStore }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [unreadCount, setUnreadCount] = useState(0);

  // Load session on mount
  useEffect(() => {
    (async () => {
      const session = await sessionStore.load();
      if (session) {
        setMessages(session.messages);
        setTodos(session.todos);
      } else if (config.welcomeMessage) {
        const welcomeMsg: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: config.welcomeMessage,
          timestamp: Date.now(),
        };
        setMessages([welcomeMsg]);
      }
    })();
  }, []);

  // Persist session on changes
  useEffect(() => {
    if (messages.length > 0) {
      sessionStore.save({
        messages,
        todos,
        createdAt: messages[0]?.timestamp || Date.now(),
        updatedAt: Date.now(),
      });
    }
  }, [messages, todos]);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setAgentState('thinking');

    try {
      await runAgent(config, newMessages, {
        onStream: (chunk) => {
          // Future: streaming support
        },
        onToolCall: (name, args) => {
          setAgentState('executing-tool');
        },
        onToolResult: (name, result) => {
          setAgentState('thinking');
        },
        onComplete: (assistantMsg) => {
          setMessages(prev => [...prev, assistantMsg]);
          setAgentState('idle');
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        },
        onError: (error) => {
          const errorMsg: ChatMessage = {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: `Sorry, something went wrong: ${error.message}`,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, errorMsg]);
          setAgentState('idle');
        },
        getTodos: () => todos,
        setTodos: (newTodos) => setTodos(newTodos),
      });
    } catch (err) {
      setAgentState('idle');
    }
  }, [messages, todos, config, isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) setUnreadCount(0);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const position = config.position || 'bottom-right';

  return (
    <div>
      <style>{styles(config.theme)}</style>
      <div class={`webagent-container webagent-${position}`}>
        {isOpen && (
          <ChatWindow
            messages={messages}
            todos={todos}
            agentState={agentState}
            onSendMessage={handleSendMessage}
            onClose={handleClose}
            config={config}
          />
        )}
        <ChatFAB
          isOpen={isOpen}
          unreadCount={unreadCount}
          onClick={handleToggle}
          config={config}
        />
      </div>
    </div>
  );
}
