import React, { useState } from "react";
import { COPY } from "../copy";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

export function ReaderCards({
  models = {},
  fakeVotes = 0,
  totalModels = 3,
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const getReaderMeta = (key) => {
    if (COPY.reader[key]) {
      return COPY.reader[key];
    }
    // Fallback: title-case the key
    const formatted = key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      name: formatted,
      description: "Observes distinctive phrasing and vocabulary patterns.",
    };
  };

  const getLeanSentence = (prob) => {
    if (prob >= 0.65) return COPY.reader.lean.questionable;
    if (prob <= 0.35) return COPY.reader.lean.reliable;
    return COPY.reader.lean.middle;
  };

  const modelEntries = Object.entries(models);

  return (
    <div className="bg-paper-surface border border-paper-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Top Consensus Dots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-paper-border">
        <div>
          <h3 className="font-serif font-bold text-lg text-ink">
            {COPY.about.readersTitle}
          </h3>
          <p className="text-xs text-ink-subtle">
            {COPY.reader.dotsCaption
              .replace("{votes}", fakeVotes)
              .replace("{total}", totalModels || modelEntries.length)}
          </p>
        </div>

        {/* Voting Dots */}
        <div className="flex items-center gap-2" aria-hidden="true">
          {Array.from({ length: totalModels || modelEntries.length }).map((_, i) => {
            const isFilled = i < fakeVotes;
            return (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  isFilled
                    ? "bg-questionable border-questionable-dark shadow-xs"
                    : "bg-paper-card border-paper-border"
                }`}
                title={isFilled ? "Questionable lean" : "Neutral/Reliable lean"}
              />
            );
          })}
        </div>
      </div>

      {/* Reader Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modelEntries.map(([key, data]) => {
          const meta = getReaderMeta(key);
          const prob = data.fake_probability ?? 0.5;
          const pct = Math.round(prob * 100);
          const leanSentence = getLeanSentence(prob);
          const isTooltipOpen = activeTooltip === key;

          return (
            <div
              key={key}
              className="relative p-4 rounded-xl bg-paper border border-paper-border flex flex-col justify-between space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-serif font-semibold text-sm text-ink">
                  {meta.name}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(isTooltipOpen ? null : key)}
                  className="text-ink-subtle hover:text-ink transition-colors p-1 rounded-md"
                  aria-label={`About ${meta.name}`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tooltip Card */}
              {isTooltipOpen && (
                <div className="absolute top-10 inset-x-3 z-30 p-3 rounded-lg bg-ink text-white text-xs shadow-lg leading-relaxed animate-in fade-in">
                  <p>{meta.description}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(null)}
                    className="mt-2 text-[10px] text-paper-darker underline"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-1">
                <div
                  className="h-2 w-full bg-paper-border rounded-full overflow-hidden relative"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${meta.name} read score ${pct} percent`}
                >
                  {/* Center tick at 50% */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-paper-darker z-10" />

                  {/* Filled bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      prob >= 0.65
                        ? "bg-questionable"
                        : prob <= 0.35
                        ? "bg-reliable"
                        : "bg-neutralBand"
                    }`}
                  />
                </div>
              </div>

              {/* Plain Sentence */}
              <p className="text-xs text-ink-muted">
                <span className="font-medium text-ink">{meta.name}</span> {leanSentence}.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
