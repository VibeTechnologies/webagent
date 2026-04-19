export interface Customer {
  id: string;
  customer_key: string;
  provider: string;
  monthly_budget_cents: number | null;
  created_at: string;
}

export interface UsageLog {
  id: number;
  customer_id: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
}

export interface EscalationTicket {
  id: number;
  ticket_id: string;
  user_email: string;
  user_name: string | null;
  context: string | null;
  transcript: string;
  support_email: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export async function getCustomerUsage(db: D1Database, customerId: string, month: string): Promise<{ totalTokens: number }> {
  const result = await db.prepare(
    `SELECT COALESCE(SUM(total_tokens), 0) as totalTokens 
     FROM usage_log 
     WHERE customer_id = ? AND created_at >= ? AND created_at < date(?, '+1 month')`
  ).bind(customerId, month, month).first<{ totalTokens: number }>();
  return result || { totalTokens: 0 };
}
