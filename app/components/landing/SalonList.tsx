import { Star, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { SalonCard } from "@/lib/types/salon";

type Props = {
  searchParams: {
    name?: string
    service?: string
    price?: string
    city?: string
  }
}

async function getSalons(params: Props["searchParams"]): Promise<SalonCard[]> {
  const supabase = await createClient();

  const priceMax = params.price ? parseInt(params.price, 10) : null;

  const { data, error } = await supabase.rpc("search_salons", {
    p_name:      params.name    || null,
    p_service:   params.service || null,
    p_price_max: isNaN(priceMax as number) ? null : priceMax,
    p_city:      params.city    || null,
  });

  if (error) {
    console.error("search_salons error:", error);
    return [];
  }

  return data as SalonCard[];
}

function priceRange(min: number | null, max: number | null): string {
  if (!min && !max) return "Цены уточняйте";
  if (min === max || !max) return `от ${min?.toLocaleString("ru")} ₽`;
  return `${min?.toLocaleString("ru")} — ${max?.toLocaleString("ru")} ₽`;
}

export async function SalonList({ searchParams }: Props) {
  const salons = await getSalons(searchParams);
  const hasFilters = Object.values(searchParams).some(Boolean);

  return (
    <section id="salons" className="bg-[#FAF7F3] py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-[#C4A882] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              {hasFilters ? "Результаты поиска" : "Подборка рядом"}
            </p>
            <h2>
              <span
                className="block text-[#2C1F14]"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 700 }}
              >
                {hasFilters ? "Найденные салоны" : "Лучшие салоны"}
              </span>
              <span
                className="block text-[#C4A882]"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 300, fontStyle: "italic" }}
              >
                {hasFilters ? `${salons.length} результатов` : "вашего города"}
              </span>
            </h2>
          </div>
          <a
            href="#"
            className="flex items-center gap-1.5 text-[#9E8A76] text-sm hover:text-[#C4A882] transition-colors group shrink-0"
          >
            Весь каталог
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {salons.length === 0 ? (
          <div className="text-center py-20">
            <p
              className="text-[#C4A882] text-2xl mb-3"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
            >
              Ничего не найдено
            </p>
            <p className="text-[#9E8A76] text-sm">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {salons.map((salon, i) => (
              <Link
                key={salon.id}
                href={`/${salon.slug}`}
                className="group bg-white rounded-2xl border border-[#C4A882]/12 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#C4A882]/15 transition-all hover:-translate-y-1 duration-300 cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden bg-[#F3EDE3]">
                  {salon.photo_url || salon.cover_url ? (
                    <img
                      src={salon.photo_url ?? salon.cover_url!}
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#F3EDE3] to-[#E8DDD0] flex items-center justify-center">
                      <span
                        className="text-[#C4A882] text-4xl"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
                      >
                        {salon.name[0]}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#C4A882]/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-5">
                  <h3
                    className="text-[#2C1F14] font-semibold text-base mb-3 group-hover:text-[#9A7A56] transition-colors"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {salon.name}
                  </h3>

                  <div className="space-y-1.5 mb-4">
                    {(salon.address || salon.city) && (
                      <div className="flex items-center gap-2 text-[#9E8A76]">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#C4A882]/70" />
                        <span className="text-sm">{salon.address ?? salon.city}</span>
                      </div>
                    )}
                  </div>

                  {salon.categories && salon.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {salon.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="text-xs bg-[#F3EDE3] text-[#6B5744] px-2.5 py-1 rounded-full border border-[#C4A882]/15 group-hover:border-[#C4A882]/30 transition-colors"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[#C4A882]/12">
                    <div>
                      <div className="text-[#9E8A76] text-xs mb-0.5">Цены</div>
                      <div className="text-[#2C1F14] font-semibold text-sm">
                        {priceRange(salon.min_price, salon.max_price)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-[#C4A882] to-[#9A7A56] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm shadow-[#C4A882]/20">
                      Записаться
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}