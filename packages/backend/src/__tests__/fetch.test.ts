import { Hono } from 'hono';
import { afterEach } from 'vitest';
import { authMiddleware } from '../middleware/auth';
import { fetchRoute } from '../routes/fetch';
import { createMockBindings } from './test-helpers';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetch route', () => {
  it('returns proxied result for valid URL', async () => {
    const app = new Hono();
    app.route('/api/fetch', fetchRoute);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('proxied body', {
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'text/plain' },
      })
    );

    const { bindings } = createMockBindings();
    const res = await app.request(
      '/api/fetch',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com', method: 'GET' }),
      },
      bindings as any
    );

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe(201);
    expect(body.body).toBe('proxied body');
    expect(body.contentType).toBe('text/plain');
  });

  it('blocks localhost URL', async () => {
    const app = new Hono();
    app.route('/api/fetch', fetchRoute);
    const { bindings } = createMockBindings();

    const res = await app.request(
      '/api/fetch',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://localhost/test' }),
      },
      bindings as any
    );

    expect(res.status).toBe(403);
  });

  it('blocks 127.0.0.1 URL', async () => {
    const app = new Hono();
    app.route('/api/fetch', fetchRoute);
    const { bindings } = createMockBindings();

    const res = await app.request(
      '/api/fetch',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://127.0.0.1/test' }),
      },
      bindings as any
    );

    expect(res.status).toBe(403);
  });

  it('blocks private IP ranges', async () => {
    const app = new Hono();
    app.route('/api/fetch', fetchRoute);
    const { bindings } = createMockBindings();

    const res10 = await app.request(
      '/api/fetch',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://10.1.2.3/test' }),
      },
      bindings as any
    );
    const res192 = await app.request(
      '/api/fetch',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://192.168.1.20/test' }),
      },
      bindings as any
    );

    expect(res10.status).toBe(403);
    expect(res192.status).toBe(403);
  });

  it('returns 400 for invalid body', async () => {
    const app = new Hono();
    app.route('/api/fetch', fetchRoute);
    const { bindings } = createMockBindings();

    const res = await app.request(
      '/api/fetch',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'GET' }),
      },
      bindings as any
    );

    expect(res.status).toBe(400);
  });

  it('returns 401 when auth middleware is used and auth is missing', async () => {
    const app = new Hono();
    app.use('/api/*', authMiddleware as any);
    app.route('/api/fetch', fetchRoute);
    const { bindings } = createMockBindings();

    const res = await app.request(
      '/api/fetch',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      },
      bindings as any
    );

    expect(res.status).toBe(401);
  });
});
