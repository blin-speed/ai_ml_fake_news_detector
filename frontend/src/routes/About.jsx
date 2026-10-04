import React, { useState, useEffect } from "react";
import { COPY } from "../copy";
import { api } from "../api";
import { BookOpen, AlertOctagon, ShieldCheck } from "lucide-react";

export function About() {
  const [aboutData, setAboutData] = useState(null);

  useEffect(() => {
    api.about().then((data) => {
      if (data) setAboutData(data);
    });
  }, []);

  // Compute "about N in 10" from holdout_accuracy_pct
  let strengthPhrase = null;
  if (
    aboutData?.holdout_accuracy_pct &&
    Array.isArray(aboutData.holdout_accuracy_pct) &&
    aboutData.holdout_accuracy_pct.length === 2
  ) {
    const [low, high] = aboutData.holdout_accuracy_pct;
    const midpoint = (low + high) / 2;
    // Round to nearest whole number out of 10 (e.g. 69% -> 7)
    const n = Math.round(midpoint / 10);
    strengthPhrase = COPY.about.strength.replace("{n}", n);
  }

  const readersList = [
    {
      key: "naive_bayes",
      ...COPY.reader.naive_bayes,
    },
    {
      key: "logistic_regression",
      ...COPY.reader.logistic_regression,
    },
    {
      key: "bilstm",
      ...COPY.reader.bilstm,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      {/* Page Title */}
      <div className="space-y-2 border-b border-paper-border pb-6">
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink">
          {COPY.about.title}
        </h1>
        <p className="text-base text-ink-muted leading-relaxed">
          {COPY.about.subtitle}
        </p>
      </div>

      {/* Section 1: What this does */}
      <section className="bg-paper-surface border border-paper-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 text-reliable-dark">
          <BookOpen className="w-5 h-5" />
          <h2 className="font-serif font-bold text-xl text-ink">
            {COPY.about.section1Title}
          </h2>
        </div>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
          {COPY.about.section1Text}
        </p>

        {/* Reader Cards */}
        <div className="pt-2">
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
            {COPY.about.readersTitle}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {readersList.map((reader) => (
              <div
                key={reader.key}
                className="p-4 rounded-xl bg-paper border border-paper-border space-y-1"
              >
                <h4 className="font-serif font-semibold text-sm text-ink">
                  {reader.name}
                </h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {reader.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: What it can't do */}
      <section className="bg-paper-surface border border-paper-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 text-questionable-dark">
          <AlertOctagon className="w-5 h-5" />
          <h2 className="font-serif font-bold text-xl text-ink">
            {COPY.about.section2Title}
          </h2>
        </div>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
          {COPY.about.section2Text}
        </p>

        {/* Real Strength Callout */}
        {strengthPhrase && (
          <div className="p-4 rounded-xl bg-paper-card border border-paper-border text-xs sm:text-sm text-ink font-medium">
            💡 {strengthPhrase}
          </div>
        )}
      </section>

      {/* Section 3: Where your text goes */}
      <section className="bg-paper-surface border border-paper-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 text-neutralBand-dark">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="font-serif font-bold text-xl text-ink">
            {COPY.about.section3Title}
          </h2>
        </div>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
          {COPY.about.section3Text}
        </p>
      </section>
    </div>
  );
}
