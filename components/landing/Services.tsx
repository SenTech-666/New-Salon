"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";

const CATEGORIES = ["Маникюр", "Окрашивание", "Брови", "Массаж", "Стрижка", "Ресницы"];

export function Services() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [focused, setFocused] = useState<string | null>(null);
  const [fields, setFields] = useState({
    name:    searchParams.get("name")    ?? "",
    service: searchParams.get("service") ?? "",
    price:   searchParams.get("price")   ?? "",
    city:    searchParams.get("city")    ?? "",
  });

  const hasFilters = Object.values(fields).some(Boolean);

  function handleSearch() {
    const params = new URLSearchParams();
    if (fields.name)    params.set("name",    fields.name);
    if (fields.service) params.set("service", fields.service);
    if (fields.price)   params.set("price",   fields.price);
    if (fields.city)    params.set("city",     fields.city);
    router.push(`/?${params.toString()}#salons`);
  }

  function handleReset() {
    setFields({ name: "", service: "", price: "", city: "" });
    router.push("/#salons");
  }

  function handleCategory(cat: string) {
    const next = fields.service === cat ? "" : cat;
    setFields((f) => ({ ...f, service: next }));
    const params = new URLSearchParams();
    if (next) params.set("service", next);
    router.push(`/?${params.toString()}#salons`);
  }

  const inputFields = [
    { key: "name"    as const, label: "Название", placeholder: "Например, Glow Lab" },
    { key: "service" as const, label: "Услуга",   placeholder: "Например, стрижка" },
    { key: "price"   as const, label: "Цена до",  placeholder: "3000" },
    { key: "city"    as const, label: "Город",    placeholder: "Например, Москва" },
  ];

  return (
    <section
      id="search"
      className="relative py-20 px-6 overflow-hidden"
      style={{ background: "var(--landing-bg-alt)" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, var(--landing-accent-30), transparent)` }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="leading-tight"
            style={{ color: "var(--landing-text)" }}
          >
            <span style={{ fontFamily: "var(--landing-font-accent)", fontSize: "clamp(36px,4.5vw,56px)", fontWeight: 300, fontStyle: "italic" }}>
              Ищите салон
            </span>
            <br />
            <span style={{ fontFamily: "var(--landing-font-display)", fontSize: "clamp(30px,3.5vw,46px)", fontWeight: 700 }}>
              так, как выбираете
            </span>
            <br />
            <span style={{ fontFamily: "var(--landing-font-accent)", fontSize: "clamp(36px,4.5vw,56px)", fontWeight: 300, fontStyle: "italic", color: "var(--landing-accent)" }}>
              время для себя
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="text-base leading-relaxed self-end"
            style={{ color: "var(--landing-text-dim)" }}
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
          className="rounded-2xl flex flex-col md:flex-row overflow-hidden mb-4 transition-all"
          style={{
            background: "var(--landing-surface)",
            boxShadow: "0 6px 40px var(--landing-accent-15)",
            border: "1px solid var(--landing-accent-15)",
          }}
        >
          {inputFields.map((field, i, arr) => (
            <motion.div
              key={field.key}
              animate={{
                backgroundColor: focused === field.key ? "var(--landing-surface-alt)" : "var(--landing-surface)",
              }}
              transition={{ duration: 0.2 }}
              className={`flex-1 px-5 py-4 cursor-text transition-colors border-b md:border-b-0 last:border-b-0`}
              style={{
                borderRight: i < arr.length - 1 ? "1px solid var(--landing-accent-12)" : undefined,
                borderBottomColor: "var(--landing-accent-12)",
              }}
              onClick={() => document.getElementById(`field-${field.key}`)?.focus()}
            >
              <div
                className="text-[11px] font-semibold mb-1 tracking-wide uppercase"
                style={{ color: "var(--landing-text)", letterSpacing: "0.06em" }}
              >
                {field.label}
              </div>
              <input
                id={`field-${field.key}`}
                value={fields[field.key]}
                onChange={(e) => setFields((f) => ({ ...f, [field.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="text-sm w-full outline-none bg-transparent transition-colors"
                style={{ color: "var(--landing-text-dim)" }}
                placeholder={field.placeholder}
                onFocus={() => setFocused(field.key)}
                onBlur={() => setFocused(null)}
              />
            </motion.div>
          ))}
          <div className="p-2.5 flex items-stretch gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleSearch}
              className="px-8 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 w-full md:w-auto justify-center"
              style={{
                background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                color: "var(--landing-on-accent)",
                boxShadow: "0 4px 12px var(--landing-accent-25)",
              }}
            >
              <Search className="w-4 h-4" />
              Найти
            </motion.button>
          </div>
        </motion.div>

        {/* Сброс фильтров */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-sm transition-colors group"
                style={{ color: "var(--landing-text-faint)" }}
              >
                <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" style={{ color: "var(--landing-accent)" }} />
                Сбросить фильтры
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="flex flex-wrap gap-2"
        >
          {CATEGORIES.map((cat, i) => {
            const active = fields.service === cat;
            return (
              <motion.button
                key={cat}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.32 + i * 0.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleCategory(cat)}
                className="px-4 py-2 rounded-full text-sm transition-all font-medium"
                style={
                  active
                    ? {
                        background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                        color: "var(--landing-on-accent)",
                        boxShadow: "0 4px 12px var(--landing-accent-25)",
                      }
                    : {
                        background: "var(--landing-surface)",
                        border: "1px solid var(--landing-accent-25)",
                        color: "var(--landing-text-dim)",
                      }
                }
              >
                {cat}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, var(--landing-accent-20), transparent)` }}
      />
    </section>
  );
}