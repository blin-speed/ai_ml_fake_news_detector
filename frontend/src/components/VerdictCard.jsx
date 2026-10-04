import React, { useEffect, useState } from "react";
import { COPY } from "../copy";
import { CheckCircle2, HelpCircle, AlertTriangle } from "lucide-react";

export function VerdictCard({
  verdict = "uncertain",
  score = 0.5,
  thresholds = { likely_real_at_or_below: 0.35, likely_fake_at_or_above: 0.65 },
}) {
  const [animatedScore, setAnimatedScore] = useState(0.5);

  const realThreshold = thresholds?.likely_real_at_or_below ?? 0.35;
  const fakeThreshold = thresholds?.likely_fake_at_or_above ?? 0.65;

  useEffect(() => {
    // Animate score count-up
    let start = 0.5;
    const end = score;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(start + (end - start) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Verdict content & styling
  const verdictConfig = {
    likely_real: {
      title: COPY.verdict.likely_real,
      sub: COPY.verdict.likely_real_sub,
      icon: CheckCircle2,
      color: "text-reliable-dark",
      bgColor: "bg-reliable-light/60",
      borderColor: "border-reliable-border",
    },
    uncertain: {
      title: COPY.verdict.uncertain,
      sub: COPY.verdict.uncertain_sub,
      icon: HelpCircle,
      color: "text-neutralBand-dark",
      bgColor: "bg-neutralBand-light/60",
      borderColor: "border-neutralBand-border",
    },
    likely_fake: {
      title: COPY.verdict.likely_fake,
      sub: COPY.verdict.likely_fake_sub,
      icon: AlertTriangle,
      color: "text-questionable-dark",
      bgColor: "bg-questionable-light/60",
      borderColor: "border-questionable-border",
    },
  };

  const currentVerdict = verdictConfig[verdict] || verdictConfig.uncertain;
  const VerdictIcon = currentVerdict.icon;

  // Lean caption
  let leanCaption = "";
  if (score >= fakeThreshold) {
    const pct = Math.round(score * 100);
    leanCaption = COPY.gauge.leanQuestionable.replace("{pct}", pct);
  } else if (score <= realThreshold) {
    const pct = Math.round((1 - score) * 100);
    leanCaption = COPY.gauge.leanReliable.replace("{pct}", pct);
  } else {
    leanCaption = COPY.gauge.uncertain;
  }

  // Semicircle gauge geometry
  // Width 280, Height 150
  const cx = 140;
  const cy = 130;
  const r = 100;
  const strokeWidth = 14;

  const needleAngle = (animatedScore - 0.5) * 180; // -90 deg (reliable) to +90 deg (questionable)

  // Arc paths
  // Angles in radians: 0 is right, Math.PI is left
  const pointOnCircle = (rad) => {
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  // reliable arc: 180 deg (PI) to realThreshold angle
  const realAngle = Math.PI * (1 - realThreshold);
  const pStart = pointOnCircle(Math.PI);
  const pReal = pointOnCircle(realAngle);

  // neutral arc: realThreshold to fakeThreshold
  const fakeAngle = Math.PI * (1 - fakeThreshold);
  const pFake = pointOnCircle(fakeAngle);

  // questionable arc: fakeThreshold to 0 deg
  const pEnd = pointOnCircle(0);

  const arcD = (p1, p2) => `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;

  const gaugeAriaLabel = `Dial showing writing read score of ${Math.round(score * 100)} percent. ${leanCaption}.`;

  return (
    <div className={`p-6 sm:p-8 rounded-2xl border ${currentVerdict.borderColor} ${currentVerdict.bgColor} shadow-sm space-y-6 transition-colors`}>
      {/* Verdict Header */}
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 p-2 rounded-xl bg-paper-surface border ${currentVerdict.borderColor} shadow-xs`}>
          <VerdictIcon className={`w-7 h-7 ${currentVerdict.color}`} />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            {currentVerdict.title}
          </h2>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            {currentVerdict.sub}
          </p>
        </div>
      </div>

      {/* Semicircle Lean Gauge */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div
          role="img"
          aria-label={gaugeAriaLabel}
          className="relative w-[280px] h-[145px] flex items-center justify-center select-none"
        >
          <svg viewBox="0 0 280 150" className="w-full h-full overflow-visible">
            {/* Background Track */}
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="#E7E1D8"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Reliable Arc */}
            <path
              d={arcD(pStart, pReal)}
              fill="none"
              stroke="#2A9D8F"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Neutral Arc */}
            <path
              d={arcD(pReal, pFake)}
              fill="none"
              stroke="#A8AFBF"
              strokeWidth={strokeWidth}
            />

            {/* Questionable Arc */}
            <path
              d={arcD(pFake, pEnd)}
              fill="none"
              stroke="#C25E00"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Needle */}
            <g transform={`translate(${cx}, ${cy}) rotate(${needleAngle})`}>
              <circle cx="0" cy="0" r="7" fill="#1B1B1F" />
              <path
                d="M -3 0 L 0 -88 L 3 0 Z"
                fill="#1B1B1F"
                className="filter drop-shadow-sm"
              />
              <circle cx="0" cy="0" r="3" fill="#FAF7F2" />
            </g>

            {/* End Labels */}
            <text x="18" y="148" className="text-[11px] font-sans fill-reliable-dark font-medium">
              {COPY.gauge.reliable}
            </text>
            <text x="262" y="148" textAnchor="end" className="text-[11px] font-sans fill-questionable-dark font-medium">
              {COPY.gauge.questionable}
            </text>
          </svg>
        </div>

        {/* Needle caption */}
        <p className="mt-2 text-sm font-medium text-ink">
          {leanCaption}
        </p>
      </div>

      {/* Permanent Quiet Line */}
      <div className="pt-2 border-t border-paper-border/60 text-center">
        <p className="text-xs text-ink-subtle italic">
          {COPY.disclaimer_short}
        </p>
      </div>
    </div>
  );
}
