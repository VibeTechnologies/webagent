import type { ChatMessage } from '../agent/types';

export interface EscalateParams {
  userEmail: string;
  userName?: string;
  context?: string;
  transcript: ChatMessage[];
  supportEmail: string;
  metadata?: Record<string, any>;
}

export async function escalateToHuman(
  apiBase: string,
  apiKey: string,
  params: EscalateParams,
): Promise<{ success: boolean; ticketId: string; message: string }> {
  const res = await fetch(`${apiBase}/api/escalate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      ...params,
      transcript: params.transcript.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Escalation failed: ${res.status}`);
  }

  return res.json();
}
