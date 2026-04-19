import { Hono } from 'hono';
import { z } from 'zod';

type Bindings = { DB: D1Database };

const fetchRoute = new Hono<{ Bindings: Bindings }>();

const MAX_RESPONSE_SIZE = 1024 * 1024; // 1MB

const fetchSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
});

fetchRoute.post('/', async (c) => {
  const parsed = fetchSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400);
  }

  const { url, method, headers, body } = parsed.data;

  // Block internal/private IPs
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname) ||
        hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
      return c.json({ error: 'Internal URLs are not allowed' }, 403);
    }
  } catch {
    return c.json({ error: 'Invalid URL' }, 400);
  }

  try {
    const response = await fetch(url, {
      method,
      headers: headers || {},
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('content-type') || 'text/plain';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    if (contentLength > MAX_RESPONSE_SIZE) {
      return c.json({ error: 'Response too large', maxSize: MAX_RESPONSE_SIZE }, 413);
    }

    // Read response as text (safe for JSON and text content types)
    const text = await response.text();
    if (text.length > MAX_RESPONSE_SIZE) {
      return c.json({ 
        error: 'Response too large', 
        truncated: text.slice(0, MAX_RESPONSE_SIZE),
        maxSize: MAX_RESPONSE_SIZE 
      }, 413);
    }

    return c.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
      contentType,
    });
  } catch (err: any) {
    return c.json({ error: 'Fetch failed', message: err.message }, 502);
  }
});

export { fetchRoute };
