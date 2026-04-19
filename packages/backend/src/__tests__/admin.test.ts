import { Hono } from 'hono';
import { adminRoute } from '../routes/admin';
import { createMockBindings } from './test-helpers';

describe('admin route', () => {
  it('returns 401 without admin secret', async () => {
    const app = new Hono();
    app.route('/api/admin', adminRoute);

    const { bindings } = createMockBindings();
    const res = await app.request('/api/admin/keys', { method: 'GET' }, bindings as any);

    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong admin secret', async () => {
    const app = new Hono();
    app.route('/api/admin', adminRoute);

    const { bindings } = createMockBindings();
    const res = await app.request(
      '/api/admin/keys',
      { method: 'GET', headers: { 'X-Admin-Secret': 'wrong-secret' } },
      bindings as any
    );

    expect(res.status).toBe(401);
  });

  it('creates a managed key and persists customer for list endpoint', async () => {
    const app = new Hono();
    app.route('/api/admin', adminRoute);

    const { bindings, stores } = createMockBindings();

    const createRes = await app.request(
      '/api/admin/keys',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': 'admin-secret',
        },
        body: JSON.stringify({
          customerId: 'customer-1',
          provider: 'openai',
          providerApiKey: 'sk-provider',
          monthlyBudgetCents: 2500,
        }),
      },
      bindings as any
    );

    expect(createRes.status).toBe(200);
    const createBody = await createRes.json() as any;
    expect(createBody.customerKey).toMatch(/^wa_/);

    const kvValue = stores.kv.get(`key:${createBody.customerKey}`);
    expect(kvValue).toBeTruthy();

    const listRes = await app.request(
      '/api/admin/keys',
      { method: 'GET', headers: { 'X-Admin-Secret': 'admin-secret' } },
      bindings as any
    );

    expect(listRes.status).toBe(200);
    const listBody = await listRes.json() as any;
    expect(listBody.customers).toHaveLength(1);
    expect(listBody.customers[0].id).toBe('customer-1');
    expect(listBody.customers[0].customer_key).toBe(createBody.customerKey);
  });
});
