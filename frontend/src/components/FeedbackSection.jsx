import React, { useState } from "react";
import { COPY } from "../copy";
import { api } from "../api";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";

export function FeedbackSection({ checkId }) {
  const [agrees, setAgrees] = useState(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectAgree = async (val) => {
    setAgrees(val);
    try {
      await api.feedback({
        check_id: checkId,
        agrees: val,
        note: note.trim() || undefined,
      });
    } catch {
      // quiet fail
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (agrees === null) return;
    setIsSubmitting(true);
    try {
      await api.feedback({
        check_id: checkId,
        agrees,
        note: note.trim() || undefined,
      });
      setIsSubmitted(true);
    } catch {
      // quiet fail
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-4 rounded-xl bg-paper border border-paper-border text-center text-xs text-reliable-dark flex items-center justify-center gap-1.5 font-medium">
        <Check className="w-4 h-4" />
        <span>{COPY.feedback.thanks}</span>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-paper-surface border border-paper-border shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-semibold text-ink font-serif">
          {COPY.feedback.prompt}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectAgree(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              agrees === true
                ? "bg-reliable text-white border-reliable-dark shadow-xs"
                : "bg-paper border-paper-border text-ink hover:border-reliable hover:text-reliable-dark"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{COPY.feedback.yes}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectAgree(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              agrees === false
                ? "bg-questionable text-white border-questionable-dark shadow-xs"
                : "bg-paper border-paper-border text-ink hover:border-questionable hover:text-questionable-dark"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{COPY.feedback.no}</span>
          </button>
        </div>
      </div>

      {agrees !== null && (
        <form onSubmit={handleNoteSubmit} className="space-y-2 pt-2 border-t border-paper-border">
          <textarea
            rows={2}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={COPY.feedback.notePlaceholder}
            className="w-full px-3 py-2 text-xs rounded-lg border border-paper-border bg-paper focus:bg-paper-surface focus:outline-none focus:ring-1 focus:ring-reliable text-ink placeholder:text-ink-faint resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ink text-white hover:bg-ink-muted transition-colors disabled:opacity-50"
            >
              {COPY.feedback.submit}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
