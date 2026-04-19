# Deployment Guide

## Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/)
- [Cloudflare account](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## Backend Deployment

### 1. Create Cloudflare Resources

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create webagent-db

# Create KV namespace
npx wrangler kv namespace create KV

# Create Queue
npx wrangler queues create webagent-emails

# Optional (only if you want KB on R2 instead of KV fallback)
npx wrangler r2 bucket create webagent-kb
```

### 2. Update wrangler.toml

Update `packages/backend/wrangler.toml` with the IDs from step 1:

```toml
[[d1_databases]]
binding = "DB"
database_name = "webagent-db"
database_id = "YOUR_D1_DATABASE_ID"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"

[vars]
AZURE_DEV_AI_BASE_URL = "https://vibe-dev-ai.cognitiveservices.azure.com/openai/v1"
AZURE_DEV_AI_MODEL = "gpt-5.1"
```

### 3. Set Secrets

```bash
cd packages/backend

# Admin secret for API key management
npx wrangler secret put ADMIN_SECRET

# Resend API key for email delivery
npx wrangler secret put RESEND_API_KEY

# Azure dev account key for GPT-5.1 proxying
npx wrangler secret put AZURE_DEV_AI_API_KEY
```

### 4. Run Migrations

```bash
npx wrangler d1 migrations apply webagent-db
```

### 5. Deploy

```bash
pnpm --filter @vibetechnologies/webagent-backend deploy
```

## Widget Publishing

### npm

```bash
cd packages/widget
pnpm build
npm publish --access public
```

### CDN

After publishing to npm, the widget is available via:
- unpkg: `https://unpkg.com/@vibetechnologies/webagent/dist/webagent.min.js`
- jsDelivr: `https://cdn.jsdelivr.net/npm/@vibetechnologies/webagent/dist/webagent.min.js`

## Static Demo Deployment (Cloudflare Pages / Workers Assets)

The repository includes a static configuration assistant at `examples/config-assistant/index.html`. It uses a progressive bundle loader:

- **Development / local file usage**: tries `../../packages/widget/dist/webagent.min.js` first so the demo works directly from the repo or a local static server.
- **Production hosting**: falls back to versioned CDN URLs for `@vibetechnologies/webagent`, which makes the page safe to deploy as plain static assets on Cloudflare without copying the widget build output.

### Cloudflare Pages

Deploy the example directory directly:

```bash
pnpm --filter @vibetechnologies/webagent build
npx wrangler pages deploy examples/config-assistant --project-name webagent-config-assistant
```

If you want the demo to call a real backend by default, edit the form defaults in `examples/config-assistant/index.html` before deployment or configure the values in the browser after publishing.

### Cloudflare Workers static assets

Point a Worker at the example directory with Wrangler assets:

```toml
name = "webagent-config-assistant"
compatibility_date = "2025-01-01"

[assets]
directory = "examples/config-assistant"
```

Then deploy:

```bash
pnpm --filter @vibetechnologies/webagent build
npx wrangler deploy
```

### Optional: self-host the widget bundle

If you want Cloudflare to serve the widget bundle instead of the CDN, copy `packages/widget/dist/webagent.min.js` into your static asset directory and update the loader candidates in `examples/config-assistant/index.html` to prefer that hosted path in production.

## Customer API Key Setup

### Create a managed key

```bash
curl -X POST https://your-worker.workers.dev/api/admin/keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d '{
    "customerId": "customer-123",
    "provider": "openai",
    "providerApiKey": "sk-..."
  }'
```

Response: `{ "success": true, "customerKey": "wa_abc123...", "customerId": "customer-123" }`

### BYOK (Bring Your Own Key)

Customers can pass their own OpenAI/Anthropic key directly:

```html
<script>
  WebAgent.init({
    apiBase: 'https://your-worker.workers.dev',
    apiKey: 'sk-...', // Their own OpenAI key
  });
</script>
```

## Knowledge Base Setup

### Upload knowledge base chunks

```bash
curl -X PUT https://your-worker.workers.dev/api/kb/my-docs \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d '[
    {
      "id": "getting-started",
      "title": "Getting Started",
      "content": "Welcome to our product...",
      "keywords": ["setup", "install", "start"]
    }
  ]'
```

By default this backend can store KB docs in **KV** (free-tier friendly) when no R2 bucket binding is configured.
If you enable and bind R2 later, `/api/kb` automatically uses R2.

### Configure widget to use KB

```html
<script>
  WebAgent.init({
    apiBase: 'https://your-worker.workers.dev',
    apiKey: 'wa_xxx',
    knowledgeBaseUrl: 'https://your-worker.workers.dev/api/kb/my-docs',
  });
</script>
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_SECRET` | Yes | Secret for admin API endpoints |
| `RESEND_API_KEY` | Yes | [Resend](https://resend.com) API key for email |
| `AZURE_DEV_AI_API_KEY` | Yes (for Azure GPT-5.1 proxy mode) | Azure OpenAI key used by backend proxy when provider is `azure-openai` |
| `AZURE_DEV_AI_BASE_URL` | Yes (wrangler var) | Azure OpenAI base URL (`.../openai/v1`) |
| `AZURE_DEV_AI_MODEL` | No | Default Azure model/deployment (`gpt-5.1`) |

## Cloudflare Free Tier Limits

| Resource | Limit |
|---|---|
| Workers requests | 100,000/day |
| D1 reads | 5,000,000/day |
| D1 writes | 100,000/day |
| D1 storage | 5 GB |
| KV reads | 100,000/day |
| KV writes | 1,000/day |
| R2 storage | 10 GB |
| R2 reads | 10,000,000/month |
| Queues messages | 1,000,000/month |

## CI/CD

The repository includes GitHub Actions workflows:

- **CI** (`.github/workflows/ci.yml`): Runs on PRs — typecheck, lint, test, build
- **Publish** (`.github/workflows/publish.yml`): Publishes to npm on GitHub Release
- **Deploy** (`.github/workflows/deploy.yml`): Deploys backend on push to main

### Setting up CI/CD secrets

In your GitHub repo settings → Secrets:

| Secret | Purpose |
|---|---|
| `NPM_TOKEN` | npm publish token |
| `CLOUDFLARE_API_TOKEN` | Wrangler deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
