"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Задайте фильтры",
    description: "Укажите услугу, район и бюджет — система подберёт варианты без лишних шагов.",
  },
  {
    num: "02",
    title: "Сравните карточки",
    description: "Смотрите цены, описания и ближайшее свободное окно — всё в одном месте.",
  },
  {
    num: "03",
    title: "Получите подтверждение",
    description: "Aptio отправит подтверждение, напомнит о визите и сохранит историю.",
  },
];

export function Comparison() {
  return (
    <section id="how" className="relative bg-[#F3EDE3] py-24 px-6 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A882]/50 to-transparent" />

      {/* Background decorative element */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        className="absolute -right-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-dashed border-[#C4A882]/15 pointer-events-none"
      />
      <motion.div
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute -right-20 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-dashed border-[#C4A882]/20 pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[#C4A882] text-xs font-semibold tracking-[0.2em] uppercase mb-5 text-center"
        >
          Единый запись
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <span
            className="block text-[#2C1F14]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(34px,4.5vw,56px)", fontWeight: 300, fontStyle: "italic" }}
          >
            Три шага
          </span>
          <span
            className="block text-[#2C1F14]"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px,2.8vw,36px)", fontWeight: 700, lineHeight: 1.2 }}
          >
            от желания до подтверждённого времени
          </span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connector */}
          <div className="hidden md:block absolute top-7 left-[calc(16.66%+28px)] right-[calc(16.66%+28px)] h-px">
            <div className="w-full h-full bg-gradient-to-r from-[#C4A882]/40 via-[#C4A882]/70 to-[#C4A882]/40" />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.15 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="cursor-default"
            >
              <motion.div
                whileHover={{ scale: 1.08, borderColor: "#C4A882" }}
                className="w-14 h-14 rounded-full border-2 border-[#C4A882]/50 bg-white shadow-md shadow-[#C4A882]/10 flex flex-col items-center justify-center mb-6 relative z-10 transition-all"
              >
                <span
                  className="text-[#C4A882] leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", fontWeight: 400, letterSpacing: "0.1em" }}
                >
                  шаг
                </span>
                <span
                  className="text-[#2C1F14] leading-none"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700 }}
                >
                  {i + 1}
                </span>
              </motion.div>
              <h3
                className="text-[#2C1F14] font-semibold text-lg mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {step.title}
              </h3>
              <p className="text-[#6B5744] text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A882]/40 to-transparent" />
    </section>
  );
}
