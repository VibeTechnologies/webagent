interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  url?: string;
  keywords?: string[];
  metadata?: Record<string, any>;
}

let knowledgeCache: KnowledgeChunk[] | null = null;

export async function loadKnowledge(url: string): Promise<KnowledgeChunk[]> {
  if (knowledgeCache) return knowledgeCache;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load KB: ${res.status}`);
    knowledgeCache = await res.json();
    return knowledgeCache!;
  } catch (err) {
    console.warn('Failed to load knowledge base:', err);
    return [];
  }
}

export function searchKnowledge(
  chunks: KnowledgeChunk[],
  query: string,
  maxResults = 3,
): KnowledgeChunk[] {
  if (!chunks.length || !query.trim()) return [];

  const queryTerms = tokenize(query);
  
  // TF-IDF-like scoring
  const scored = chunks.map(chunk => {
    const chunkTerms = tokenize(`${chunk.title} ${chunk.content} ${(chunk.keywords || []).join(' ')}`);
    let score = 0;

    for (const term of queryTerms) {
      // Term frequency in chunk
      const tf = chunkTerms.filter(t => t === term).length / chunkTerms.length;
      // Inverse document frequency (approximate)
      const docsWithTerm = chunks.filter(c => {
        const t = tokenize(`${c.title} ${c.content}`);
        return t.includes(term);
      }).length;
      const idf = Math.log(chunks.length / (1 + docsWithTerm));
      score += tf * idf;

      // Bonus for title match
      if (tokenize(chunk.title).includes(term)) {
        score += 0.5;
      }

      // Bonus for keyword match
      if (chunk.keywords?.some(k => k.toLowerCase().includes(term))) {
        score += 0.3;
      }
    }

    return { chunk, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.chunk);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

export function clearKnowledgeCache() {
  knowledgeCache = null;
}
