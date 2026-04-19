# @vibetechnologies/webagent

Embeddable GenAI-powered web chat widget with client-side agent loop, tool calling, WebMCP support, and Cloudflare Workers backend.

[![CI](https://github.com/VibeTechnologies/webagent/actions/workflows/ci.yml/badge.svg)](https://github.com/VibeTechnologies/webagent/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@vibetechnologies/webagent)](https://www.npmjs.com/package/@vibetechnologies/webagent)

## Features

- 🤖 Client-side AI agent loop (Vercel AI SDK)
- 🔧 5 built-in tools: web_fetch, skill, todo, send_email, escalate_to_human
- 📚 TF-IDF knowledge base search
- 💾 Session persistence (IndexedDB / localStorage)
- 🌐 WebMCP support (Chrome 146+) — provider + consumer
- 🎨 Shadow DOM isolation — works on any website
- ☁️ Cloudflare Workers backend (D1, KV, Queues; R2 optional)
- 🔑 Hybrid API keys: BYOK + managed

## Quick Start

### CDN (Recommended)

```html
<script src="https://unpkg.com/@vibetechnologies/webagent/dist/webagent.min.js"></script>
<script>
  WebAgent.init({
    apiBase: 'https://your-worker.workers.dev',
    apiKey: 'wa_your_managed_key',
    welcomeMessage: 'Hi! How can I help you today?',
  });
</script>
```

### npm

```bash
npm install @vibetechnologies/webagent
```

```typescript
import { WebAgent } from '@vibetechnologies/webagent';

const agent = WebAgent.init({
  apiBase: 'https://your-worker.workers.dev',
  apiKey: 'wa_your_managed_key',
  welcomeMessage: 'Hi! How can I help?',
  theme: 'dark',
  position: 'bottom-right',
  persistence: 'indexeddb',
  sessionTtlDays: 7,
});

// Later: agent.destroy();
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `apiBase` | `string` | *required* | Backend worker URL |
| `apiKey` | `string` | `undefined` | API key (BYOK `sk-...` or managed `wa_...`) |
| `systemPrompt` | `string` | `'You are a helpful support agent.'` | System prompt |
| `skills` | `Skill[]` | `[]` | API skills for tool calling |
| `knowledgeBaseUrl` | `string` | `undefined` | URL to knowledge base JSON |
| `theme` | `'light' \| 'dark' \| 'auto' \| ThemeConfig` | `'light'` | Theme |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | FAB position |
| `welcomeMessage` | `string` | `undefined` | Initial greeting |
| `persistence` | `'indexeddb' \| 'localStorage' \| 'none'` | `'indexeddb'` | Session storage |
| `maxSteps` | `number` | `10` | Max tool-calling steps |
| `model` | `string` | `'gpt-4o-mini'` | LLM model name |
| `supportEmail` | `string` | `'support@example.com'` | Escalation recipient |
| `sessionTtlDays` | `number` | `7` | Session TTL in days |
| `onEscalation` | `(ticket) => void` | `undefined` | Escalation callback |
| `onMessage` | `(message) => void` | `undefined` | Message callback |

## Skills

See the [Skill Authoring Guide](docs/skills.md) for full documentation on creating and registering API skills.

## Architecture

```
┌─────────────────────────────┐
│   Host Website              │
│  ┌────────────────────────┐ │
│  │  Shadow DOM             │ │
│  │  ┌──────────────────┐  │ │
│  │  │  Chat Widget UI   │  │ │
│  │  │  (Preact)         │  │ │
│  │  └────────┬─────────┘  │ │
│  │           │             │ │
│  │  ┌────────▼─────────┐  │ │
│  │  │  Agent Loop       │  │ │
│  │  │  (Vercel AI SDK)  │  │ │
│  │  │  ┌─────────────┐  │  │ │
│  │  │  │ Tools        │  │  │ │
│  │  │  │ • web_fetch  │  │  │ │
│  │  │  │ • skill      │  │  │ │
│  │  │  │ • todo       │  │  │ │
│  │  │  │ • send_email │  │  │ │
│  │  │  │ • escalate   │  │  │ │
│  │  │  └─────────────┘  │  │ │
│  │  └────────┬─────────┘  │ │
│  └───────────┼────────────┘ │
└──────────────┼──────────────┘
               │ HTTPS
┌──────────────▼──────────────┐
│  Cloudflare Workers          │
│  ┌─────────┐ ┌───────────┐  │
│  │ LLM     │ │ Fetch     │  │
│  │ Proxy   │ │ Proxy     │  │
│  └─────────┘ └───────────┘  │
│  ┌─────────┐ ┌───────────┐  │
│  │ Email   │ │ Escalate  │  │
│  │ Queue   │ │ Tickets   │  │
│  └─────────┘ └───────────┘  │
│  ┌─────────┐ ┌───────────┐  │
│  │ KB (KV/R2)│ │ Admin    │  │
│  └─────────┘ └───────────┘  │
│  D1 · KV · Queues (R2 opt.) │
└──────────────────────────────┘
```

## WebMCP Support

The widget supports the [WebMCP](https://developer.chrome.com/blog/webmcp-epp) standard (Chrome 146+):

### As Provider
Skills registered with the widget are automatically exposed via `navigator.modelContext.registerTool()`, making them available to browser-level AI agents.

### As Consumer
The widget can discover and use tools registered by the host page or other extensions via the WebMCP API.

### Declarative Forms
```html
<form toolname="search-products" tooldescription="Search the product catalog">
  <input name="query" toolparamdescription="Search query" />
  <button type="submit">Search</button>
</form>
```

## Packages

| Package | Description |
|---|---|
| `@vibetechnologies/webagent` | Client-side chat widget |
| `@vibetechnologies/webagent-backend` | Cloudflare Workers backend |

## Examples

- `examples/basic/index.html` — minimal static embed example
- `examples/ecommerce/index.html` — e-commerce flavored static demo
- `examples/docs-site/index.html` — docs-focused static demo
- `examples/config-assistant/index.html` — Cloudflare-hostable widget configuration assistant with live preview and copy-paste embed generation

## Development

```bash
pnpm install
pnpm typecheck    # Type-check all packages
pnpm build        # Build all packages
pnpm test         # Run tests
pnpm dev          # Dev mode (all packages)
pnpm --filter @vibetechnologies/webagent-backend dev:azure  # Backend with ~/.env.d/azure-dev.env
```

## License

MIT
