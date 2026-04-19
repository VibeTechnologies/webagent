import type { ThemeConfig } from '../agent/types';

export function styles(theme: 'light' | 'dark' | 'auto' | ThemeConfig = 'light'): string {
  const isObjectTheme = typeof theme === 'object' && theme !== null;
  const primary = isObjectTheme ? theme.primaryColor || '#4f46e5' : '#4f46e5';
  const background = isObjectTheme ? theme.backgroundColor || '#ffffff' : '#ffffff';
  const text = isObjectTheme ? theme.textColor || '#0f172a' : '#0f172a';
  const font = isObjectTheme
    ? theme.fontFamily || "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    : "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
  const radius = isObjectTheme ? theme.borderRadius || '14px' : '14px';
  const fabSize = isObjectTheme ? theme.fabSize || '56px' : '56px';

  const darkMode = theme === 'dark';

  return `
:host, .webagent-container {
  --wa-primary: ${primary};
  --wa-bg: ${darkMode ? '#111827' : background};
  --wa-text: ${darkMode ? '#f3f4f6' : text};
  --wa-font: ${font};
  --wa-radius: ${radius};
  --wa-fab-size: ${fabSize};
  --wa-surface: ${darkMode ? '#1f2937' : '#f8fafc'};
  --wa-border: ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)'};
  --wa-muted: ${darkMode ? '#9ca3af' : '#64748b'};
  font-family: var(--wa-font);
  color: var(--wa-text);
}

.webagent-container {
  position: fixed;
  bottom: 24px;
  pointer-events: none;
}

.webagent-bottom-right { right: 24px; }
.webagent-bottom-left { left: 24px; }

.webagent-container * {
  box-sizing: border-box;
}

.webagent-fab {
  pointer-events: auto;
  width: var(--wa-fab-size);
  height: var(--wa-fab-size);
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--wa-primary) 85%, #fff 15%), var(--wa-primary));
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35);
  position: relative;
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
}

.webagent-fab:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.4);
  filter: saturate(1.06);
}

.webagent-fab:active {
  transform: scale(0.98);
}

.webagent-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  line-height: 20px;
  font-weight: 700;
  border: 2px solid var(--wa-bg);
  text-align: center;
}

.webagent-window {
  pointer-events: auto;
  width: 380px;
  height: 520px;
  background: var(--wa-bg);
  color: var(--wa-text);
  border: 1px solid var(--wa-border);
  border-radius: var(--wa-radius);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 14px;
  animation: webagent-slide-up 180ms ease-out;
}

.webagent-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, var(--wa-primary), color-mix(in srgb, var(--wa-primary) 70%, #111827));
  color: #fff;
}

.webagent-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
}

.webagent-header-icon { font-size: 16px; }

.webagent-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.webagent-header-btn {
  border: none;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  border-radius: 8px;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  font-size: 13px;
  cursor: pointer;
  transition: background 120ms ease;
}

.webagent-header-btn:hover { background: rgba(255, 255, 255, 0.24); }

.webagent-messages {
  flex: 1;
  overflow-y: auto;
  background: var(--wa-surface);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.webagent-message {
  display: flex;
  flex-direction: column;
  max-width: 82%;
  gap: 4px;
}

.webagent-message-user {
  align-self: flex-end;
  align-items: flex-end;
}

.webagent-message-assistant {
  align-self: flex-start;
}

.webagent-message-bubble {
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.45;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  word-break: break-word;
}

.webagent-message-user .webagent-message-bubble {
  background: var(--wa-primary);
  color: #fff;
  border-bottom-right-radius: 6px;
}

.webagent-message-assistant .webagent-message-bubble {
  background: ${darkMode ? 'rgba(255,255,255,0.08)' : '#fff'};
  color: var(--wa-text);
  border: 1px solid var(--wa-border);
  border-bottom-left-radius: 6px;
}

.webagent-message-bubble a {
  color: inherit;
  text-decoration: underline;
}

.webagent-message-bubble code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: rgba(127, 127, 127, 0.2);
  padding: 1px 4px;
  border-radius: 4px;
}

.webagent-message-time {
  font-size: 11px;
  color: var(--wa-muted);
  padding: 0 4px;
}

.webagent-typing {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--wa-muted);
  font-size: 12px;
}

.webagent-typing-dots {
  display: inline-flex;
  gap: 4px;
}

.webagent-typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--wa-muted);
  opacity: 0.65;
  animation: webagent-bounce 1s infinite;
}

.webagent-typing-dots span:nth-child(2) { animation-delay: 0.12s; }
.webagent-typing-dots span:nth-child(3) { animation-delay: 0.24s; }

.webagent-input-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--wa-border);
  background: var(--wa-bg);
}

.webagent-input {
  flex: 1;
  resize: none;
  border: 1px solid var(--wa-border);
  border-radius: 12px;
  padding: 10px 12px;
  min-height: 40px;
  max-height: 120px;
  font: inherit;
  color: var(--wa-text);
  background: ${darkMode ? 'rgba(255,255,255,0.04)' : '#fff'};
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.webagent-input:focus {
  border-color: color-mix(in srgb, var(--wa-primary) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--wa-primary) 18%, transparent);
}

.webagent-send-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: var(--wa-primary);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--wa-primary) 35%, transparent);
  transition: transform 120ms ease, opacity 120ms ease, filter 120ms ease;
}

.webagent-send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.webagent-send-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.webagent-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.webagent-suggestion-chip {
  border: 1px solid var(--wa-border);
  background: ${darkMode ? 'rgba(255,255,255,0.06)' : '#fff'};
  color: var(--wa-text);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}

.webagent-suggestion-chip:hover {
  border-color: color-mix(in srgb, var(--wa-primary) 40%, var(--wa-border));
  background: color-mix(in srgb, var(--wa-primary) 10%, var(--wa-bg));
}

.webagent-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 2147483647;
}

.webagent-modal {
  width: min(480px, calc(100vw - 24px));
  background: var(--wa-bg);
  color: var(--wa-text);
  border-radius: 16px;
  border: 1px solid var(--wa-border);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.webagent-modal-header,
.webagent-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
}

.webagent-modal-header {
  border-bottom: 1px solid var(--wa-border);
}

.webagent-modal-close {
  border: none;
  background: transparent;
  color: var(--wa-text);
  font-size: 18px;
  cursor: pointer;
}

.webagent-modal-body {
  padding: 14px;
  display: grid;
  gap: 10px;
}

.webagent-modal-desc {
  margin: 0;
  color: var(--wa-muted);
  font-size: 13px;
}

.webagent-label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.webagent-field {
  width: 100%;
  border: 1px solid var(--wa-border);
  border-radius: 10px;
  padding: 9px 10px;
  font: inherit;
  color: var(--wa-text);
  background: ${darkMode ? 'rgba(255,255,255,0.04)' : '#fff'};
}

.webagent-textarea {
  resize: vertical;
}

.webagent-btn {
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.webagent-btn-primary {
  background: var(--wa-primary);
  color: #fff;
}

.webagent-btn-secondary {
  background: ${darkMode ? 'rgba(255,255,255,0.08)' : '#eef2ff'};
  color: var(--wa-text);
}

.webagent-transcript-details {
  border: 1px solid var(--wa-border);
  border-radius: 10px;
  padding: 8px 10px;
  background: ${darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'};
}

.webagent-transcript-preview {
  max-height: 180px;
  overflow: auto;
  margin-top: 8px;
  display: grid;
  gap: 6px;
  font-size: 12px;
}

.webagent-todo-panel {
  border-top: 1px solid var(--wa-border);
  border-bottom: 1px solid var(--wa-border);
  background: ${darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'};
}

.webagent-todo-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--wa-muted);
  text-transform: uppercase;
  letter-spacing: .04em;
}

.webagent-todo-list {
  display: grid;
  gap: 6px;
  padding: 0 12px 10px;
}

.webagent-todo-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.webagent-todo-checkbox {
  line-height: 1.2;
  color: var(--wa-primary);
}

.webagent-todo-title { font-weight: 600; }
.webagent-todo-desc {
  color: var(--wa-muted);
  font-size: 12px;
}

.webagent-todo-done {
  opacity: 0.7;
  text-decoration: line-through;
}

@media (max-width: 520px) {
  .webagent-window {
    width: calc(100vw - 24px);
    height: min(70vh, 560px);
  }

  .webagent-bottom-left,
  .webagent-bottom-right {
    left: 12px;
    right: 12px;
  }

  .webagent-container {
    bottom: 12px;
  }
}

@keyframes webagent-slide-up {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes webagent-bounce {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.55;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
`;
}
