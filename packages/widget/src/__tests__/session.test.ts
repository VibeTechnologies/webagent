import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionStore } from '../store/session';
import type { SessionData } from '../store/types';

function makeSessionData(id: string, updatedAt = Date.now()): SessionData {
  return {
    id,
    messages: [],
    todos: [],
    createdAt: updatedAt,
    updatedAt,
    config: { test: true },
  };
}

describe('session store adapters', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('LocalStorageAdapter get/set/delete/listKeys/clear via SessionStore adapter', async () => {
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue('sess_local_test');
    vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => undefined);

    const store = new SessionStore('localStorage');
    const adapter = (store as any).adapter;

    await adapter.set('a', makeSessionData('a'));
    await adapter.set('b', makeSessionData('b'));

    expect(await adapter.get('a')).toMatchObject({ id: 'a' });
    expect((await adapter.listKeys()).sort()).toEqual(['a', 'b']);

    await adapter.delete('a');
    expect(await adapter.get('a')).toBeNull();

    await adapter.clear();
    expect(await adapter.listKeys()).toEqual([]);
  });

  it('NoopAdapter always returns null/empty via none store', async () => {
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue('sess_none_test');
    vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => undefined);

    const store = new SessionStore('none');
    const adapter = (store as any).adapter;

    await adapter.set('x', makeSessionData('x'));
    expect(await adapter.get('x')).toBeNull();
    expect(await adapter.listKeys()).toEqual([]);
    await adapter.delete('x');
    await adapter.clear();
    expect(await store.load()).toBeNull();
  });
});

describe('SessionStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('localStorage type supports load/save/clear/getSessionId', async () => {
    const getItemSpy = vi.spyOn(sessionStorage, 'getItem').mockReturnValue('sess_123');
    const setItemSpy = vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => undefined);

    const store = new SessionStore('localStorage');

    expect(store.getSessionId()).toBe('sess_123');
    expect(getItemSpy).toHaveBeenCalledWith('webagent_current_session');
    expect(setItemSpy).not.toHaveBeenCalled();

    const now = Date.now();
    await store.save({
      messages: [],
      todos: [],
      createdAt: now,
      updatedAt: now,
      config: { mode: 'test' },
    });

    const loaded = await store.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe('sess_123');

    await store.clear();
    expect(await store.load()).toBeNull();
  });

  it('none type always returns null', async () => {
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue('sess_none');
    vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => undefined);

    const store = new SessionStore('none');

    await store.save({
      messages: [],
      todos: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: {},
    });

    expect(await store.load()).toBeNull();
    expect(await store.export()).toBeNull();
  });

  it('TTL expiry returns null for stale sessions', async () => {
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue('sess_ttl');
    vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => undefined);

    const store = new SessionStore('localStorage', 1);
    const sessionId = store.getSessionId();
    const adapter = (store as any).adapter;

    const staleTime = Date.now() - 2 * 24 * 60 * 60 * 1000;
    await adapter.set(sessionId, makeSessionData(sessionId, staleTime));

    expect(await store.load()).toBeNull();
    expect(await adapter.get(sessionId)).toBeNull();
  });

  it('creates a session id when sessionStorage is empty', () => {
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue(null);
    const setItemSpy = vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => undefined);

    const store = new SessionStore('none');

    expect(store.getSessionId()).toMatch(/^sess_/);
    expect(setItemSpy).toHaveBeenCalled();
  });
});
