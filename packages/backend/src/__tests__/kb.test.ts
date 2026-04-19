import { Hono } from 'hono';
import { kbRoute } from '../routes/kb';
import { createMockBindings } from './test-helpers';

describe('kb route', () => {
  it('returns existing KB entry', async () => {
    const app = new Hono();
    app.route('/api/kb', kbRoute);

    const { bindings, stores } = createMockBindings();
    stores.kb.set('kb/existing.json', JSON.stringify({ id: 'existing', text: 'hello' }));

    const res = await app.request('/api/kb/existing', { method: 'GET' }, bindings as any);

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toEqual({ id: 'existing', text: 'hello' });
  });

  it('returns 404 for missing KB entry', async () => {
    const app = new Hono();
    app.route('/api/kb', kbRoute);

    const { bindings } = createMockBindings();
    const res = await app.request('/api/kb/missing', { method: 'GET' }, bindings as any);

    expect(res.status).toBe(404);
  });

  it('returns 401 on PUT without admin secret', async () => {
    const app = new Hono();
    app.route('/api/kb', kbRoute);

    const { bindings } = createMockBindings();
    const res = await app.request(
      '/api/kb/doc-1',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'value' }),
      },
      bindings as any
    );

    expect(res.status).toBe(401);
  });

  it('uploads with admin secret and GET returns uploaded content', async () => {
    const app = new Hono();
    app.route('/api/kb', kbRoute);

    const { bindings } = createMockBindings();

    const putRes = await app.request(
      '/api/kb/doc-2',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': 'admin-secret',
        },
        body: JSON.stringify({ id: 'doc-2', text: 'uploaded' }),
      },
      bindings as any
    );

    expect(putRes.status).toBe(200);

    const getRes = await app.request('/api/kb/doc-2', { method: 'GET' }, bindings as any);
    expect(getRes.status).toBe(200);
    const body = await getRes.json() as any;
    expect(body).toEqual({ id: 'doc-2', text: 'uploaded' });
  });

  it('falls back to KV reads when R2 binding is unavailable', async () => {
    const app = new Hono();
    app.route('/api/kb', kbRoute);

    const { bindings, stores } = createMockBindings({ KB_BUCKET: undefined as any });
    stores.kv.set('kb:kv-doc', JSON.stringify({ id: 'kv-doc', text: 'from-kv' }));

    const res = await app.request('/api/kb/kv-doc', { method: 'GET' }, bindings as any);

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toEqual({ id: 'kv-doc', text: 'from-kv' });
  });

  it('falls back to KV writes when R2 binding is unavailable', async () => {
    const app = new Hono();
    app.route('/api/kb', kbRoute);

    const { bindings, stores } = createMockBindings({ KB_BUCKET: undefined as any });

    const putRes = await app.request(
      '/api/kb/doc-kv',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': 'admin-secret',
        },
        body: JSON.stringify({ id: 'doc-kv', text: 'stored-in-kv' }),
      },
      bindings as any
    );

    expect(putRes.status).toBe(200);
    expect(stores.kv.get('kb:doc-kv')).toBe(JSON.stringify({ id: 'doc-kv', text: 'stored-in-kv' }));
  });
});
