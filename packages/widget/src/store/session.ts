import type { SessionData, StorageAdapter } from './types';

const DB_NAME = 'webagent';
const STORE_NAME = 'sessions';
const SESSION_KEY_PREFIX = 'webagent_session_';
const DB_VERSION = 1;

class IndexedDBAdapter implements StorageAdapter {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getStore(mode: IDBTransactionMode = 'readonly') {
    const db = await this.dbPromise;
    return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  }

  async get(key: string): Promise<SessionData | null> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async set(key: string, data: SessionData): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put({ ...data, id: key });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(key: string): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async listKeys(): Promise<string[]> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

class LocalStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<SessionData | null> {
    const raw = localStorage.getItem(SESSION_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  }

  async set(key: string, data: SessionData): Promise<void> {
    localStorage.setItem(SESSION_KEY_PREFIX + key, JSON.stringify(data));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(SESSION_KEY_PREFIX + key);
  }

  async listKeys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SESSION_KEY_PREFIX)) {
        keys.push(key.replace(SESSION_KEY_PREFIX, ''));
      }
    }
    return keys;
  }

  async clear(): Promise<void> {
    const keys = await this.listKeys();
    keys.forEach(k => localStorage.removeItem(SESSION_KEY_PREFIX + k));
  }
}

class NoopAdapter implements StorageAdapter {
  async get(): Promise<null> { return null; }
  async set(): Promise<void> {}
  async delete(): Promise<void> {}
  async listKeys(): Promise<string[]> { return []; }
  async clear(): Promise<void> {}
}

export class SessionStore {
  private adapter: StorageAdapter;
  private sessionId: string;
  private ttlMs: number;

  constructor(
    type: 'indexeddb' | 'localStorage' | 'none' = 'indexeddb',
    ttlDays = 7,
  ) {
    this.ttlMs = ttlDays * 24 * 60 * 60 * 1000;
    this.sessionId = this.getOrCreateSessionId();

    switch (type) {
      case 'indexeddb':
        try {
          this.adapter = new IndexedDBAdapter();
        } catch {
          console.warn('IndexedDB unavailable, falling back to localStorage');
          this.adapter = new LocalStorageAdapter();
        }
        break;
      case 'localStorage':
        this.adapter = new LocalStorageAdapter();
        break;
      default:
        this.adapter = new NoopAdapter();
    }

    // Clean up expired sessions
    this.cleanup();
  }

  private getOrCreateSessionId(): string {
    const key = 'webagent_current_session';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async load(): Promise<SessionData | null> {
    const data = await this.adapter.get(this.sessionId);
    if (data && Date.now() - data.updatedAt > this.ttlMs) {
      await this.adapter.delete(this.sessionId);
      return null;
    }
    return data;
  }

  async save(data: Omit<SessionData, 'id'>): Promise<void> {
    await this.adapter.set(this.sessionId, {
      ...data,
      id: this.sessionId,
      updatedAt: Date.now(),
    });
  }

  async export(): Promise<SessionData | null> {
    return this.adapter.get(this.sessionId);
  }

  async clear(): Promise<void> {
    await this.adapter.delete(this.sessionId);
  }

  async clearAll(): Promise<void> {
    await this.adapter.clear();
  }

  private async cleanup() {
    try {
      const keys = await this.adapter.listKeys();
      for (const key of keys) {
        if (key === this.sessionId) continue;
        const data = await this.adapter.get(key);
        if (data && Date.now() - data.updatedAt > this.ttlMs) {
          await this.adapter.delete(key);
        }
      }
    } catch {
      // Cleanup is best-effort
    }
  }
}
