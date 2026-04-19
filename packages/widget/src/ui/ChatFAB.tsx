import { h } from 'preact';
import type { WebAgentConfig } from '../agent/types';

interface ChatFABProps {
  isOpen: boolean;
  unreadCount: number;
  onClick: () => void;
  config: WebAgentConfig;
}

export function ChatFAB({ isOpen, unreadCount, onClick, config }: ChatFABProps) {
  return (
    <button
      class="webagent-fab"
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      title={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
      {!isOpen && unreadCount > 0 && (
        <span class="webagent-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}
    </button>
  );
}
