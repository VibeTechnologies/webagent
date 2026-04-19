import { Hono } from 'hono';
import { emailRoute } from '../routes/email';
import { createMockBindings } from './test-helpers';

describe('email route', () => {
  it('queues message for valid payload', async () => {
    const app = new Hono();
    app.route('/api/email', emailRoute);

    const { bindings, stores } = createMockBindings();
    const res = await app.request(
      '/api/email',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'user@example.com',
          subject: 'Hello',
          body: 'Message body',
        }),
      },
      bindings as any
    );

    expect(res.status).toBe(200);
    expect(stores.queue).toHaveLength(1);
  });

  it('returns 400 for invalid email', async () => {
    const app = new Hono();
    app.route('/api/email', emailRoute);

    const { bindings } = createMockBindings();
    const res = await app.request(
      '/api/email',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'not-an-email',
          subject: 'Hello',
          body: 'Message body',
        }),
      },
      bindings as any
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 for missing required fields', async () => {
    const app = new Hono();
    app.route('/api/email', emailRoute);

    const { bindings } = createMockBindings();
    const res = await app.request(
      '/api/email',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
      bindings as any
    );

    expect(res.status).toBe(400);
  });
});
