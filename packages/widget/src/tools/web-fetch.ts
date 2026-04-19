export interface WebFetchParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface WebFetchResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType: string;
}

export async function webFetch(
  apiBase: string,
  apiKey: string,
  params: WebFetchParams,
): Promise<WebFetchResult> {
  const res = await fetch(`${apiBase}/api/fetch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Fetch proxy error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
