import React, { useState } from "react";
import { COPY } from "../copy";
import { VerdictCard } from "./VerdictCard";
import { ReaderCards } from "./ReaderCards";
import { HighlightsView } from "./HighlightsView";
import { WritingNotes } from "./WritingNotes";
import { FeedbackSection } from "./FeedbackSection";
import { RefreshCw, Copy, Check } from "lucide-react";

export function ResultView({
  result,
  input,
  onReset,
}) {
  const [copied, setCopied] = useState(false);

  const title = input?.title || result?.input_title || "";
  const description = input?.description || result?.input_description || "";
  const verdict = result?.verdict || "uncertain";
  const score = result?.ensemble_fake_probability ?? 0.5;
  const models = result?.models || {};
  const fakeVotes = result?.fake_votes ?? 0;
  const totalModels = result?.total_models ?? Object.keys(models).length;
  const highlights = result?.highlights || { questionable: [], reliable: [] };
  const checkId = result?.id || "";

  const handleCopySummary = async () => {
    const verdictText = COPY.verdict[verdict] || verdict;
    const pct = Math.round(score * 100);
    const summary = [
      `Second Opinion Read: ${verdictText} (${pct}% lean)`,
      `Headline: "${title}"`,
      description ? `Description: "${description.slice(0, 150)}..."` : "",
      `Readers consensus: ${fakeVotes} of ${totalModels} lean questionable.`,
      `Disclaimer: ${COPY.disclaimer}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // quiet fail
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Verdict Card */}
      <VerdictCard
        verdict={verdict}
        score={score}
      />

      {/* 2. Reader Cards */}
      <ReaderCards
        models={models}
        fakeVotes={fakeVotes}
        totalModels={totalModels}
      />

      {/* 3. What Stood Out */}
      <HighlightsView
        title={title}
        description={description}
        highlights={highlights}
      />

      {/* 4. Things We Noticed */}
      <WritingNotes
        title={title}
        description={description}
      />

      {/* 5. Feedback */}
      {checkId && <FeedbackSection checkId={checkId} />}

      {/* 6. Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-paper-border">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium bg-paper-card border border-paper-border text-ink hover:bg-paper-darker/50 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{COPY.cta.again}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCopySummary}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium bg-paper-surface border border-paper-border text-ink hover:bg-paper-card transition-colors flex items-center justify-center gap-2 ml-auto"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-reliable" />
              <span className="text-reliable-dark">{COPY.cta.copied}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>{COPY.cta.copySummary}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
