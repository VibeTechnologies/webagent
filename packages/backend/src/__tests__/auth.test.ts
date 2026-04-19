import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { createMockBindings } from './test-helpers';

const createApp = () => {
  type Variables = {
    customerId?: string;
    provider?: string;
    providerApiKey?: string;
    isByok: boolean;
  };
  const app = new Hono<{ Variables: Variables }>();
  app.use('/secure/*', authMiddleware as any);
  app.get('/secure/check', (c) =>
    c.json({
      customerId: c.get('customerId'),
      provider: c.get('provider'),
      providerApiKey: c.get('providerApiKey'),
      isByok: c.get('isByok'),
    })
  );
  return app;
};

describe('auth middleware', () => {
  it('returns 401 without Authorization header', async () => {
    const app = createApp();
    const { bindings } = createMockBindings();

    const res = await app.request('/secure/check', { method: 'GET' }, bindings as any);

    expect(res.status).toBe(401);
  });

  it('returns 401 for empty Bearer token', async () => {
    const app = createApp();
    const { bindings } = createMockBindings();

    const res = await app.request(
      '/secure/check',
      { method: 'GET', headers: { Authorization: 'Bearer ' } },
      bindings as any
    );

    expect(res.status).toBe(401);
  });

  it('passes BYOK token and marks isByok=true', async () => {
    const app = createApp();
    const { bindings } = createMockBindings();

    const res = await app.request(
      '/secure/check',
      { method: 'GET', headers: { Authorization: 'Bearer sk-byok-key' } },
      bindings as any
    );

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.isByok).toBe(true);
    expect(body.providerApiKey).toBe('sk-byok-key');
  });

  it('returns 401 for managed key missing in KV', async () => {
    const app = createApp();
    const { bindings } = createMockBindings();

    const res = await app.request(
      '/secure/check',
      { method: 'GET', headers: { Authorization: 'Bearer wa_missing' } },
      bindings as any
    );

    expect(res.status).toBe(401);
  });

  it('passes valid managed key from KV', async () => {
    const app = createApp();
    const { bindings, stores } = createMockBindings();
    stores.kv.set(
      'key:wa_valid',
      JSON.stringify({
        customerId: 'cust_1',
        provider: 'openai',
        providerApiKey: 'sk-managed',
      })
    );

    const res = await app.request(
      '/secure/check',
      { method: 'GET', headers: { Authorization: 'Bearer wa_valid' } },
      bindings as any
    );

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.customerId).toBe('cust_1');
    expect(body.provider).toBe('openai');
    expect(body.providerApiKey).toBe('sk-managed');
    expect(body.isByok).toBe(false);
  });
});
