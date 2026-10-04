import React, { useState, useEffect, useRef } from "react";
import { COPY } from "../copy";
import { motion, AnimatePresence } from "framer-motion";

export function ThinkingStage({
  input,
  promise,
  onComplete,
  onError,
}) {
  const [phase, setPhase] = useState(0); // 0, 1, 2, 3
  const [isHolding, setIsHolding] = useState(false);
  const [error, setError] = useState(null);
  const [readerNames, setReaderNames] = useState([
    COPY.reader.naive_bayes.name,
    COPY.reader.logistic_regression.name,
    COPY.reader.bilstm.name,
  ]);

  const apiResultRef = useRef(null);
  const apiErrorRef = useRef(null);
  const isFinishedRef = useRef(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const skipAnimation =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("second_opinion_skip_animation") === "true";

  // Run the network request in parallel
  useEffect(() => {
    let isMounted = true;
    promise
      .then((data) => {
        if (!isMounted) return;
        apiResultRef.current = data;
        // If API returned readers, check count
        if (data?.models) {
          const keys = Object.keys(data.models);
          if (keys.length === 2) {
            setReaderNames([
              COPY.reader.naive_bayes.name,
              COPY.reader.logistic_regression.name,
            ]);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        apiErrorRef.current = err;
        setError(err.message || COPY.error.server);
        if (onError) onError(err);
      });

    return () => {
      isMounted = false;
    };
  }, [promise, onError]);

  // Timeline progression
  useEffect(() => {
    if (skipAnimation) {
      // Immediate completion if skip enabled and result arrives
      const checkInterval = setInterval(() => {
        if (apiResultRef.current) {
          clearInterval(checkInterval);
          onComplete(apiResultRef.current);
        } else if (apiErrorRef.current) {
          clearInterval(checkInterval);
        }
      }, 50);
      return () => clearInterval(checkInterval);
    }

    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => setPhase(3), 2400);

    const finishTimeout = setTimeout(() => {
      const finishOrHold = () => {
        if (isFinishedRef.current) return;
        if (apiErrorRef.current) return;

        if (apiResultRef.current) {
          isFinishedRef.current = true;
          onComplete(apiResultRef.current);
        } else {
          setIsHolding(true);
          const holdCheck = setInterval(() => {
            if (apiResultRef.current) {
              clearInterval(holdCheck);
              isFinishedRef.current = true;
              onComplete(apiResultRef.current);
            } else if (apiErrorRef.current) {
              clearInterval(holdCheck);
            }
          }, 100);
        }
      };

      finishOrHold();
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(finishTimeout);
    };
  }, [skipAnimation, onComplete]);

  // Phase labels
  const phaseTexts = [
    COPY.thinking.step1,
    COPY.thinking.step2,
    readerNames.length === 2 ? COPY.thinking.step3Two : COPY.thinking.step3Three,
    isHolding ? COPY.thinking.holding : COPY.thinking.step4,
  ];

  const currentText = phaseTexts[phase];

  return (
    <div
      className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-8 min-h-[420px]"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Background Soft Blobs */}
      <div className="relative w-full max-w-md h-48 flex items-center justify-center">
        {/* Orb 1: Teal */}
        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : {
                  scale: phase >= 2 ? [1, 1.15, 1] : 1,
                  opacity: error ? 0.2 : 0.8,
                  x: phase === 3 ? 0 : -60,
                }
          }
          transition={{ duration: 1.2, repeat: phase >= 2 ? Infinity : 0, ease: "easeInOut" }}
          className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-reliable/30 to-reliable/60 blur-xl filter"
        />

        {/* Orb 2: Amber */}
        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : {
                  scale: phase >= 2 ? [1.1, 1, 1.1] : 1,
                  opacity: error ? 0.2 : 0.8,
                  x: phase === 3 ? 0 : 60,
                }
          }
          transition={{ duration: 1.4, repeat: phase >= 2 ? Infinity : 0, ease: "easeInOut" }}
          className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-questionable/30 to-questionable/60 blur-xl filter"
        />

        {/* Orb 3: Slate Neutral */}
        {readerNames.length > 2 && (
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                    scale: phase >= 2 ? [1, 1.2, 1] : 1,
                    opacity: error ? 0.2 : 0.7,
                    y: phase === 3 ? 0 : -40,
                  }
            }
            transition={{ duration: 1.6, repeat: phase >= 2 ? Infinity : 0, ease: "easeInOut" }}
            className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-neutralBand/20 to-neutralBand/50 blur-lg filter"
          />
        )}

        {/* Center Preview Card in Phase 0 & 1 */}
        {phase < 2 && !error && (
          <div className="relative z-10 max-w-sm px-5 py-4 rounded-xl bg-paper-surface/90 border border-paper-border shadow-sm overflow-hidden text-left">
            {/* Light sweep line */}
            {!prefersReducedMotion && (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-reliable/20 to-transparent skew-x-12"
              />
            )}
            <p className="font-serif font-medium text-sm text-ink line-clamp-2">
              "{input.title}"
            </p>
          </div>
        )}

        {/* Reader Cards in Phase 2 */}
        {phase === 2 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex gap-3 sm:gap-4"
          >
            {readerNames.map((name, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded-lg bg-paper-surface/90 border border-paper-border shadow-sm text-xs font-serif font-medium text-ink"
              >
                {name}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Dynamic Text Status */}
      <div className="space-y-3 max-w-sm">
        <AnimatePresence mode="wait">
          <motion.h3
            key={currentText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="font-serif font-semibold text-xl text-ink"
          >
            {error ? COPY.error.server : currentText}
          </motion.h3>
        </AnimatePresence>

        {/* Progress Line */}
        <div className="w-48 h-1 bg-paper-border rounded-full mx-auto overflow-hidden">
          <motion.div
            initial={{ width: "10%" }}
            animate={{ width: `${Math.min(100, (phase + 1) * 25)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-reliable rounded-full"
          />
        </div>

        {error && (
          <p className="text-sm text-questionable font-medium pt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
