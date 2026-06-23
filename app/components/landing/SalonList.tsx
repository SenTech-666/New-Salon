"use client";

import { Star, MapPin, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const salons = [
  {
    id: 1,
    name: "Beauty Studio Elite",
    image: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800&fit=crop&q=80",
    rating: 4.9,
    reviews: 245,
    address: "ул. Тверская, 12",
    priceRange: "2 000 — 5 000 ₽",
    nextAvailable: "Сегодня, 14:00",
    services: ["Стрижка", "Окрашивание", "Укладка"],
    availableToday: true,
  },
  {
    id: 2,
    name: "Luxury Hair Salon",
    image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&fit=crop&q=80",
    rating: 4.8,
    reviews: 189,
    address: "Невский пр., 45",
    priceRange: "3 000 — 8 000 ₽",
    nextAvailable: "Завтра, 10:30",
    services: ["Стрижка", "Кератин", "SPA уход"],
    availableToday: false,
  },
  {
    id: 3,
    name: "Spa & Beauty Center",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&fit=crop&q=80",
    rating: 4.7,
    reviews: 312,
    address: "ул. Пушкина, 28",
    priceRange: "1 500 — 4 500 ₽",
    nextAvailable: "Сегодня, 16:30",
    services: ["Массаж", "Уход за лицом", "Маникюр"],
    availableToday: true,
  },
  {
    id: 4,
    name: "Nail Art Studio",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&fit=crop&q=80",
    rating: 4.9,
    reviews: 428,
    address: "пр. Мира, 67",
    priceRange: "1 200 — 3 500 ₽",
    nextAvailable: "Сегодня, 12:00",
    services: ["Маникюр", "Педикюр", "Наращивание"],
    availableToday: true,
  },
  {
    id: 5,
    name: "Barbershop Premium",
    image: "https://images.unsplash.com/photo-1610475680335-dafab5475150?w=800&fit=crop&q=80",
    rating: 4.8,
    reviews: 156,
    address: "ул. Ленина, 89",
    priceRange: "800 — 2 500 ₽",
    nextAvailable: "Завтра, 11:00",
    services: ["Стрижка", "Бритье", "Уход за бородой"],
    availableToday: false,
  },
  {
    id: 6,
    name: "Makeup Studio Pro",
    image: "https://images.unsplash.com/photo-1744095407400-aa337918bbb1?w=800&fit=crop&q=80",
    rating: 5.0,
    reviews: 92,
    address: "Кутузовский пр., 15",
    priceRange: "2 500 — 10 000 ₽",
    nextAvailable: "Сегодня, 18:00",
    services: ["Макияж", "Визаж", "Обучение"],
    availableToday: true,
  },
];

export function SalonList() {
  return (
    <section id="salons" className="bg-[#FAF7F3] py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-[#C4A882] text-xs font-semibold tracking-[0.2em] uppercase mb-3"
            >
              Подборка рядом
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="block text-[#2C1F14]"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 700 }}
              >
                Лучшие салоны
              </span>
              <span
                className="block text-[#C4A882]"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 300, fontStyle: "italic" }}
              >
                вашего города
              </span>
            </motion.h2>
          </div>
          <motion.a
            href="#"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            whileHover={{ x: 4 }}
            className="flex items-center gap-1.5 text-[#9E8A76] text-sm hover:text-[#C4A882] transition-colors group shrink-0"
          >
            Весь каталог
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </motion.a>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {salons.map((salon, i) => (
            <motion.div
              key={salon.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -5, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
              className="group bg-white rounded-2xl border border-[#C4A882]/12 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#C4A882]/15 transition-shadow cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden bg-[#F3EDE3]">
                <ImageWithFallback
                  src={salon.image}
                  alt={salon.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                />
                {/* warm overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#C4A882]/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-3 right-3 bg-white/92 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-[#C4A882]/15">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[#2C1F14] font-semibold text-sm">{salon.rating}</span>
                  <span className="text-[#9E8A76] text-xs">({salon.reviews})</span>
                </div>

                {salon.availableToday && (
                  <div className="absolute bottom-3 left-3 bg-white/88 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-100">
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      свободно сегодня
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3
                  className="text-[#2C1F14] font-semibold text-base mb-3 group-hover:text-[#9A7A56] transition-colors"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {salon.name}
                </h3>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-[#9E8A76]">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#C4A882]/70" />
                    <span className="text-sm">{salon.address}</span>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    style={{ color: salon.availableToday ? "#16a34a" : "#9E8A76" }}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: salon.availableToday ? "#16a34a" : "#C4A882" }} />
                    <span className="text-sm font-medium">{salon.nextAvailable}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {salon.services.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-[#F3EDE3] text-[#6B5744] px-2.5 py-1 rounded-full border border-[#C4A882]/15 group-hover:border-[#C4A882]/30 transition-colors"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#C4A882]/12">
                  <div>
                    <div className="text-[#9E8A76] text-xs mb-0.5">Цены</div>
                    <div className="text-[#2C1F14] font-semibold text-sm">{salon.priceRange}</div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-[#C4A882] to-[#9A7A56] hover:from-[#D4B898] hover:to-[#AA8A66] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-[#C4A882]/20"
                  >
                    Записаться
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
