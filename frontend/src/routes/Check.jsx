import React, { useState, useRef, useEffect } from "react";
import { COPY } from "../copy";
import { api } from "../api";
import { CheckForm } from "../components/CheckForm";
import { ThinkingStage } from "../components/ThinkingStage";
import { ResultView } from "../components/ResultView";

export function Check() {
  const [stage, setStage] = useState("idle"); // "idle" | "thinking" | "result"
  const [currentInput, setCurrentInput] = useState({ title: "", description: "" });
  const [checkPromise, setCheckPromise] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const abortControllerRef = useRef(null);

  // Cancel pending request if navigating away
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStartCheck = (input) => {
    setCurrentInput(input);
    setErrorMessage("");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const promise = api.check(input, abortControllerRef.current.signal);
    setCheckPromise(promise);
    setStage("thinking");
  };

  const handleThinkingComplete = (data) => {
    setResultData(data);
    setStage("result");
  };

  const handleThinkingError = (err) => {
    if (err.name === "AbortError") return;
    setErrorMessage(err.message || COPY.error.server);
    setStage("idle");
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStage("idle");
    setResultData(null);
    setErrorMessage("");
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink tracking-tight">
          {COPY.brand.name}
        </h1>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
          {COPY.disclaimer}
        </p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="max-w-xl mx-auto p-4 rounded-xl bg-questionable-light border border-questionable-border text-questionable-dark text-sm flex items-center justify-between gap-3 shadow-xs"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-xs underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main View Area */}
      {stage === "idle" && (
        <CheckForm
          onSubmit={handleStartCheck}
          isBusy={false}
          initialValues={currentInput}
        />
      )}

      {stage === "thinking" && (
        <ThinkingStage
          input={currentInput}
          promise={checkPromise}
          onComplete={handleThinkingComplete}
          onError={handleThinkingError}
        />
      )}

      {stage === "result" && resultData && (
        <ResultView
          result={resultData}
          input={currentInput}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
