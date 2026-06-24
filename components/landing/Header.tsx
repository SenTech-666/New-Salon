"use client";

import Link from "next/link";
import { MapPin, ChevronDown, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--landing-bg) 92%, transparent)",
        borderBottom: "1px solid var(--landing-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="group flex items-baseline gap-0.5">
          <span
            className="transition-colors group-hover:opacity-80"
            style={{
              color: "var(--landing-text)",
              fontFamily: "var(--landing-font-display)",
              fontSize: "1.75rem",
              fontWeight: 700,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Aptio
          </span>
          <span
            className="text-[0.4rem] mb-0.5 ml-0.5 font-semibold tracking-widest uppercase"
            style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-body)" }}
          >
            ®
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7">
          {[
            { label: "Поиск", href: "#search" },
            { label: "Салоны", href: "#salons" },
            { label: "Как работает", href: "#how" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm transition-colors relative group"
              style={{ color: "var(--landing-text-dim)" }}
            >
              {label}
              <span
                className="absolute -bottom-0.5 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                style={{ background: "var(--landing-accent)" }}
              />
            </a>
          ))}
          <a
            href="/business"
            className="text-sm px-4 py-1.5 rounded-full font-semibold transition-all"
            style={{
              background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
              color: "var(--landing-on-accent)",
              boxShadow: "0 1px 8px var(--landing-accent-30)",
            }}
          >
            Для бизнеса
          </a>
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-4">
          <button
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "var(--landing-text-dim)" }}
          >
            <MapPin className="w-3.5 h-3.5" style={{ color: "var(--landing-accent)" }} />
            Москва
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <a
            href="#account"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              border: "1px solid var(--landing-accent-40)",
              color: "var(--landing-text-dim)",
            }}
          >
            <User className="w-3.5 h-3.5" style={{ color: "var(--landing-accent)" }} />
            Личный кабинет
          </a>
        </div>

        {/* Mobile */}
        <button
          className="md:hidden"
          style={{ color: "var(--landing-text)" }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden px-6 py-4 flex flex-col gap-4 overflow-hidden"
            style={{
              background: "var(--landing-bg)",
              borderTop: "1px solid var(--landing-border)",
            }}
          >
            <a href="#search" className="text-sm" style={{ color: "var(--landing-text-dim)" }}>Поиск</a>
            <a href="#salons" className="text-sm" style={{ color: "var(--landing-text-dim)" }}>Салоны</a>
            <a href="#how" className="text-sm" style={{ color: "var(--landing-text-dim)" }}>Как работает</a>
            <a
              href="/business"
              className="text-sm px-4 py-2 rounded-full w-fit font-semibold"
              style={{
                background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                color: "var(--landing-on-accent)",
              }}
            >
              Для бизнеса
            </a>
            <div
              className="flex items-center justify-between pt-2"
              style={{ borderTop: "1px solid var(--landing-border)" }}
            >
              <button className="flex items-center gap-1.5 text-sm" style={{ color: "var(--landing-text-dim)" }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: "var(--landing-accent)" }} />
                Москва
              </button>
              <a
                href="#account"
                className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5"
                style={{ border: "1px solid var(--landing-accent-40)", color: "var(--landing-text-dim)" }}
              >
                <User className="w-3.5 h-3.5" style={{ color: "var(--landing-accent)" }} />
                Личный кабинет
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}