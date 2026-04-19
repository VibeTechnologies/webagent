import { Context, Next } from 'hono';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

// Simple in-memory rate limiting (resets per Worker instance)
// For production, use Cloudflare Rate Limiting binding
const requests = new Map<string, { count: number; resetAt: number }>();

export const rateLimitMiddleware = async (c: Context, next: Next) => {
  const key = c.req.header('Authorization')?.replace('Bearer ', '') || 
              c.req.header('CF-Connecting-IP') || 
              'anonymous';

  const now = Date.now();
  const entry = requests.get(key);

  if (entry && entry.resetAt > now) {
    if (entry.count >= MAX_REQUESTS) {
      c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    entry.count++;
  } else {
    requests.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }

  await next();
};
