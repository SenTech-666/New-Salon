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
    <section className="relative bg-gradient-to-br from-[#FAF7F3] via-[#F8F1E8] to-[#F3E9DB] pt-32 pb-20 px-6 overflow-hidden">
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
            background: "radial-gradient(circle, #C4A882 0%, transparent 70%)",
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
              className="inline-flex items-center gap-2 bg-[#C4A882]/12 border border-[#C4A882]/25 text-[#9A7A56] text-xs font-semibold tracking-[0.18em] uppercase px-3.5 py-1.5 rounded-full mb-8"
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
                { weight: 900, style: "italic", opacity: 1, color: "#2C1F14" },
                { weight: 400, style: "italic", opacity: 0.38, color: "#C4A882" },
                { weight: 300, style: "normal", opacity: 0.18, color: "#2C1F14" },
              ].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: v.opacity, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    fontFamily: "'Playfair Display', serif",
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
              className="text-[#6B5744] text-base leading-relaxed mb-8 max-w-sm"
              style={{ fontFamily: "Inter, sans-serif" }}
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
                className="bg-gradient-to-r from-[#C4A882] to-[#9A7A56] text-white px-7 py-3.5 rounded-full text-sm font-semibold shadow-lg shadow-[#C4A882]/30 hover:shadow-xl hover:shadow-[#C4A882]/40 transition-shadow"
              >
                Найти салон
              </motion.a>
              <motion.a
                href="#how"
                whileHover={{ gap: "10px" }}
                className="flex items-center gap-2 text-[#6B5744] text-sm hover:text-[#2C1F14] transition-colors"
              >
                Как это работает
                <ArrowDown className="w-4 h-4 text-[#C4A882]" />
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
            <div className="rounded-3xl overflow-hidden aspect-[4/5] w-full max-w-md mx-auto lg:ml-auto shadow-2xl shadow-[#C4A882]/15 ring-1 ring-[#C4A882]/20">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&fit=crop&q=80"
                alt="Современный салон красоты"
                className="w-full h-full object-cover"
              />
              {/* warm copper overlay tint */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#C4A882]/20 via-transparent to-transparent" />
            </div>

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute bottom-5 left-5 right-5 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl shadow-[#C4A882]/12 border border-[#C4A882]/20"
            >
              <p
                className="text-[#C4A882] text-sm font-semibold mb-1"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              >
                Салоны с проверенной доступностью
              </p>
              <p className="text-[#9E8A76] text-xs leading-relaxed mb-3">
                Aptio собирает услуги, цены и свободное время в одном месте.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full font-medium border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                со свободным окном сегодня
              </span>
            </motion.div>

            {/* Decorative copper ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full border border-dashed border-[#C4A882]/25 pointer-events-none"
            />
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-20 pt-10 border-t border-[#C4A882]/20 grid grid-cols-2 md:grid-cols-4 gap-8"
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
                className="text-[#2C1F14] text-3xl mb-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
              >
                {s.value}
              </div>
              <div className="text-[#9E8A76] text-sm">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
