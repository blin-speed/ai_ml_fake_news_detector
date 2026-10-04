import { describe, it, expect } from "vitest";
import { COPY } from "../copy";

const BANNED_TERMS = [
  "ai",
  "artificial intelligence",
  "model",
  "neural",
  "network",
  "algorithm",
  "lstm",
  "logistic",
  "bayes",
  "classifier",
  "probability",
  "ensemble",
  "inference",
  "tf-idf",
  "tfidf",
  "token",
  "confidence score",
  "accuracy metric",
  "dataset",
  "training",
  "fake news detector",
];

function extractStrings(obj) {
  const strings = [];
  function recurse(val) {
    if (typeof val === "string") {
      strings.push(val);
    } else if (Array.isArray(val)) {
      val.forEach(recurse);
    } else if (val && typeof val === "object") {
      Object.values(val).forEach(recurse);
    }
  }
  recurse(obj);
  return strings;
}

describe("Copy Deck Language Rules (Rule 5)", () => {
  it("must not contain any banned technical jargon in user-visible strings", () => {
    const allStrings = extractStrings(COPY);
    const violations = [];

    allStrings.forEach((text) => {
      // Check each banned term as a whole word / phrase (case-insensitive)
      BANNED_TERMS.forEach((term) => {
        // match term as whole word or with standard word boundary
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        if (regex.test(text)) {
          violations.push({ term, text });
        }
      });
    });

    expect(
      violations,
      `Found banned terms in copy deck: ${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });
});
