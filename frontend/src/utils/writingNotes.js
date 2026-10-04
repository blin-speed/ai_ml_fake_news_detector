import { COPY } from "../copy";

/**
 * Computes descriptive observations from raw title + description text.
 */
export function computeWritingNotes(title = "", description = "") {
  const fullText = `${title} ${description}`.trim();
  if (!fullText) return [];

  const notes = [];

  // 1. ALL-CAPS words (ignore single letters like 'A', 'I')
  const words = fullText.split(/\s+/).filter(Boolean);
  const allCapsWords = words.filter(
    (w) => w.length > 1 && /^[A-Z]+$/.test(w.replace(/[^A-Za-z]/g, ""))
  );
  if (allCapsWords.length > 0) {
    notes.push({
      id: "all-caps",
      text: COPY.writingNotes.allCaps.replace("{n}", allCapsWords.length),
    });
  }

  // 2. Exclamation marks
  const exclamationCount = (fullText.match(/!/g) || []).length;
  if (exclamationCount > 0) {
    notes.push({
      id: "exclamations",
      text: COPY.writingNotes.exclamations.replace("{n}", exclamationCount),
    });
  }

  // 3. Named sources
  const sourcePattern = /\b(according to|said|told|stated|reported|confirmed|spokesperson|spokeswoman|spokesman)\b/i;
  if (sourcePattern.test(fullText)) {
    notes.push({
      id: "source-named",
      text: COPY.writingNotes.sourceNamed,
    });
  } else {
    notes.push({
      id: "source-missing",
      text: COPY.writingNotes.sourceMissing,
    });
  }

  // 4. Average sentence length
  const sentences = fullText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length > 0) {
    const totalWords = sentences.reduce(
      (sum, s) => sum + s.split(/\s+/).filter(Boolean).length,
      0
    );
    const avgLen = Math.round(totalWords / sentences.length);
    if (avgLen > 0) {
      notes.push({
        id: "avg-sentence-length",
        text: COPY.writingNotes.avgSentenceLength.replace("{n}", avgLen),
      });
    }
  }

  return notes.slice(0, 4);
}
