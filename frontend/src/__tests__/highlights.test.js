import { describe, it, expect } from "vitest";
import { buildHighlightedSegments } from "../utils/textHighlight";

describe("Highlight Matcher", () => {
  it("handles empty or missing input", () => {
    expect(buildHighlightedSegments("", null)).toEqual([]);
    expect(buildHighlightedSegments("hello world", { questionable: [], reliable: [] })).toEqual([
      { text: "hello world", isHighlight: false },
    ]);
  });

  it("highlights unigrams case-insensitively with whole-word matching", () => {
    const text = "Shocking reports reveal shocking details about shockwaves.";
    const highlights = {
      questionable: [{ term: "shocking", weight: 0.9 }],
      reliable: [],
    };

    const segments = buildHighlightedSegments(text, highlights);

    // "Shocking" (first word) and "shocking" (second word) should match.
    // "shockwaves" should NOT match because of whole-word boundary.
    const highlighted = segments.filter((s) => s.isHighlight);
    expect(highlighted.length).toBe(2);
    expect(highlighted[0].text).toBe("Shocking");
    expect(highlighted[1].text).toBe("shocking");
    expect(highlighted[0].type).toBe("questionable");

    const nonHighlightedText = segments
      .filter((s) => !s.isHighlight)
      .map((s) => s.text)
      .join("");
    expect(nonHighlightedText).toContain("shockwaves");
  });

  it("excludes bigrams from inline highlighting", () => {
    const text = "Secret memo leaked to the press.";
    const highlights = {
      questionable: [{ term: "secret memo", weight: 0.8 }],
      reliable: [],
    };

    const segments = buildHighlightedSegments(text, highlights);
    // Bigram should be ignored for inline text highlights
    const highlighted = segments.filter((s) => s.isHighlight);
    expect(highlighted.length).toBe(0);
  });

  it("handles both reliable and questionable unigrams", () => {
    const text = "Officials said the claims were shocking and untrue.";
    const highlights = {
      questionable: [{ term: "shocking", weight: 0.85 }],
      reliable: [{ term: "said", weight: 0.7 }],
    };

    const segments = buildHighlightedSegments(text, highlights);
    const saidSeg = segments.find((s) => s.text.toLowerCase() === "said");
    const shockingSeg = segments.find((s) => s.text.toLowerCase() === "shocking");

    expect(saidSeg).toBeDefined();
    expect(saidSeg.isHighlight).toBe(true);
    expect(saidSeg.type).toBe("reliable");

    expect(shockingSeg).toBeDefined();
    expect(shockingSeg.isHighlight).toBe(true);
    expect(shockingSeg.type).toBe("questionable");
  });
});
