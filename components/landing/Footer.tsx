"use client";

import { motion } from "framer-motion";
import { Send, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

export function Footer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="relative overflow-hidden" style={{ background: "var(--landing-footer-bg)" }}>
      {/* Copper gradient at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, var(--landing-accent-30), transparent)` }}
      />

      {/* Subtle background texture */}
      <motion.div
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--landing-accent) 0%, transparent 70%)", filter: "blur(80px)", transform: "translate(30%, -30%)" }}
      />

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <span
                style={{
                  color: "var(--landing-footer-text)",
                  fontFamily: "var(--landing-font-display)",
                  fontSize: "1.875rem",
                  fontWeight: 700,
                  fontStyle: "italic",
                  letterSpacing: "-0.02em",
                }}
              >
                Aptio
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--landing-footer-text-dim)" }}>
              Сервис записи в салоны красоты. Найдите нужное место и свободное время без лишних шагов.
            </p>
            <div className="flex gap-2">
              {[
                { icon: Send, label: "Telegram" },
              ].map(({ icon: Icon, label }) => (
                <motion.a
                  key={label}
                  href="#"
                  whileHover={{ y: -2 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    border: "1px solid var(--landing-accent-20)",
                    color: "var(--landing-footer-text-dim)",
                  }}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* For clients */}
          <div>
            <h4
              className="font-semibold text-sm mb-5"
              style={{ color: "var(--landing-footer-text)", fontFamily: "var(--landing-font-display)" }}
            >
              Для клиентов
            </h4>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--landing-footer-text-dim)" }}>
              Поиск по салонам, рейтинг, услуги и цены. Простое подтверждение через бота.
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Найти салон", href: "#search" },
                { label: "Каталог", href: "#salons" },
                { label: "Частые вопросы", href: "#faq" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm transition-colors" style={{ color: "var(--landing-footer-text-dim)" }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4
              className="font-semibold text-sm mb-5"
              style={{ color: "var(--landing-footer-text)", fontFamily: "var(--landing-font-display)" }}
            >
              Навигация
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Поиск", href: "#search" },
                { label: "Салоны", href: "#salons" },
                { label: "Как работает", href: "#how" },
                { label: "Для бизнеса", href: "/business" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm transition-colors" style={{ color: "var(--landing-footer-text-dim)" }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* For business */}
          <div>
            <h4
              className="font-semibold text-sm mb-5"
              style={{ color: "var(--landing-footer-text)", fontFamily: "var(--landing-font-display)" }}
            >
              Для бизнеса
            </h4>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--landing-footer-text-dim)" }}>
              Разместите салон, встройте услуги и занятость мастеров за один день.
            </p>
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 rounded-full text-sm font-bold transition-all"
              style={{
                background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                color: "var(--landing-footer-bg)",
                boxShadow: "0 10px 30px var(--landing-accent-20)",
              }}
            >
              Подключить салон
            </motion.button>
          </div>
        </div>

        <div
          className="mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--landing-accent-10)" }}
        >
          <div className="flex items-center gap-3">
            <p className="text-xs" style={{ color: "var(--landing-footer-text-dim)" }}>
              © 2026{" "}
              <span style={{ fontFamily: "var(--landing-font-display)", fontStyle: "italic" }}>Aptio</span>
              . Все права защищены.
            </p>

            {/* Незаметный переключатель темы — временно перенесён сюда
                с календаря (BookingPage). Та же логика useTheme(), что
                и во всём остальном проекте — переключает .dark на
                <html> глобально, в т.ч. и саму тему лендинга. */}
            <button
              onClick={toggleTheme}
              aria-label="Переключить тему"
              title="Переключить тему"
              className="landing-theme-toggle"
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </button>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs transition-colors" style={{ color: "var(--landing-footer-text-dim)" }}>
              Политика конфиденциальности
            </a>
            <a href="#" className="text-xs transition-colors" style={{ color: "var(--landing-footer-text-dim)" }}>
              Условия использования
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}