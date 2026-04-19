import { h } from 'preact';
import type { ChatMessage as ChatMessageType } from '../agent/types';

interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestionClick?: (text: string) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Parse suggestions from <suggestion> tags (before escaping)
  const suggestions: string[] = [];
  let rawContent = message.content;
  const suggestionRegex = /<suggestion>(.*?)<\/suggestion>/g;
  let match;
  while ((match = suggestionRegex.exec(message.content)) !== null) {
    suggestions.push(match[1]);
  }
  rawContent = rawContent.replace(suggestionRegex, '').trim();

  // Escape HTML first, then apply markdown-like formatting
  const renderContent = (text: string) => {
    let html = escapeHtml(text);
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    // Links — only allow safe protocols
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, (_, label, url) => {
      const decoded = url.replace(/&amp;/g, '&');
      return isSafeUrl(decoded)
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : label;
    });
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    return { __html: html };
  };

  return (
    <div class={`wa-msg wa-msg--${isUser ? 'user' : 'assistant'}`}>
      <div class="wa-msg__bubble" dangerouslySetInnerHTML={renderContent(rawContent)} />
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              class="wa-btn wa-btn--ghost"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => onSuggestionClick?.(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <span class="wa-msg__meta">
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
