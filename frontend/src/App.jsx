import React, { Suspense, lazy, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Check } from "./routes/Check";

// Lazy load secondary routes to optimize bundle budget
const History = lazy(() =>
  import("./routes/History").then((module) => ({ default: module.History }))
);
const HistoryDetail = lazy(() =>
  import("./routes/HistoryDetail").then((module) => ({ default: module.HistoryDetail }))
);
const About = lazy(() =>
  import("./routes/About").then((module) => ({ default: module.About }))
);

export function App() {
  const [historyKey, setHistoryKey] = useState(0);

  const handleHistoryErased = () => {
    setHistoryKey((k) => k + 1);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen flex flex-col bg-paper text-ink font-sans">
        <Header />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Suspense
            fallback={
              <div className="py-20 text-center font-serif text-sm text-ink-subtle animate-pulse">
                Taking a moment…
              </div>
            }
          >
            <Routes key={historyKey}>
              <Route path="/" element={<Check />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:id" element={<HistoryDetail />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Suspense>
        </main>

        <Footer onHistoryErased={handleHistoryErased} />
      </div>
    </LazyMotion>
  );
}
export default App;
