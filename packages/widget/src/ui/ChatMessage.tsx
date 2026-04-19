import { h } from 'preact';
import type { ChatMessage as ChatMessageType } from '../agent/types';

interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestionClick?: (text: string) => void;
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  // Parse suggestions from <suggestion> tags
  const suggestions: string[] = [];
  let displayContent = message.content;
  const suggestionRegex = /<suggestion>(.*?)<\/suggestion>/g;
  let match;
  while ((match = suggestionRegex.exec(message.content)) !== null) {
    suggestions.push(match[1]);
  }
  displayContent = displayContent.replace(suggestionRegex, '').trim();

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    // Bold
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    return { __html: html };
  };

  return (
    <div class={`webagent-message webagent-message-${isUser ? 'user' : 'assistant'}`}>
      <div class="webagent-message-bubble" dangerouslySetInnerHTML={renderContent(displayContent)} />
      {suggestions.length > 0 && (
        <div class="webagent-suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              class="webagent-suggestion-chip"
              onClick={() => onSuggestionClick?.(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div class="webagent-message-time">
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
