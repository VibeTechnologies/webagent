import { Hono } from 'hono';

type Bindings = {
  KB_BUCKET: R2Bucket;
  ADMIN_SECRET: string;
};

const kbRoute = new Hono<{ Bindings: Bindings }>();

// Get knowledge base chunks
kbRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const object = await c.env.KB_BUCKET.get(`kb/${id}.json`);

  if (!object) {
    return c.json({ error: 'Knowledge base not found' }, 404);
  }

  c.header('Content-Type', 'application/json');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.body(object.body);
});

// Upload knowledge base (admin)
kbRoute.put('/:id', async (c) => {
  const adminKey = c.req.header('X-Admin-Secret');
  if (!adminKey || adminKey !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const body = await c.req.json();

  await c.env.KB_BUCKET.put(`kb/${id}.json`, JSON.stringify(body), {
    httpMetadata: { contentType: 'application/json' },
  });

  return c.json({ success: true, id });
});

export { kbRoute };
