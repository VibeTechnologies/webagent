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

# Create R2 bucket
npx wrangler r2 bucket create webagent-kb

# Create Queue
npx wrangler queues create webagent-emails
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
```

### 3. Set Secrets

```bash
cd packages/backend

# Admin secret for API key management
npx wrangler secret put ADMIN_SECRET

# Resend API key for email delivery
npx wrangler secret put RESEND_API_KEY
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
