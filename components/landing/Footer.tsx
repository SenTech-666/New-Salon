"use client";

import { motion } from "framer-motion";
import { Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-[#2C1F14] overflow-hidden">
      {/* Copper gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A882]/60 to-transparent" />

      {/* Subtle background texture */}
      <motion.div
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #C4A882 0%, transparent 70%)", filter: "blur(80px)", transform: "translate(30%, -30%)" }}
      />

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <span
                className="text-[#F2EDE4]"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.875rem", fontWeight: 700, fontStyle: "italic", letterSpacing: "-0.02em" }}
              >
                Aptio
              </span>
            </div>
            <p className="text-[#9E8A76] text-sm leading-relaxed mb-5">
              Сервис записи в салоны красоты. Найдите нужное место и свободное время без лишних шагов.
            </p>
            <div className="flex gap-2">
              {[
                { icon: Send, label: "Telegram" },
              ].map(({ icon: Icon, label }) => (
                <motion.a
                  key={label}
                  href="#"
                  whileHover={{ y: -2, backgroundColor: "rgba(196,168,130,0.15)" }}
                  className="w-9 h-9 rounded-full border border-[#C4A882]/20 flex items-center justify-center text-[#9E8A76] hover:text-[#C4A882] hover:border-[#C4A882]/40 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* For clients */}
          <div>
            <h4
              className="text-[#F2EDE4] font-semibold text-sm mb-5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Для клиентов
            </h4>
            <p className="text-[#9E8A76] text-sm leading-relaxed mb-4">
              Поиск по салонам, рейтинг, услуги и цены. Простое подтверждение через бота.
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Найти салон", href: "#search" },
                { label: "Каталог", href: "#salons" },
                { label: "Частые вопросы", href: "#faq" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[#9E8A76] text-sm hover:text-[#C4A882] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4
              className="text-[#F2EDE4] font-semibold text-sm mb-5"
              style={{ fontFamily: "'Playfair Display', serif" }}
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
                  <a href={link.href} className="text-[#9E8A76] text-sm hover:text-[#C4A882] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* For business */}
          <div>
            <h4
              className="text-[#F2EDE4] font-semibold text-sm mb-5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Для бизнеса
            </h4>
            <p className="text-[#9E8A76] text-sm leading-relaxed mb-5">
              Разместите салон, встройте услуги и занятость мастеров за один день.
            </p>
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-r from-[#C4A882] to-[#9A7A56] text-[#2C1F14] px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-[#C4A882]/20 hover:shadow-[#C4A882]/35"
            >
              Подключить салон
            </motion.button>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-[#C4A882]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#9E8A76] text-xs">
            © 2026{" "}
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>Aptio</span>
            . Все права защищены.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[#9E8A76] text-xs hover:text-[#C4A882] transition-colors">
              Политика конфиденциальности
            </a>
            <a href="#" className="text-[#9E8A76] text-xs hover:text-[#C4A882] transition-colors">
              Условия использования
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
