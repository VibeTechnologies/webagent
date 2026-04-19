export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export async function sendEmail(
  apiBase: string,
  apiKey: string,
  params: SendEmailParams,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${apiBase}/api/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Email send failed: ${res.status}`);
  }

  return res.json();
}
