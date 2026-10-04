import React from "react";
import { COPY } from "../copy";
import { buildHighlightedSegments } from "../utils/textHighlight";

export function HighlightsView({
  title = "",
  description = "",
  highlights = { questionable: [], reliable: [] },
}) {
  const fullText = `${title} ${description}`.trim();
  const segments = buildHighlightedSegments(fullText, highlights);

  const questionableTerms = highlights?.questionable || [];
  const reliableTerms = highlights?.reliable || [];
  const hasAnyTerms = questionableTerms.length > 0 || reliableTerms.length > 0;

  // Combine top terms for diverging chart (up to 5 of each)
  const topQuestionable = questionableTerms.slice(0, 5);
  const topReliable = reliableTerms.slice(0, 5);

  return (
    <div className="bg-paper-surface border border-paper-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-serif font-bold text-lg text-ink">
          {COPY.highlights.title}
        </h3>
        <p className="text-xs text-ink-subtle mt-0.5">
          {COPY.highlights.caption}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Highlighted text block */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-paper border border-paper-border space-y-3">
          <p className="text-sm sm:text-base leading-relaxed text-ink select-text font-serif">
            {segments.map((seg, i) => {
              if (!seg.isHighlight) {
                return <span key={i}>{seg.text}</span>;
              }

              const isQuestionable = seg.type === "questionable";
              // Underline thickness based on weight (1px to 4px)
              const thickness = Math.max(1.5, Math.round((seg.weight || 0.5) * 4));

              return (
                <span
                  key={i}
                  style={{
                    textDecoration: "underline",
                    textDecorationColor: isQuestionable ? "#C25E00" : "#2A9D8F",
                    textDecorationThickness: `${thickness}px`,
                    textUnderlineOffset: "3px",
                  }}
                  className={`font-semibold ${
                    isQuestionable ? "text-questionable-dark" : "text-reliable-dark"
                  }`}
                  title={`${seg.term} (${isQuestionable ? "Questionable lean" : "Reliable lean"}, weight ${Math.round(
                    (seg.weight || 0.5) * 100
                  )}%)`}
                >
                  {seg.text}
                </span>
              );
            })}
          </p>

          <p className="text-[11px] text-ink-subtle pt-2 border-t border-paper-border/60">
            {COPY.highlights.inlineHint}
          </p>
        </div>

        {/* Diverging Bar Chart */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
            Top Word Signals
          </span>

          {!hasAnyTerms ? (
            <p className="text-xs text-ink-subtle italic py-4">
              {COPY.highlights.noHighlights}
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {/* Reliable terms (green bar going left) */}
              {topReliable.map((item, idx) => {
                const widthPct = Math.round((item.weight || 0.5) * 100);
                return (
                  <div key={`rel-${idx}`} className="flex items-center gap-2">
                    <span className="w-24 text-right truncate text-reliable-dark font-medium font-serif" title={item.term}>
                      {item.term}
                    </span>
                    <div className="flex-1 flex justify-start bg-paper-card h-4 rounded-sm overflow-hidden border border-paper-border">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="bg-reliable h-full rounded-sm"
                        title={`Weight: ${widthPct}%`}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Questionable terms (amber bar going right) */}
              {topQuestionable.map((item, idx) => {
                const widthPct = Math.round((item.weight || 0.5) * 100);
                return (
                  <div key={`que-${idx}`} className="flex items-center gap-2">
                    <span className="w-24 text-right truncate text-questionable-dark font-medium font-serif" title={item.term}>
                      {item.term}
                    </span>
                    <div className="flex-1 flex justify-start bg-paper-card h-4 rounded-sm overflow-hidden border border-paper-border">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="bg-questionable h-full rounded-sm"
                        title={`Weight: ${widthPct}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
