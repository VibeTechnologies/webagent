import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { z } from 'zod';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  AZURE_DEV_AI_API_KEY?: string;
  AZURE_DEV_AI_BASE_URL?: string;
  AZURE_DEV_AI_MODEL?: string;
};

type Variables = {
  customerId?: string;
  provider?: string;
  providerApiKey?: string;
  isByok: boolean;
};

const chatRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Provider base URLs
const PROVIDER_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',  // Anthropic's OpenAI-compatible endpoint
  'azure-openai': '', // Set per-customer from config
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
};

chatRoute.post('/completions', async (c) => {
  const body = await c.req.json();
  const isByok = c.get('isByok');
  const azureConfigured = Boolean(c.env.AZURE_DEV_AI_API_KEY && c.env.AZURE_DEV_AI_BASE_URL);
  const provider = c.get('provider')
    || c.req.header('X-LLM-Provider')
    || (azureConfigured && !isByok ? 'azure-openai' : 'openai');
  const providerApiKey = provider === 'azure-openai'
    ? (c.env.AZURE_DEV_AI_API_KEY || c.get('providerApiKey') || c.req.header('Authorization')?.replace('Bearer ', ''))
    : (c.get('providerApiKey') || c.req.header('Authorization')?.replace('Bearer ', ''));

  if (!providerApiKey) {
    return c.json({ error: 'No API key provided' }, 401);
  }

  const baseUrl = provider === 'azure-openai' ? c.env.AZURE_DEV_AI_BASE_URL : PROVIDER_URLS[provider];
  if (!baseUrl) {
    return c.json(
      { error: provider === 'azure-openai' ? 'Azure OpenAI is not configured' : `Unsupported provider: ${provider}` },
      400
    );
  }

  const targetUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const requestBody = provider === 'azure-openai'
    ? { ...body, model: body.model || c.env.AZURE_DEV_AI_MODEL || 'gpt-5.1' }
    : body;

  // Check if streaming
  const isStreaming = requestBody.stream === true;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider === 'azure-openai') {
    headers['api-key'] = providerApiKey;
  } else {
    headers['Authorization'] = `Bearer ${providerApiKey}`;
  }

  // Anthropic-specific headers
  if (provider === 'anthropic') {
    headers['anthropic-version'] = '2024-10-01';
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({ error: 'Provider error', details: errorText }, response.status as any);
    }

    if (isStreaming && response.body) {
      // Stream SSE response through to client
      c.header('Content-Type', 'text/event-stream');
      c.header('Cache-Control', 'no-cache');
      c.header('Connection', 'keep-alive');
      
      return stream(c, async (s) => {
        const reader = response.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await s.write(value);
          }
        } finally {
          reader.releaseLock();
        }
      });
    }

    // Non-streaming: forward response
    const data: any = await response.json();

    // Log usage for managed keys
    if (!isByok && c.get('customerId') && data.usage) {
      const customerId = c.get('customerId');
      const { prompt_tokens, completion_tokens, total_tokens } = data.usage;
      try {
        await c.env.DB.prepare(
          `INSERT INTO usage_log (customer_id, provider, model, prompt_tokens, completion_tokens, total_tokens, created_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(customerId, provider, requestBody.model || 'unknown', prompt_tokens || 0, completion_tokens || 0, total_tokens || 0).run();
      } catch (err) {
        console.error('Usage logging failed:', err);
      }
    }

    return c.json(data);
  } catch (err) {
    console.error('Chat proxy error:', err);
    return c.json({ error: 'Internal proxy error' }, 500);
  }
});

export { chatRoute };
