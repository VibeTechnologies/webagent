type CustomerRecord = {
  id: string;
  customer_key: string;
  provider: string;
  monthly_budget_cents: number | null;
  created_at: string;
};

type MockStores = {
  kv: Map<string, string>;
  customers: Map<string, CustomerRecord>;
  queue: any[];
  kb: Map<string, string>;
  escalations: any[];
};

type MockBindings = {
  KV: KVNamespace;
  DB: D1Database;
  EMAIL_QUEUE: Queue;
  KB_BUCKET?: R2Bucket;
  ADMIN_SECRET: string;
  AZURE_DEV_AI_API_KEY?: string;
  AZURE_DEV_AI_BASE_URL?: string;
  AZURE_DEV_AI_MODEL?: string;
};

export const createMockBindings = (overrides: Partial<MockBindings> = {}) => {
  const stores: MockStores = {
    kv: new Map(),
    customers: new Map(),
    queue: [],
    kb: new Map(),
    escalations: [],
  };

  let customerInsertCounter = 0;

  const KV: KVNamespace = {
    get: async (key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream') => {
      const value = stores.kv.get(key);
      if (value == null) return null;
      if (type === 'json') return JSON.parse(value);
      return value;
    },
    put: async (key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream | null) => {
      stores.kv.set(key, typeof value === 'string' ? value : String(value));
    },
    delete: async (key: string) => {
      stores.kv.delete(key);
    },
    list: async () => ({
      keys: Array.from(stores.kv.keys()).map((name) => ({ name })) as any,
      list_complete: true,
      cursor: '',
    }),
  } as unknown as KVNamespace;

  class MockPreparedStatement {
    private values: any[] = [];

    constructor(
      private readonly sql: string,
      private readonly state: MockStores
    ) {}

    bind(...values: any[]) {
      this.values = values;
      return this;
    }

    async run() {
      if (this.sql.includes('INSERT OR REPLACE INTO customers')) {
        const [id, customerKey, provider, monthlyBudget] = this.values;
        customerInsertCounter += 1;
        this.state.customers.set(id, {
          id,
          customer_key: customerKey,
          provider,
          monthly_budget_cents: monthlyBudget ?? null,
          created_at: `2025-01-01T00:00:${String(customerInsertCounter).padStart(2, '0')}Z`,
        });
      }

      if (this.sql.includes('INSERT INTO escalation_tickets')) {
        const [ticketId, userEmail, userName, context, transcript, supportEmail] = this.values;
        this.state.escalations.push({
          ticketId,
          userEmail,
          userName,
          context,
          transcript,
          supportEmail,
        });
      }

      if (this.sql.includes('DELETE FROM customers')) {
        const [id] = this.values;
        this.state.customers.delete(id);
      }

      return { success: true, meta: {} } as any;
    }

    async all() {
      if (this.sql.includes('SELECT id, customer_key, provider, monthly_budget_cents, created_at FROM customers')) {
        const results = Array.from(this.state.customers.values()).sort((a, b) =>
          a.created_at < b.created_at ? 1 : -1
        );
        return { results } as any;
      }
      return { results: [] } as any;
    }

    async first() {
      if (this.sql.includes('SELECT customer_key FROM customers WHERE id = ?')) {
        const [id] = this.values;
        const customer = this.state.customers.get(id);
        if (!customer) return null;
        return { customer_key: customer.customer_key } as any;
      }
      return null;
    }
  }

  const DB: D1Database = {
    prepare: (sql: string) => new MockPreparedStatement(sql, stores) as any,
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;

  const EMAIL_QUEUE: Queue = {
    send: async (message: any) => {
      stores.queue.push(message);
    },
  } as unknown as Queue;

  const KB_BUCKET: R2Bucket = {
    get: async (key: string) => {
      const value = stores.kb.get(key);
      if (value == null) return null;
      return { body: value } as any;
    },
    put: async (key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream | Blob) => {
      stores.kb.set(key, typeof value === 'string' ? value : String(value));
      return { key } as any;
    },
  } as unknown as R2Bucket;

  const bindings: MockBindings = {
    KV,
    DB,
    EMAIL_QUEUE,
    KB_BUCKET,
    ADMIN_SECRET: 'admin-secret',
    ...overrides,
  };

  return { bindings, stores };
};
