import React, { useState, useEffect } from "react";
import { COPY } from "../copy";
import { api, resetClientId } from "../api";
import { Trash2, FastForward } from "lucide-react";

export function Footer({ onHistoryErased }) {
  const [aboutInfo, setAboutInfo] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(() => {
    return localStorage.getItem("second_opinion_skip_animation") === "true";
  });

  useEffect(() => {
    api.about().then((data) => {
      if (data) setAboutInfo(data);
    });
  }, []);

  const handleToggleSkipAnimation = (e) => {
    const checked = e.target.checked;
    setSkipAnimation(checked);
    localStorage.setItem("second_opinion_skip_animation", String(checked));
  };

  const handleEraseAll = async () => {
    try {
      await api.deleteAll();
      resetClientId();
      setShowConfirm(false);
      if (onHistoryErased) onHistoryErased();
    } catch {
      setShowConfirm(false);
    }
  };

  const versionText = aboutInfo?.model_version
    ? COPY.notice.version.replace("{v}", aboutInfo.model_version)
    : "";

  return (
    <footer className="mt-16 border-t border-paper-border py-8 text-xs text-ink-subtle bg-paper">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Notice and version */}
        <div className="text-center md:text-left space-y-1">
          <p>{COPY.notice.data}</p>
          {versionText && <p className="text-[11px] text-ink-faint">{versionText}</p>}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {/* Skip animation toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-ink transition-colors">
            <input
              type="checkbox"
              checked={skipAnimation}
              onChange={handleToggleSkipAnimation}
              className="rounded border-paper-border text-reliable focus:ring-reliable/20 h-3.5 w-3.5"
            />
            <span className="flex items-center gap-1">
              <FastForward className="w-3.5 h-3.5" />
              {COPY.thinking.skipButton}
            </span>
          </label>

          {/* Erase button */}
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 hover:text-questionable-dark transition-colors underline decoration-dotted underline-offset-4"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{COPY.notice.eraseLink}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4">
          <div
            className="bg-paper-surface border border-paper-border rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95"
            role="dialog"
            aria-modal="true"
            aria-labelledby="erase-dialog-title"
          >
            <h3 id="erase-dialog-title" className="font-serif font-bold text-lg text-ink">
              {COPY.history.confirmTitle}
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              {COPY.history.confirmBody}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
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
    </footer>
  );
}
