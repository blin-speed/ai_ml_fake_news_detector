import React, { useState, useEffect } from "react";
import { COPY } from "../copy";
import { Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";

export function CheckForm({ onSubmit, isBusy, initialValues = null }) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title || "");
      setDescription(initialValues.description || "");
    }
  }, [initialValues]);

  const wordCount = title.trim().split(/\s+/).filter(Boolean).length;
  const showShortHint = !description.trim() && wordCount >= 3;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isBusy) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError(COPY.error.short);
      return;
    }

    if (trimmedTitle.split(/\s+/).filter(Boolean).length < 3 && !description.trim()) {
      setValidationError(COPY.error.short);
      return;
    }

    setValidationError("");
    onSubmit({ title: trimmedTitle, description: description.trim() });
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectExample = (ex) => {
    setTitle(ex.title);
    setDescription(ex.description);
    setValidationError("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="bg-paper-surface border border-paper-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
    >
      {/* Examples Bar */}
      <div>
        <span className="text-xs font-medium text-ink-subtle uppercase tracking-wider block mb-2">
          {COPY.form.examplesLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          {COPY.form.examples.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExample(ex)}
              disabled={isBusy}
              className="text-xs px-3 py-1.5 rounded-full bg-paper-card border border-paper-border text-ink hover:border-ink-subtle transition-all disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-reliable" />
                {ex.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Headline Input */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label htmlFor="headline-input" className="font-semibold text-ink">
            {COPY.form.headlineLabel} <span className="text-questionable">*</span>
          </label>
          <span className={`text-[11px] ${title.length > 450 ? "text-questionable font-semibold" : "text-ink-faint"}`}>
            {title.length}/500
          </span>
        </div>
        <input
          id="headline-input"
          type="text"
          maxLength={500}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (validationError) setValidationError("");
          }}
          disabled={isBusy}
          placeholder={COPY.form.headlinePlaceholder}
          className="w-full px-4 py-3 text-base rounded-xl border border-paper-border bg-paper focus:bg-paper-surface focus:outline-none focus:ring-2 focus:ring-reliable/30 focus:border-reliable transition-all disabled:opacity-60 text-ink placeholder:text-ink-faint"
          required
        />
      </div>

      {/* Description Textarea */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label htmlFor="description-input" className="font-semibold text-ink">
            {COPY.form.descriptionLabel}
          </label>
          <span className={`text-[11px] ${description.length > 7500 ? "text-questionable font-semibold" : "text-ink-faint"}`}>
            {description.length}/8000
          </span>
        </div>
        <textarea
          id="description-input"
          rows={4}
          maxLength={8000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isBusy}
          placeholder={COPY.form.descriptionPlaceholder}
          className="w-full px-4 py-3 text-sm rounded-xl border border-paper-border bg-paper focus:bg-paper-surface focus:outline-none focus:ring-2 focus:ring-reliable/30 focus:border-reliable transition-all disabled:opacity-60 text-ink placeholder:text-ink-faint resize-y"
        />
        <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1 text-[11px] text-ink-subtle">
          <p>{COPY.form.descriptionHelper}</p>
          {showShortHint && (
            <p className="text-neutralBand-dark italic font-medium">{COPY.form.shortHint}</p>
          )}
        </div>
      </div>

      {/* Validation Error banner */}
      {validationError && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-questionable-light border border-questionable-border text-questionable-dark text-sm flex items-center gap-2"
        >
          <span>⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Submit Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-paper-border">
        <span className="text-xs text-ink-subtle hidden sm:flex items-center gap-1">
          <CornerDownLeft className="w-3.5 h-3.5" />
          {COPY.form.submitShortcut}
        </span>
        <button
          type="submit"
          disabled={isBusy || !title.trim()}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm bg-reliable text-white hover:bg-reliable-dark focus:outline-none focus:ring-2 focus:ring-reliable/40 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>{COPY.cta.check}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
