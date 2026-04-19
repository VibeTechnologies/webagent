import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { chatRoute } from './routes/chat';
import { fetchRoute } from './routes/fetch';
import { emailRoute } from './routes/email';
import { escalateRoute } from './routes/escalate';
import { healthRoute } from './routes/health';
import { adminRoute } from './routes/admin';
import { kbRoute } from './routes/kb';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  KB_BUCKET?: R2Bucket;
  EMAIL_QUEUE: Queue;
  ADMIN_SECRET: string;
  RESEND_API_KEY: string;
  AZURE_DEV_AI_API_KEY?: string;
  AZURE_DEV_AI_BASE_URL?: string;
  AZURE_DEV_AI_MODEL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-LLM-Provider', 'X-Customer-Key'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Health check (no auth)
app.route('/api/health', healthRoute);

// API routes (with auth + rate limiting)
app.use('/v1/*', authMiddleware);
app.use('/api/*', authMiddleware);
app.use('/v1/*', rateLimitMiddleware);
app.use('/api/*', rateLimitMiddleware);

app.route('/v1/chat', chatRoute);
app.route('/api/fetch', fetchRoute);
app.route('/api/email', emailRoute);
app.route('/api/escalate', escalateRoute);
app.route('/api/kb', kbRoute);
app.route('/api/admin', adminRoute);

// Queue consumer for email delivery
export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch, env: Bindings) {
    for (const message of batch.messages) {
      const { to, subject, body, replyTo } = message.body as any;
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'WebAgent <noreply@webagent.dev>',
            to: Array.isArray(to) ? to : [to],
            subject,
            html: body,
            reply_to: replyTo,
          }),
        });
        if (!res.ok) {
          console.error('Email send failed:', await res.text());
          message.retry();
        } else {
          message.ack();
        }
      } catch (err) {
        console.error('Email error:', err);
        message.retry();
      }
    }
  },
};
