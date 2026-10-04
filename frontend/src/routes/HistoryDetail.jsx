import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { COPY } from "../copy";
import { api } from "../api";
import { ResultView } from "../components/ResultView";
import { ArrowLeft, AlertCircle } from "lucide-react";

export function HistoryDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [record, setRecord] = useState(location.state?.checkRecord || null);
  const [loading, setLoading] = useState(!location.state?.checkRecord);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (record) return;

    let isMounted = true;
    api
      .getHistory(100)
      .then((res) => {
        if (!isMounted) return;
        const found = (res?.checks || []).find((c) => c.id === id);
        if (found) {
          setRecord(found);
        } else {
          setError(COPY.error.notFound);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || COPY.error.server);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, record]);

  if (loading) {
    return (
      <div className="text-center py-16 font-serif text-ink-subtle">
        Loading saved check…
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        <div className="p-4 rounded-xl bg-questionable-light border border-questionable-border text-questionable-dark text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error || COPY.error.notFound}</span>
        </div>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to past checks</span>
        </Link>
      </div>
    );
  }

  const resultData = {
    ...record.output,
    id: record.id,
    created_at: record.created_at,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Header */}
      <div className="flex items-center justify-between pb-2 border-b border-paper-border">
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-ink-muted hover:text-ink font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to past checks</span>
        </Link>
        <span className="text-xs text-ink-subtle">
          Saved check
        </span>
      </div>

      {/* Result Display */}
      <ResultView
        result={resultData}
        input={record.input}
        onReset={() => navigate("/")}
      />
    </div>
  );
}
