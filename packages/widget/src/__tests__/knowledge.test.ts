import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearKnowledgeCache,
  loadKnowledge,
  searchKnowledge,
} from '../agent/knowledge';

type KnowledgeChunk = {
  id: string;
  title: string;
  content: string;
  url?: string;
  keywords?: string[];
  metadata?: Record<string, any>;
};

describe('knowledge', () => {
  beforeEach(() => {
    clearKnowledgeCache();
    vi.restoreAllMocks();
  });

  it('searchKnowledge returns empty array for empty chunks or empty query', () => {
    const chunks: KnowledgeChunk[] = [
      { id: '1', title: 'Refunds', content: 'Refund policy details' },
    ];

    expect(searchKnowledge([], 'refund')).toEqual([]);
    expect(searchKnowledge(chunks, '')).toEqual([]);
    expect(searchKnowledge(chunks, '   ')).toEqual([]);
  });

  it('searchKnowledge ranks title matches higher than content-only matches', () => {
    const chunks: KnowledgeChunk[] = [
      { id: 'title', title: 'Refund Policy', content: 'General billing docs' },
      { id: 'content', title: 'Billing', content: 'Our refund policy is here' },
    ];

    const results = searchKnowledge(chunks, 'refund policy', 2);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.id).toBe('title');
  });

  it('searchKnowledge respects maxResults', () => {
    const chunks: KnowledgeChunk[] = [
      { id: '1', title: 'Refund A', content: 'Refund details A' },
      { id: '2', title: 'Refund B', content: 'Refund details B' },
      { id: '3', title: 'Refund C', content: 'Refund details C' },
    ];

    const results = searchKnowledge(chunks, 'refund', 2);
    expect(results).toHaveLength(2);
  });

  it('searchKnowledge keyword bonus works', () => {
    const chunks: KnowledgeChunk[] = [
      {
        id: 'keyword',
        title: 'Billing docs',
        content: 'Process information',
        keywords: ['refund'],
      },
      {
        id: 'no-keyword',
        title: 'Billing docs',
        content: 'Process information refund',
      },
    ];

    const results = searchKnowledge(chunks, 'refund', 2);
    expect(results[0]?.id).toBe('keyword');
  });

  it('loadKnowledge caches results (second call does not fetch again)', async () => {
    const data: KnowledgeChunk[] = [{ id: '1', title: 'A', content: 'B' }];
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => data });
    vi.stubGlobal('fetch', fetchMock);

    const first = await loadKnowledge('https://example.com/kb.json');
    const second = await loadKnowledge('https://example.com/kb.json');

    expect(first).toEqual(data);
    expect(second).toEqual(data);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loadKnowledge returns empty array on fetch error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const result = await loadKnowledge('https://example.com/kb.json');

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('clearKnowledgeCache resets cache', async () => {
    const firstData: KnowledgeChunk[] = [{ id: '1', title: 'A', content: 'B' }];
    const secondData: KnowledgeChunk[] = [{ id: '2', title: 'C', content: 'D' }];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => firstData })
      .mockResolvedValueOnce({ ok: true, json: async () => secondData });
    vi.stubGlobal('fetch', fetchMock);

    const first = await loadKnowledge('https://example.com/kb.json');
    clearKnowledgeCache();
    const second = await loadKnowledge('https://example.com/kb.json');

    expect(first).toEqual(firstData);
    expect(second).toEqual(secondData);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
