/**
 * Splits text into segments with unigram highlights for React rendering.
 * Never uses dangerouslySetInnerHTML.
 */
export function buildHighlightedSegments(text, highlights) {
  if (!text) return [];
  if (!highlights || (!highlights.questionable?.length && !highlights.reliable?.length)) {
    return [{ text, isHighlight: false }];
  }

  // Extract unigram terms only
  const termMap = new Map();

  (highlights.questionable || []).forEach((item) => {
    const term = (item.term || "").trim().toLowerCase();
    if (term && !term.includes(" ")) {
      termMap.set(term, {
        type: "questionable",
        weight: item.weight || 0.5,
        term,
      });
    }
  });

  (highlights.reliable || []).forEach((item) => {
    const term = (item.term || "").trim().toLowerCase();
    if (term && !term.includes(" ")) {
      const existing = termMap.get(term);
      // If term already present, keep the higher weight
      if (!existing || (item.weight || 0.5) > existing.weight) {
        termMap.set(term, {
          type: "reliable",
          weight: item.weight || 0.5,
          term,
        });
      }
    }
  });

  if (termMap.size === 0) {
    return [{ text, isHighlight: false }];
  }

  // Build regex matching whole-word unigrams, escaped
  const escapedTerms = Array.from(termMap.keys())
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const regex = new RegExp(`\\b(${escapedTerms.join("|")})\\b`, "gi");

  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchWord = match[0];

    // Leading non-highlighted text
    if (matchIndex > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, matchIndex),
        isHighlight: false,
      });
    }

    const info = termMap.get(matchWord.toLowerCase());
    segments.push({
      text: matchWord,
      isHighlight: true,
      type: info?.type || "neutral",
      weight: info?.weight || 0.5,
      term: info?.term || matchWord,
    });

    lastIndex = regex.lastIndex;
  }

  // Trailing text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isHighlight: false,
    });
  }

  return segments;
}
