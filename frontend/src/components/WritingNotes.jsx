import React from "react";
import { COPY } from "../copy";
import { computeWritingNotes } from "../utils/writingNotes";
import { Eye } from "lucide-react";

export function WritingNotes({ title = "", description = "" }) {
  const notes = computeWritingNotes(title, description);

  if (notes.length === 0) return null;

  return (
    <div className="bg-paper-surface border border-paper-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-ink-subtle" />
        <h3 className="font-serif font-bold text-base text-ink">
          {COPY.writingNotes.title}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {notes.map((note) => (
          <div
            key={note.id}
            className="px-3.5 py-1.5 rounded-full bg-paper border border-paper-border text-xs text-ink-muted font-medium flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neutralBand" />
            <span>{note.text}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-subtle italic">
        {COPY.writingNotes.caption}
      </p>
    </div>
  );
}
