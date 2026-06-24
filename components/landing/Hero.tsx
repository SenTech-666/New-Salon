"use client";

import { motion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";

const floatingOrbs = [
  { size: 320, top: "10%", left: "-8%", delay: 0, duration: 8 },
  { size: 180, top: "60%", right: "-5%", delay: 2, duration: 10 },
  { size: 120, top: "30%", right: "15%", delay: 1, duration: 7 },
];

export function Hero() {
  return (
    <section
      className="relative pt-32 pb-20 px-6 overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, var(--landing-bg), var(--landing-bg-alt), var(--landing-bg-alt))`,
      }}
    >
      {/* Floating copper orbs */}
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -18, 0], scale: [1, 1.06, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: (orb as any).left,
            right: (orb as any).right,
            background: "radial-gradient(circle, var(--landing-accent) 0%, transparent 70%)",
            filter: "blur(48px)",
          }}
        />
      ))}

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase px-3.5 py-1.5 rounded-full mb-8"
              style={{
                background: "var(--landing-accent-12)",
                border: "1px solid var(--landing-accent-25)",
                color: "var(--landing-accent-dark)",
              }}
            >
              <Sparkles className="w-3 h-3" />
              Сервис записи в салоны
            </motion.div>

            {/* Cascading Aptio */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8 -ml-1 select-none"
            >
              {[
                { weight: 900, style: "italic", opacity: 1, color: "var(--landing-text)" },
                { weight: 400, style: "italic", opacity: 0.38, color: "var(--landing-accent)" },
                { weight: 300, style: "normal", opacity: 0.18, color: "var(--landing-text)" },
              ].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: v.opacity, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    fontFamily: "var(--landing-font-display)",
                    fontSize: "clamp(62px, 8.5vw, 110px)",
                    fontWeight: v.weight,
                    fontStyle: v.style as "italic" | "normal",
                    color: v.color,
                    lineHeight: 1.0,
                  }}
                >
                  Aptio
                </motion.div>
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-base leading-relaxed mb-8 max-w-sm"
              style={{ color: "var(--landing-text-dim)", fontFamily: "var(--landing-font-body)" }}
            >
              Найдите подходящий салон по названию, услуге, районе и бюджету — без переплаты
              и ручного сравнения прайсов.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="flex flex-wrap items-center gap-4"
            >
              <motion.a
                href="#search"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="px-7 py-3.5 rounded-full text-sm font-semibold transition-shadow"
                style={{
                  background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                  color: "var(--landing-on-accent)",
                  boxShadow: "0 10px 30px var(--landing-accent-30)",
                }}
              >
                Найти салон
              </motion.a>
              <motion.a
                href="#how"
                whileHover={{ gap: "10px" }}
                className="flex items-center gap-2 text-sm transition-colors"
                style={{ color: "var(--landing-text-dim)" }}
              >
                Как это работает
                <ArrowDown className="w-4 h-4" style={{ color: "var(--landing-accent)" }} />
              </motion.a>
            </motion.div>
          </div>

          {/* Right: salon photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative"
          >
            <div
              className="rounded-3xl overflow-hidden aspect-[4/5] w-full max-w-md mx-auto lg:ml-auto shadow-2xl"
              style={{
                boxShadow: "0 25px 50px -12px var(--landing-accent-15)",
                outline: "1px solid var(--landing-accent-20)",
                outlineOffset: "0px",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&fit=crop&q=80"
                alt="Современный салон красоты"
                className="w-full h-full object-cover"
              />
              {/* warm copper overlay tint */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, var(--landing-accent-20), transparent, transparent)" }}
              />
            </div>

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute bottom-5 left-5 right-5 backdrop-blur-xl rounded-2xl p-4 shadow-xl"
              style={{
                background: "color-mix(in srgb, var(--landing-surface) 90%, transparent)",
                boxShadow: "0 20px 25px -5px var(--landing-accent-12)",
                border: "1px solid var(--landing-accent-20)",
              }}
            >
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-display)", fontStyle: "italic" }}
              >
                Салоны с проверенной доступностью
              </p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--landing-text-faint)" }}>
                Aptio собирает услуги, цены и свободное время в одном месте.
              </p>
              <span
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: "var(--landing-success-bg)",
                  color: "var(--landing-success-text)",
                  border: "1px solid var(--landing-success-border)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--landing-success-dot)" }} />
                со свободным окном сегодня
              </span>
            </motion.div>

            {/* Decorative copper ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full border border-dashed pointer-events-none"
              style={{ borderColor: "var(--landing-accent-25)" }}
            />
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-20 pt-10 grid grid-cols-2 md:grid-cols-4 gap-8"
          style={{ borderTop: "1px solid var(--landing-accent-20)" }}
        >
          {[
            { value: "2 500+", label: "Салонов в базе" },
            { value: "50 000+", label: "Мастеров" },
            { value: "1 млн+", label: "Клиентов" },
            { value: "98%", label: "Подтверждений сразу" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 + i * 0.08 }}
              whileHover={{ y: -2 }}
              className="cursor-default"
            >
              <div
                className="text-3xl mb-1"
                style={{ color: "var(--landing-text)", fontFamily: "var(--landing-font-accent)", fontWeight: 600 }}
              >
                {s.value}
              </div>
              <div className="text-sm" style={{ color: "var(--landing-text-faint)" }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}