import { render, h } from 'preact';
import { Widget } from './ui/Widget';
import type { WebAgentConfig } from './agent/types';
import { SessionStore } from './store/session';

export class WebAgent {
  private static instance: WebAgent | null = null;
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private config: WebAgentConfig;
  private sessionStore: SessionStore;

  private constructor(config: WebAgentConfig) {
    this.config = {
      position: 'bottom-right',
      theme: 'light',
      persistence: 'indexeddb',
      maxSteps: 10,
      welcomeMessage: 'Hi! How can I help you today?',
      sessionTtlDays: 7,
      ...config,
    };
    this.sessionStore = new SessionStore(this.config.persistence || 'indexeddb');
  }

  static init(config: WebAgentConfig): WebAgent {
    if (WebAgent.instance) {
      console.warn('WebAgent already initialized. Call destroy() first.');
      return WebAgent.instance;
    }

    const agent = new WebAgent(config);
    agent.mount();
    WebAgent.instance = agent;
    return agent;
  }

  static getInstance(): WebAgent | null {
    return WebAgent.instance;
  }

  private mount() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'webagent-root';
    this.container.style.cssText = 'position:fixed;z-index:2147483647;';
    document.body.appendChild(this.container);

    // Create shadow root for style isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Render Preact app into shadow root
    const mountPoint = document.createElement('div');
    mountPoint.id = 'webagent-mount';
    this.shadowRoot.appendChild(mountPoint);

    render(h(Widget, { config: this.config, sessionStore: this.sessionStore }), mountPoint);
  }

  destroy() {
    if (this.container) {
      render(null, this.shadowRoot!.getElementById('webagent-mount')!);
      this.container.remove();
      this.container = null;
      this.shadowRoot = null;
    }
    WebAgent.instance = null;
  }

  async exportSession(): Promise<string> {
    const data = await this.sessionStore.export();
    return JSON.stringify(data, null, 2);
  }

  async clearSession(): Promise<void> {
    await this.sessionStore.clear();
  }
}

// Export for ESM
export { WebAgent as default };
export type { WebAgentConfig } from './agent/types';
