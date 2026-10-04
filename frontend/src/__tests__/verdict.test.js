import { describe, it, expect } from "vitest";
import { COPY } from "../copy";

function getVerdictInfo(verdict, score, thresholds = { likely_real_at_or_below: 0.35, likely_fake_at_or_above: 0.65 }) {
  const realThreshold = thresholds.likely_real_at_or_below;
  const fakeThreshold = thresholds.likely_fake_at_or_above;

  let leanText = "";
  if (score >= fakeThreshold) {
    const pct = Math.round(score * 100);
    leanText = COPY.gauge.leanQuestionable.replace("{pct}", pct);
  } else if (score <= realThreshold) {
    const pct = Math.round((1 - score) * 100);
    leanText = COPY.gauge.leanReliable.replace("{pct}", pct);
  } else {
    leanText = COPY.gauge.uncertain;
  }

  return {
    title: COPY.verdict[verdict] || verdict,
    leanText,
  };
}

describe("Verdict and Lean Mapping", () => {
  const thresholds = { likely_real_at_or_below: 0.35, likely_fake_at_or_above: 0.65 };

  it("handles boundary value 0.35 as reliable", () => {
    const info = getVerdictInfo("likely_real", 0.35, thresholds);
    expect(info.title).toBe(COPY.verdict.likely_real);
    expect(info.leanText).toContain("65%");
    expect(info.leanText).toContain("reliable");
  });

  it("handles boundary value 0.65 as questionable", () => {
    const info = getVerdictInfo("likely_fake", 0.65, thresholds);
    expect(info.title).toBe(COPY.verdict.likely_fake);
    expect(info.leanText).toContain("65%");
    expect(info.leanText).toContain("questionable");
  });

  it("handles middle value 0.50 as neutral / on the fence", () => {
    const info = getVerdictInfo("uncertain", 0.50, thresholds);
    expect(info.title).toBe(COPY.verdict.uncertain);
    expect(info.leanText).toBe(COPY.gauge.uncertain);
  });

  it("handles extremes (0.0 and 1.0)", () => {
    const minInfo = getVerdictInfo("likely_real", 0.0, thresholds);
    expect(minInfo.leanText).toContain("100%");
    expect(minInfo.leanText).toContain("reliable");

    const maxInfo = getVerdictInfo("likely_fake", 1.0, thresholds);
    expect(maxInfo.leanText).toContain("100%");
    expect(maxInfo.leanText).toContain("questionable");
  });
});
