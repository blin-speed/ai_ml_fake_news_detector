import React from "react";
import { Link, useLocation } from "react-router-dom";
import { COPY } from "../copy";
import { BookOpen, History, Info } from "lucide-react";

export function Header() {
  const location = useLocation();

  const navLinks = [
    { to: "/", label: COPY.brand.navHome, icon: BookOpen },
    { to: "/history", label: COPY.brand.navHistory, icon: History },
    { to: "/about", label: COPY.brand.navAbout, icon: Info },
  ];

  return (
    <header className="border-b border-paper-border bg-paper/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-ink hover:text-ink-muted transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-paper-card border border-paper-border flex items-center justify-center text-lg shadow-sm group-hover:border-paper-darker transition-colors">
            📰
          </div>
          <div>
            <span className="font-serif font-bold text-xl tracking-tight block leading-none">
              {COPY.brand.name}
            </span>
            <span className="text-[11px] text-ink-subtle hidden sm:block leading-tight">
              {COPY.brand.tagline}
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main Navigation">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-paper-card text-ink shadow-sm border border-paper-border"
                    : "text-ink-subtle hover:text-ink hover:bg-paper-card/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
