"use client";

import Link from "next/link";
import { MapPin, ChevronDown, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF7F3]/92 backdrop-blur-md border-b border-[#C4A882]/15">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="group flex items-baseline gap-0.5">
          <span
            className="text-[#2C1F14] transition-colors group-hover:text-[#C4A882]"
            style={{
              fontFamily: "'Playfair Display', serif",
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
            className="text-[#C4A882] text-[0.4rem] mb-0.5 ml-0.5 font-semibold tracking-widest uppercase"
            style={{ fontFamily: "Inter, sans-serif" }}
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
              className="text-[#6B5744] hover:text-[#2C1F14] text-sm transition-colors relative group"
            >
              {label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#C4A882] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <a
            href="/business"
            className="text-sm px-4 py-1.5 bg-gradient-to-r from-[#C4A882] to-[#A8895E] text-white rounded-full font-semibold hover:from-[#D4B898] hover:to-[#B8996E] transition-all shadow-sm shadow-[#C4A882]/30"
          >
            Для бизнеса
          </a>
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-[#6B5744] text-sm hover:text-[#2C1F14] transition-colors">
            <MapPin className="w-3.5 h-3.5 text-[#C4A882]" />
            Москва
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <a
            href="#account"
            className="flex items-center gap-2 border border-[#C4A882]/40 text-[#6B5744] hover:border-[#C4A882] hover:text-[#2C1F14] hover:bg-[#C4A882]/8 px-4 py-2 rounded-full text-sm font-medium transition-all"
          >
            <User className="w-3.5 h-3.5 text-[#C4A882]" />
            Личный кабинет
          </a>
        </div>

        {/* Mobile */}
        <button className="md:hidden text-[#2C1F14]" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#FAF7F3] border-t border-[#C4A882]/15 px-6 py-4 flex flex-col gap-4 overflow-hidden"
          >
            <a href="#search" className="text-[#6B5744] text-sm">Поиск</a>
            <a href="#salons" className="text-[#6B5744] text-sm">Салоны</a>
            <a href="#how" className="text-[#6B5744] text-sm">Как работает</a>
            <a href="/business" className="text-white text-sm bg-gradient-to-r from-[#C4A882] to-[#A8895E] px-4 py-2 rounded-full w-fit font-semibold">
              Для бизнеса
            </a>
            <div className="flex items-center justify-between pt-2 border-t border-[#C4A882]/15">
              <button className="flex items-center gap-1.5 text-[#6B5744] text-sm">
                <MapPin className="w-3.5 h-3.5 text-[#C4A882]" />
                Москва
              </button>
              <a href="#account" className="border border-[#C4A882]/40 text-[#6B5744] px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C4A882]" />
                Личный кабинет
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
