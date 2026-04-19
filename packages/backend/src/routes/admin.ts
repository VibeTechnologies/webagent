import { Hono } from 'hono';
import { z } from 'zod';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ADMIN_SECRET: string;
};

const adminRoute = new Hono<{ Bindings: Bindings }>();

// Admin auth — require secret header
adminRoute.use('*', async (c, next) => {
  const adminKey = c.req.header('X-Admin-Secret');
  if (!adminKey || adminKey !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

const createKeySchema = z.object({
  customerId: z.string().min(1),
  provider: z.string().default('openai'),
  providerApiKey: z.string().min(1),
  monthlyBudgetCents: z.number().int().positive().optional(),
});

// Create/update a managed customer key
adminRoute.post('/keys', async (c) => {
  const parsed = createKeySchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400);
  }

  const { customerId, provider, providerApiKey, monthlyBudgetCents } = parsed.data;
  const customerKey = `wa_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;

  // Store in KV for fast lookup
  await c.env.KV.put(`key:${customerKey}`, JSON.stringify({
    customerId,
    provider,
    providerApiKey,
  }), { expirationTtl: 86400 * 365 }); // 1 year

  // Store in D1 for management
  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO customers (id, customer_key, provider, monthly_budget_cents, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).bind(customerId, customerKey, provider, monthlyBudgetCents || null).run();

  return c.json({ success: true, customerKey, customerId });
});

// List all customers
adminRoute.get('/keys', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, customer_key, provider, monthly_budget_cents, created_at FROM customers ORDER BY created_at DESC'
  ).all();
  return c.json({ customers: result.results });
});

// Delete a customer key
adminRoute.delete('/keys/:customerId', async (c) => {
  const customerId = c.req.param('customerId');
  const customer = await c.env.DB.prepare('SELECT customer_key FROM customers WHERE id = ?').bind(customerId).first();
  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  await c.env.KV.delete(`key:${customer.customer_key}`);
  await c.env.DB.prepare('DELETE FROM customers WHERE id = ?').bind(customerId).run();
  return c.json({ success: true });
});

export { adminRoute };
