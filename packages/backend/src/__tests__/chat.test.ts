import { Hono } from 'hono';
import { afterEach } from 'vitest';
import { chatRoute } from '../routes/chat';
import { createMockBindings } from './test-helpers';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('chat route', () => {
  it('returns 401 when no API key is available', async () => {
    const app = new Hono();
    app.route('/v1/chat', chatRoute);
    const { bindings } = createMockBindings();

    const res = await app.request(
      '/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
      },
      bindings as any
    );

    expect(res.status).toBe(401);
  });

  it('uses Azure dev account config and defaults model to gpt-5.1', async () => {
    const app = new Hono();
    app.route('/v1/chat', chatRoute);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'chatcmpl_1',
          object: 'chat.completion',
          choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    const { bindings } = createMockBindings({
      AZURE_DEV_AI_API_KEY: 'azure-key',
      AZURE_DEV_AI_BASE_URL: 'https://azure.example.com/openai/v1',
      AZURE_DEV_AI_MODEL: 'gpt-5.1',
    });

    const res = await app.request(
      '/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ignored-by-azure-env',
          'X-LLM-Provider': 'azure-openai',
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
      },
      bindings as any
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://azure.example.com/openai/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'api-key': 'azure-key',
    });

    const proxiedBody = JSON.parse(init.body as string);
    expect(proxiedBody.model).toBe('gpt-5.1');
  });
});

