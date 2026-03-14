import type { GlossaryTerm } from '../data/mock/types';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(/\s+/)
      .filter((t) => t.length > 1)
  );
}

function wordOverlap(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  ta.forEach((t) => {
    if (tb.has(t)) intersection++;
  });
  return intersection / Math.max(ta.size, tb.size);
}

/** Score 0–1: how well the term matches the column name/description. */
export function scoreTermForColumn(
  columnName: string,
  columnDescription: string | undefined,
  term: GlossaryTerm
): number {
  const colNorm = normalize(columnName);
  const colDescNorm = columnDescription ? normalize(columnDescription) : '';
  const termNameNorm = normalize(term.name);
  const searchText = `${colNorm} ${colDescNorm}`.trim();
  const searchTokens = tokenize(searchText);

  if (searchTokens.size === 0) return 0;

  let score = 0;

  // Exact match on term name
  if (termNameNorm === colNorm) score = Math.max(score, 1);
  if (termNameNorm.includes(colNorm) || colNorm.includes(termNameNorm)) score = Math.max(score, 0.85);

  // Term name word overlap with column name
  const nameOverlap = wordOverlap(columnName, term.name);
  score = Math.max(score, nameOverlap * 0.9);

  // Synonyms
  for (const syn of term.synonyms) {
    const synNorm = normalize(syn);
    if (synNorm === colNorm) score = Math.max(score, 0.95);
    if (synNorm.includes(colNorm) || colNorm.includes(synNorm)) score = Math.max(score, 0.75);
    score = Math.max(score, wordOverlap(columnName, syn) * 0.8);
  }

  // Definition contains column name or tokens
  const defNorm = normalize(term.definition);
  if (defNorm.includes(colNorm)) score = Math.max(score, 0.5);
  score = Math.max(score, wordOverlap(searchText, term.definition) * 0.4);

  // Tags
  const tagOverlap = wordOverlap(columnName, term.tags.join(' '));
  score = Math.max(score, tagOverlap * 0.35);

  return Math.min(1, score);
}

export interface RecommendedTerm {
  term: GlossaryTerm;
  score: number;
}

/** Return glossary terms ranked by fuzzy match to the column; excludes already-linked terms. */
export function getRecommendedTerms(
  columnName: string,
  columnDescription: string | undefined,
  allTerms: GlossaryTerm[],
  excludeTermIds: string[],
  limit = 5
): RecommendedTerm[] {
  const exclude = new Set(excludeTermIds);
  return allTerms
    .filter((t) => !exclude.has(t.id))
    .map((term) => ({
      term,
      score: scoreTermForColumn(columnName, columnDescription, term),
    }))
    .filter((r) => r.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
