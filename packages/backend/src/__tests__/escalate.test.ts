import { Hono } from 'hono';
import { escalateRoute } from '../routes/escalate';
import { createMockBindings } from './test-helpers';

describe('escalate route', () => {
  it('accepts valid payload and queues escalation message', async () => {
    const app = new Hono();
    app.route('/api/escalate', escalateRoute);

    const { bindings, stores } = createMockBindings();
    const res = await app.request(
      '/api/escalate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: 'user@example.com',
          userName: 'User',
          transcript: [
            { role: 'user', content: 'Need help' },
            { role: 'assistant', content: 'Sure, I can help.' },
          ],
          supportEmail: 'support@example.com',
        }),
      },
      bindings as any
    );

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ticketId).toBeTruthy();
    expect(stores.queue).toHaveLength(1);
  });

  it('returns 400 when transcript is missing', async () => {
    const app = new Hono();
    app.route('/api/escalate', escalateRoute);

    const { bindings } = createMockBindings();
    const res = await app.request(
      '/api/escalate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: 'user@example.com',
          supportEmail: 'support@example.com',
        }),
      },
      bindings as any
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email', async () => {
    const app = new Hono();
    app.route('/api/escalate', escalateRoute);

    const { bindings } = createMockBindings();
    const res = await app.request(
      '/api/escalate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: 'invalid-email',
          transcript: [{ role: 'user', content: 'Need help' }],
          supportEmail: 'support@example.com',
        }),
      },
      bindings as any
    );

    expect(res.status).toBe(400);
  });
});
