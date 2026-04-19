import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { WebAgentConfig, ChatMessage } from '../agent/types';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, name: string, context: string) => void;
  messages: ChatMessage[];
  config: WebAgentConfig;
}

export function EscalationModal({ isOpen, onClose, onSubmit, messages, config }: EscalationModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    await onSubmit(email.trim(), name.trim(), context.trim());
    setSubmitting(false);
    onClose();
  };

  return (
    <div class="webagent-modal-overlay" onClick={onClose}>
      <div class="webagent-modal" onClick={(e) => e.stopPropagation()}>
        <div class="webagent-modal-header">
          <h3>Contact Support</h3>
          <button class="webagent-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class="webagent-modal-body">
            <p class="webagent-modal-desc">
              We'll send your chat transcript to our support team who will follow up via email.
            </p>
            <label class="webagent-label">
              Email *
              <input
                type="email"
                class="webagent-field"
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                required
                placeholder="your@email.com"
              />
            </label>
            <label class="webagent-label">
              Name
              <input
                type="text"
                class="webagent-field"
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="Your name"
              />
            </label>
            <label class="webagent-label">
              Additional context
              <textarea
                class="webagent-field webagent-textarea"
                value={context}
                onInput={(e) => setContext((e.target as HTMLTextAreaElement).value)}
                placeholder="Anything else we should know?"
                rows={3}
              />
            </label>
            <details class="webagent-transcript-details">
              <summary>Chat transcript ({messages.length} messages)</summary>
              <div class="webagent-transcript-preview">
                {messages.slice(-10).map(m => (
                  <div key={m.id} class="webagent-transcript-msg">
                    <strong>{m.role === 'user' ? 'You' : 'Agent'}:</strong> {m.content.slice(0, 200)}
                    {m.content.length > 200 ? '...' : ''}
                  </div>
                ))}
              </div>
            </details>
          </div>
          <div class="webagent-modal-footer">
            <button type="button" class="webagent-btn webagent-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" class="webagent-btn webagent-btn-primary" disabled={submitting || !email.trim()}>
              {submitting ? 'Sending...' : 'Send to Support'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
