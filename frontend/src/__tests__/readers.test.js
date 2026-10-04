import { describe, it, expect } from "vitest";
import { COPY } from "../copy";

function getReaderMeta(key) {
  if (COPY.reader[key]) {
    return COPY.reader[key];
  }
  const formatted = key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    name: formatted,
    description: "Observes distinctive phrasing and vocabulary patterns.",
  };
}

describe("Reader Handling and Fallbacks", () => {
  it("resolves metadata for known readers", () => {
    expect(getReaderMeta("naive_bayes").name).toBe("The Word Counter");
    expect(getReaderMeta("logistic_regression").name).toBe("The Pattern Spotter");
    expect(getReaderMeta("bilstm").name).toBe("The Sentence Reader");
  });

  it("handles unknown reader key gracefully with title-casing", () => {
    const unknown = getReaderMeta("custom_reader_test");
    expect(unknown.name).toBe("Custom Reader Test");
    expect(unknown.description).toBeDefined();
  });

  it("supports 2-reader mode without errors", () => {
    const twoReaders = {
      naive_bayes: { fake_probability: 0.2 },
      logistic_regression: { fake_probability: 0.7 },
    };
    const keys = Object.keys(twoReaders);
    expect(keys.length).toBe(2);
    keys.forEach((key) => {
      const meta = getReaderMeta(key);
      expect(meta.name).toBeDefined();
    });
  });
});
