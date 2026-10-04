import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { COPY } from "../copy";
import { api, resetClientId } from "../api";
import {
  Trash2,
  Calendar,
  ChevronRight,
  TrendingUp,
  Inbox,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

export function History() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmErase, setShowConfirmErase] = useState(false);
  const navigate = useNavigate();

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getHistory(50);
      setChecks(res?.checks || []);
    } catch (err) {
      setError(err.message || COPY.error.server);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.deleteItem(id);
      setChecks((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // quiet fail
    }
  };

  const handleEraseAll = async () => {
    try {
      await api.deleteAll();
      resetClientId();
      setChecks([]);
      setShowConfirmErase(false);
    } catch {
      setShowConfirmErase(false);
    }
  };

  // Sparkline data for last 20 checks (in chronological order: oldest to newest)
  const sparklineData = [...checks].slice(0, 20).reverse();

  const getVerdictBadge = (verdict) => {
    if (verdict === "likely_real") {
      return {
        label: COPY.verdict.likely_real,
        icon: CheckCircle2,
        bg: "bg-reliable-light text-reliable-dark border-reliable-border",
      };
    }
    if (verdict === "likely_fake") {
      return {
        label: COPY.verdict.likely_fake,
        icon: AlertTriangle,
        bg: "bg-questionable-light text-questionable-dark border-questionable-border",
      };
    }
    return {
      label: COPY.verdict.uncertain,
      icon: HelpCircle,
      bg: "bg-neutralBand-light text-neutralBand-dark border-neutralBand-border",
    };
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-ink">
            {COPY.history.title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-subtle mt-1">
            {COPY.history.subtitle}
          </p>
        </div>

        {checks.length > 0 && (
          <button
            type="button"
            onClick={() => setShowConfirmErase(true)}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-lg text-xs font-medium border border-paper-border bg-paper hover:bg-paper-card text-questionable-dark hover:border-questionable-border transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{COPY.cta.eraseAll}</span>
          </button>
        )}
      </div>

      {/* Sparkline Trend Card (if at least 2 checks) */}
      {sparklineData.length >= 2 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-paper-surface border border-paper-border shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-reliable" />
              {COPY.history.sparklineLabel.replace("{n}", sparklineData.length)}
            </span>
            <span className="text-[11px] text-ink-subtle">
              Left = older, Right = newer
            </span>
          </div>

          <div className="h-14 w-full">
            <svg viewBox="0 0 400 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Midline at 50% */}
              <line x1="0" y1="25" x2="400" y2="25" stroke="#E7E1D8" strokeDasharray="3 3" strokeWidth="1" />

              {/* Sparkline curve */}
              {(() => {
                const points = sparklineData.map((chk, idx) => {
                  const x = (idx / (sparklineData.length - 1)) * 400;
                  const score = chk?.output?.ensemble_fake_probability ?? 0.5;
                  // y = 50 - (score * 50): 0 at bottom (y=50), 1 at top (y=0)
                  const y = 45 - score * 40;
                  return { x, y, score };
                });

                const d = points.reduce(
                  (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                  ""
                );

                return (
                  <>
                    <path d={d} fill="none" stroke="#2A9D8F" strokeWidth="2.5" strokeLinecap="round" />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill={p.score >= 0.65 ? "#C25E00" : p.score <= 0.35 ? "#2A9D8F" : "#5C6479"}
                        stroke="#FAF7F2"
                        strokeWidth="1.5"
                      />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center py-16 text-sm text-ink-subtle font-serif">
          Looking for past checks…
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-questionable-light border border-questionable-border text-questionable-dark text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && checks.length === 0 && (
        <div className="text-center py-16 px-4 bg-paper-surface border border-paper-border rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-paper-card border border-paper-border flex items-center justify-center mx-auto text-ink-subtle">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-semibold text-lg text-ink">
              {COPY.history.emptyTitle}
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted">
              {COPY.history.emptySubtitle}
            </p>
          </div>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-reliable text-white text-xs sm:text-sm font-medium hover:bg-reliable-dark transition-colors shadow-xs"
          >
            {COPY.history.emptyCta}
          </Link>
        </div>
      )}

      {/* Check Cards List */}
      {!loading && !error && checks.length > 0 && (
        <div className="space-y-3">
          {checks.map((chk) => {
            const verdict = chk?.output?.verdict || "uncertain";
            const badge = getVerdictBadge(verdict);
            const BadgeIcon = badge.icon;
            const score = chk?.output?.ensemble_fake_probability ?? 0.5;
            const pct = Math.round(score * 100);

            // Format date nicely
            let formattedDate = "";
            if (chk.created_at) {
              try {
                formattedDate = new Date(chk.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              } catch {
                formattedDate = chk.created_at;
              }
            }

            return (
              <div
                key={chk.id}
                onClick={() => navigate(`/history/${chk.id}`, { state: { checkRecord: chk } })}
                className="group p-4 sm:p-5 rounded-xl bg-paper-surface border border-paper-border hover:border-ink-subtle transition-all cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Verdict Pill */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>

                    {/* Date */}
                    {formattedDate && (
                      <span className="text-[11px] text-ink-faint flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </span>
                    )}
                  </div>

                  {/* Headline */}
                  <h3 className="font-serif font-medium text-base text-ink line-clamp-1 group-hover:text-reliable-dark transition-colors">
                    {chk?.input?.title || "Untitled check"}
                  </h3>
                </div>

                {/* Right controls: Mini lean bar & delete */}
                <div className="flex items-center gap-4 self-end sm:self-center flex-shrink-0">
                  <div className="w-24 text-right">
                    <span className="text-[11px] font-medium text-ink-muted block mb-1">
                      {pct}% lean
                    </span>
                    <div className="h-1.5 w-full bg-paper-border rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full ${
                          score >= 0.65 ? "bg-questionable" : score <= 0.35 ? "bg-reliable" : "bg-neutralBand"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(e, chk.id)}
                    className="p-1.5 text-ink-faint hover:text-questionable transition-colors rounded-md"
                    title={COPY.cta.delete}
                    aria-label={`${COPY.cta.delete} check`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-ink transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Erase All Modal */}
      {showConfirmErase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4">
          <div className="bg-paper-surface border border-paper-border rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-ink">
              {COPY.history.confirmTitle}
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              {COPY.history.confirmBody}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmErase(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-ink-muted hover:bg-paper-card border border-paper-border transition-colors"
              >
                {COPY.cta.cancel}
              </button>
              <button
                type="button"
                onClick={handleEraseAll}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-questionable text-white hover:bg-questionable-dark transition-colors shadow-sm"
              >
                {COPY.cta.confirmErase}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
