"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function BusinessTeaser() {
  return (
    <section className="relative bg-[#2C1F14] py-20 px-6 overflow-hidden">
      {/* Floating copper orbs — как в оригинальной секции ConnectSalon */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #C4A882 0%, transparent 65%)", filter: "blur(80px)", transform: "translate(30%, -30%)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #C4A882 0%, transparent 65%)", filter: "blur(80px)", transform: "translate(-30%, 30%)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[#C4A882] text-xs font-semibold tracking-[0.2em] uppercase mb-5"
          >
            Для бизнеса
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="mb-6"
          >
            <span
              className="block text-[#F2EDE4]"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px,4vw,48px)", fontWeight: 300, fontStyle: "italic" }}
            >
              У вас салон красоты?
            </span>
            <span
              className="block"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px,3.2vw,38px)", fontWeight: 700, color: "#C4A882" }}
            >
              Подключите его к Aptio
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="text-[#9E8A76] text-base leading-relaxed max-w-md"
          >
            Получайте новых клиентов уже завтра — без абонентской платы на старте,
            только результат.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="shrink-0"
        >
          <Link href="/business">
            <motion.span
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C4A882] to-[#9A7A56] hover:from-[#D4B898] hover:to-[#AA8A66] text-[#2C1F14] px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-xl shadow-[#C4A882]/25 cursor-pointer"
            >
              Подключить салон
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
