-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  customer_key TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  monthly_budget_cents INTEGER,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_key ON customers(customer_key);

-- Usage log
CREATE TABLE IF NOT EXISTS usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_usage_customer ON usage_log(customer_id, created_at);

-- Escalation tickets
CREATE TABLE IF NOT EXISTS escalation_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  context TEXT,
  transcript TEXT NOT NULL,
  support_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON escalation_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON escalation_tickets(user_email);
