# Skill Authoring Guide

Skills are pre-configured API integrations that the WebAgent can execute on behalf of users. They enable the agent to perform actions like searching products, placing orders, or looking up account information.

## Skill Definition

```typescript
interface Skill {
  name: string;          // Unique identifier (e.g., 'search-products')
  title: string;         // Human-readable name
  description: string;   // LLM-facing description
  parameters: object;    // JSON Schema for tool parameters
  endpoint: string;      // API endpoint URL (supports {param} templates)
  method: string;        // HTTP method
  headers?: object;      // Custom headers
  bodyTemplate?: object; // Request body template with {{param}} placeholders
  readOnly?: boolean;    // Hint for WebMCP annotations
}
```

## Example: Product Search Skill

```typescript
const searchProducts = {
  name: 'search-products',
  title: 'Search Products',
  description: 'Search the product catalog by keyword, category, or price range',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search keywords' },
      category: { type: 'string', description: 'Product category' },
      maxPrice: { type: 'number', description: 'Maximum price' },
    },
    required: ['query'],
  },
  endpoint: 'https://api.store.com/products/search',
  method: 'POST',
  headers: {
    'X-Store-ID': 'my-store',
  },
  bodyTemplate: {
    q: '{{query}}',
    category: '{{category}}',
    price_max: '{{maxPrice}}',
  },
};
```

## Example: Order Lookup Skill

```typescript
const lookupOrder = {
  name: 'lookup-order',
  title: 'Look Up Order',
  description: 'Look up an order by order ID or email address',
  parameters: {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'Order ID' },
      email: { type: 'string', description: 'Customer email' },
    },
  },
  endpoint: 'https://api.store.com/orders/{orderId}',
  method: 'GET',
  readOnly: true,
};
```

## URL Template Parameters

Parameters in `{braces}` in the endpoint URL are substituted from the tool call args:
- `https://api.example.com/users/{userId}` → `https://api.example.com/users/123`

## Body Template Parameters

Parameters in `{{double braces}}` in the bodyTemplate are substituted:
- `{ "q": "{{query}}" }` → `{ "q": "wireless headphones" }`

## Registering Skills

```typescript
WebAgent.init({
  apiBase: 'https://your-worker.workers.dev',
  apiKey: 'wa_xxx',
  skills: [searchProducts, lookupOrder],
});
```

## WebMCP Integration

When skills are registered, they are automatically exposed via the WebMCP API (`navigator.modelContext.registerTool()`). This means:

1. Browser-level AI agents can discover your skills
2. The `readOnly` flag maps to WebMCP's `annotations.readOnlyHint`
3. Skills follow the OpenAI function-calling parameter schema

## Best Practices

1. **Write clear descriptions** — The LLM uses these to decide when to call the skill
2. **Use JSON Schema properly** — Include `description` on each parameter
3. **Mark read-only skills** — Set `readOnly: true` for GET/lookup operations
4. **Use URL templates for path params** — `{param}` in endpoint URL
5. **Use body templates for POST data** — `{{param}}` in bodyTemplate
6. **Handle errors gracefully** — The agent will receive error responses and can retry or inform the user
7. **Keep skills focused** — One skill = one API action
