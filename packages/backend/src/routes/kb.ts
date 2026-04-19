import { Hono } from 'hono';

type Bindings = {
  KB_BUCKET?: R2Bucket;
  KV: KVNamespace;
  ADMIN_SECRET: string;
};

const kbRoute = new Hono<{ Bindings: Bindings }>();

// Get knowledge base chunks
kbRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const object = c.env.KB_BUCKET
    ? await c.env.KB_BUCKET.get(`kb/${id}.json`)
    : null;

  c.header('Content-Type', 'application/json');
  c.header('Cache-Control', 'public, max-age=3600');

  if (object) {
    return c.body(object.body);
  }

  const kvValue = await c.env.KV.get(`kb:${id}`);
  if (!kvValue) {
    return c.json({ error: 'Knowledge base not found' }, 404);
  }

  return c.body(kvValue);
});

// Upload knowledge base (admin)
kbRoute.put('/:id', async (c) => {
  const adminKey = c.req.header('X-Admin-Secret');
  if (!adminKey || adminKey !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  const serialized = JSON.stringify(body);

  if (c.env.KB_BUCKET) {
    await c.env.KB_BUCKET.put(`kb/${id}.json`, serialized, {
      httpMetadata: { contentType: 'application/json' },
    });
  } else {
    await c.env.KV.put(`kb:${id}`, serialized);
  }

  return c.json({ success: true, id, storage: c.env.KB_BUCKET ? 'r2' : 'kv' });
});

export { kbRoute };
