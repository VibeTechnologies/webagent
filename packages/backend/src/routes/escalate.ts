import { Hono } from 'hono';
import { z } from 'zod';

type Bindings = {
  DB: D1Database;
  EMAIL_QUEUE: Queue;
};

const escalateRoute = new Hono<{ Bindings: Bindings }>();

const escalateSchema = z.object({
  userEmail: z.string().email(),
  userName: z.string().optional(),
  context: z.string().optional(),
  transcript: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  supportEmail: z.string().email(),
  metadata: z.record(z.any()).optional(),
});

escalateRoute.post('/', async (c) => {
  const parsed = escalateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400);
  }

  const { userEmail, userName, context, transcript, supportEmail, metadata } = parsed.data;

  // Generate ticket ID
  const ticketId = `ESC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Format transcript as HTML
  const transcriptHtml = transcript.map(msg => 
    `<div style="margin-bottom: 12px;">
      <strong style="color: ${msg.role === 'user' ? '#2563eb' : '#059669'}">${msg.role === 'user' ? (userName || 'Customer') : 'Agent'}:</strong>
      <p style="margin: 4px 0; white-space: pre-wrap;">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>`
  ).join('');

  const emailBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px;">
      <h2 style="color: #dc2626;">🎫 Escalation Request — ${ticketId}</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Customer Email</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userEmail}</td></tr>
        ${userName ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Name</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userName}</td></tr>` : ''}
        ${context ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Context</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${context}</td></tr>` : ''}
      </table>
      <h3 style="margin-top: 24px;">Chat Transcript</h3>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
        ${transcriptHtml}
      </div>
      ${metadata ? `<p style="color: #6b7280; font-size: 12px; margin-top: 16px;">Metadata: ${JSON.stringify(metadata)}</p>` : ''}
    </div>
  `;

  // Store ticket in D1
  try {
    await c.env.DB.prepare(
      `INSERT INTO escalation_tickets (ticket_id, user_email, user_name, context, transcript, support_email, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'open', datetime('now'))`
    ).bind(ticketId, userEmail, userName || null, context || null, JSON.stringify(transcript), supportEmail).run();
  } catch (err) {
    console.error('Failed to store ticket:', err);
  }

  // Queue email
  await c.env.EMAIL_QUEUE.send({
    to: supportEmail,
    subject: `[${ticketId}] Escalation from ${userName || userEmail}`,
    body: emailBody,
    replyTo: userEmail,
  });

  return c.json({
    success: true,
    ticketId,
    message: 'Escalation submitted. A support agent will review your case.',
  });
});

export { escalateRoute };
