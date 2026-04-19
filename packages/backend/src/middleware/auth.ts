import { Context, Next } from 'hono';

type Bindings = { KV: KVNamespace };
type Variables = {
  customerId?: string;
  provider?: string;
  providerApiKey?: string;
  isByok: boolean;
};

export const authMiddleware = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing Authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: 'Empty API key' }, 401);
  }

  // Check if it's a managed key (wa_ prefix)
  if (token.startsWith('wa_')) {
    const keyData = await c.env.KV.get(`key:${token}`, 'json') as {
      customerId: string;
      provider: string;
      providerApiKey: string;
    } | null;

    if (!keyData) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    c.set('customerId', keyData.customerId);
    c.set('provider', keyData.provider);
    c.set('providerApiKey', keyData.providerApiKey);
    c.set('isByok', false);
  } else {
    // BYOK — pass through the key directly
    c.set('isByok', true);
    c.set('providerApiKey', token);
  }

  await next();
};
