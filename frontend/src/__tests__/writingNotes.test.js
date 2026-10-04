import { describe, it, expect } from "vitest";
import { computeWritingNotes } from "../utils/writingNotes";

describe("Writing Notes Calculator", () => {
  it("handles empty input gracefully", () => {
    expect(computeWritingNotes("", "")).toEqual([]);
    expect(computeWritingNotes()).toEqual([]);
  });

  it("detects ALL-CAPS words", () => {
    const notes = computeWritingNotes("BREAKING ALERT: Big news today", "");
    const capsNote = notes.find((n) => n.id === "all-caps");
    expect(capsNote).toBeDefined();
    expect(capsNote.text).toContain("2 ALL-CAPS words");
  });

  it("counts exclamation marks", () => {
    const notes = computeWritingNotes("Shocking news!!", "You will not believe this!");
    const excNote = notes.find((n) => n.id === "exclamations");
    expect(excNote).toBeDefined();
    expect(excNote.text).toContain("3 exclamation marks");
  });

  it("detects named sources", () => {
    const withSource = computeWritingNotes("Deal announced", "The senator said talks finished.");
    expect(withSource.some((n) => n.id === "source-named")).toBe(true);

    const withoutSource = computeWritingNotes("Mysterious event", "Lights were seen in the sky.");
    expect(withoutSource.some((n) => n.id === "source-missing")).toBe(true);
  });

  it("calculates average sentence length", () => {
    const text = "First sentence here. Second sentence also has words here. Third one.";
    const notes = computeWritingNotes("", text);
    const avgNote = notes.find((n) => n.id === "avg-sentence-length");
    expect(avgNote).toBeDefined();
    expect(avgNote.text).toMatch(/~\d+ words per sentence/);
  });
});
