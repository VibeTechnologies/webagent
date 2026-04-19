import { Hono } from 'hono';
import { healthRoute } from '../routes/health';
import { createMockBindings } from './test-helpers';

describe('health route', () => {
  it('GET /api/health returns ok', async () => {
    const app = new Hono();
    app.route('/api/health', healthRoute);

    const { bindings } = createMockBindings();
    const res = await app.request('/api/health', { method: 'GET' }, bindings as any);

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe('ok');
  });
});
