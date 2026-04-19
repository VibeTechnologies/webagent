import { Hono } from 'hono';
import { z } from 'zod';

type Bindings = { EMAIL_QUEUE: Queue };

const emailRoute = new Hono<{ Bindings: Bindings }>();

const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
  replyTo: z.string().email().optional(),
});

emailRoute.post('/', async (c) => {
  const parsed = emailSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400);
  }

  await c.env.EMAIL_QUEUE.send(parsed.data);

  return c.json({ success: true, message: 'Email queued for delivery' });
});

export { emailRoute };
