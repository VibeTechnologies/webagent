import { Context, Next } from 'hono';

type Bindings = { DB: D1Database };
type Variables = { customerId?: string };

export const usageMiddleware = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) => {
  await next();
  // Usage logging is handled per-route (e.g., in chat.ts after receiving tokens)
};
