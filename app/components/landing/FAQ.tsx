"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "Как забронировать место в салоне?",
    answer:
      "Выберите подходящий салон, укажите услугу и желаемое время. После нажатия кнопки «Записаться» вы получите подтверждение — на почту или в мессенджер. Вся запись занимает меньше минуты.",
  },
  {
    question: "Можно ли отменить или перенести бронирование?",
    answer:
      "Да, бесплатно за 24 часа до визита. Изменить время можно прямо в личном кабинете или через уведомление в боте — без звонков салону.",
  },
  {
    question: "Как работает подбор по расписанию?",
    answer:
      "Aptio подключается к системам расписания салонов и показывает только реально свободные окна. Вы видите актуальное время, а не те слоты, что «могут быть доступны».",
  },
  {
    question: "Безопасно ли оплачивать через сервис?",
    answer:
      "Оплата происходит напрямую в салоне. Через Aptio не нужно вводить данные карты — мы работаем только как платформа записи, без хранения платёжной информации.",
  },
  {
    question: "Как разместить свой салон на платформе?",
    answer:
      "Перейдите в раздел «Для бизнеса», заполните короткую форму и загрузите расписание. Наша команда свяжется с вами в течение рабочего дня и поможет с настройкой.",
  },
  {
    question: "Сколько стоит использование сервиса?",
    answer:
      "Для клиентов Aptio полностью бесплатен. Для владельцев салонов доступен бесплатный базовый тариф и расширенный — с аналитикой и продвижением в выдаче.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="relative bg-[#FAF7F3] py-20 px-6">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A882]/40 to-transparent" />

      <div className="max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[#C4A882] text-xs font-semibold tracking-[0.2em] uppercase mb-4 text-center"
        >
          Вопросы и ответы
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-12"
        >
          <span
            className="text-[#2C1F14]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(34px,4.5vw,52px)", fontWeight: 300, fontStyle: "italic" }}
          >
            Частые вопросы
          </span>
        </motion.h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                open === i
                  ? "border-[#C4A882]/50 shadow-md shadow-[#C4A882]/08"
                  : "border-[#C4A882]/12 hover:border-[#C4A882]/30"
              }`}
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left group"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className="text-[#2C1F14] font-medium text-base pr-4 group-hover:text-[#9A7A56] transition-colors"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {faq.question}
                </span>
                <motion.span
                  animate={{ backgroundColor: open === i ? "#C4A882" : "transparent" }}
                  className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                    open === i ? "border-[#C4A882] text-white" : "border-[#C4A882]/30 text-[#9E8A76]"
                  }`}
                >
                  {open === i ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-[#6B5744] text-sm leading-relaxed border-t border-[#C4A882]/10 pt-3">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
