"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const categories = ["Маникюр", "Окрашивание", "Брови", "Массаж", "Стрижка", "Ресницы"];

export function Services() {
  const [activeCategory, setActiveCategory] = useState("Маникюр");
  const [focused, setFocused] = useState<string | null>(null);

  return (
    <section id="search" className="relative bg-[#F3EDE3] py-20 px-6 overflow-hidden">
      {/* subtle copper accent bar at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A882]/60 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-[#2C1F14] leading-tight"
          >
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px,4.5vw,56px)", fontWeight: 300, fontStyle: "italic" }}>
              Ищите салон
            </span>
            <br />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(30px,3.5vw,46px)", fontWeight: 700 }}>
              так, как выбираете
            </span>
            <br />
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px,4.5vw,56px)", fontWeight: 300, fontStyle: "italic", color: "#C4A882" }}>
              время для себя
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="text-[#6B5744] text-base leading-relaxed self-end"
          >
            Простые фильтры, выбор поблизости и минимум данных для брони.
            Находите нужный салон за один экран — без переходов.
          </motion.p>
        </div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="bg-white rounded-2xl shadow-[0_6px_40px_rgba(196,168,130,0.18)] border border-[#C4A882]/15 flex flex-col md:flex-row overflow-hidden mb-5 ring-1 ring-transparent hover:ring-[#C4A882]/20 transition-all"
        >
          {[
            { key: "name", label: "Название", placeholder: "Например, Glow Lab" },
            { key: "service", label: "Услуга", placeholder: "Например, стрижка" },
            { key: "price", label: "Цена", placeholder: "до 3 тыс ₽" },
            { key: "district", label: "Район", placeholder: "Например, Центр" },
          ].map((field, i, arr) => (
            <motion.div
              key={field.key}
              animate={{ backgroundColor: focused === field.key ? "#FDF8F3" : "#FFFFFF" }}
              transition={{ duration: 0.2 }}
              className={`flex-1 px-5 py-4 cursor-text transition-colors ${
                i < arr.length - 1 ? "md:border-r border-[#C4A882]/12" : ""
              } border-b md:border-b-0 last:border-b-0`}
              onClick={() => document.getElementById(`field-${field.key}`)?.focus()}
            >
              <div className="text-[#2C1F14] text-[11px] font-semibold mb-1 tracking-wide uppercase" style={{ letterSpacing: "0.06em" }}>
                {field.label}
              </div>
              <input
                id={`field-${field.key}`}
                className="text-[#6B5744] text-sm w-full outline-none bg-transparent placeholder-[#C8BAA8] focus:text-[#2C1F14] transition-colors"
                placeholder={field.placeholder}
                onFocus={() => setFocused(field.key)}
                onBlur={() => setFocused(null)}
              />
            </motion.div>
          ))}
          <div className="p-2.5 flex items-stretch">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="bg-gradient-to-r from-[#C4A882] to-[#9A7A56] hover:from-[#D4B898] hover:to-[#AA8A66] text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 w-full md:w-auto justify-center shadow-md shadow-[#C4A882]/25"
            >
              <Search className="w-4 h-4" />
              Найти
            </motion.button>
          </div>
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="flex flex-wrap gap-2"
        >
          {categories.map((cat, i) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.32 + i * 0.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm transition-all font-medium ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-[#C4A882] to-[#9A7A56] text-white shadow-md shadow-[#C4A882]/25"
                  : "bg-white border border-[#C4A882]/25 text-[#6B5744] hover:border-[#C4A882] hover:text-[#9A7A56] hover:bg-[#FDF8F3]"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A882]/40 to-transparent" />
    </section>
  );
}
