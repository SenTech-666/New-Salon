import { MapPin, ArrowRight } from "lucide-react";
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
    <section id="salons" className="py-20 px-6" style={{ background: "var(--landing-bg)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-3"
              style={{ color: "var(--landing-accent)" }}
            >
              {hasFilters ? "Результаты поиска" : "Подборка рядом"}
            </p>
            <h2>
              <span
                className="block"
                style={{ color: "var(--landing-text)", fontFamily: "var(--landing-font-display)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 700 }}
              >
                {hasFilters ? "Найденные салоны" : "Лучшие салоны"}
              </span>
              <span
                className="block"
                style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-accent)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 300, fontStyle: "italic" }}
              >
                {hasFilters ? `${salons.length} результатов` : "вашего города"}
              </span>
            </h2>
          </div>
          <a
            href="#"
            className="flex items-center gap-1.5 text-sm transition-colors group shrink-0"
            style={{ color: "var(--landing-text-faint)" }}
          >
            Весь каталог
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {salons.length === 0 ? (
          <div className="text-center py-20">
            <p
              className="text-2xl mb-3"
              style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-accent)", fontStyle: "italic" }}
            >
              Ничего не найдено
            </p>
            <p className="text-sm" style={{ color: "var(--landing-text-faint)" }}>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {salons.map((salon) => (
              <Link
                key={salon.id}
                href={`/${salon.slug}`}
                className="group rounded-2xl overflow-hidden shadow-sm transition-all hover:-translate-y-1 duration-300 cursor-pointer"
                style={{
                  background: "var(--landing-surface)",
                  border: "1px solid var(--landing-accent-12)",
                }}
              >
                <div className="relative h-48 overflow-hidden" style={{ background: "var(--landing-bg-alt)" }}>
                  {salon.photo_url || salon.cover_url ? (
                    <img
                      src={salon.photo_url ?? salon.cover_url!}
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(to bottom right, var(--landing-bg-alt), var(--landing-accent-20))` }}
                    >
                      <span
                        className="text-4xl"
                        style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-accent)", fontStyle: "italic" }}
                      >
                        {salon.name[0]}
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(to top, var(--landing-accent-15), transparent, transparent)` }}
                  />
                </div>

                <div className="p-5">
                  <h3
                    className="font-semibold text-base mb-3 transition-colors"
                    style={{ color: "var(--landing-text)", fontFamily: "var(--landing-font-display)" }}
                  >
                    {salon.name}
                  </h3>

                  <div className="space-y-1.5 mb-4">
                    {(salon.address || salon.city) && (
                      <div className="flex items-center gap-2" style={{ color: "var(--landing-text-faint)" }}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--landing-accent)", opacity: 0.7 }} />
                        <span className="text-sm">{salon.address ?? salon.city}</span>
                      </div>
                    )}
                  </div>

                  {salon.categories && salon.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {salon.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="text-xs px-2.5 py-1 rounded-full transition-colors"
                          style={{
                            background: "var(--landing-bg-alt)",
                            color: "var(--landing-text-dim)",
                            border: "1px solid var(--landing-accent-15)",
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid var(--landing-accent-12)" }}
                  >
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: "var(--landing-text-faint)" }}>Цены</div>
                      <div className="font-semibold text-sm" style={{ color: "var(--landing-text)" }}>
                        {priceRange(salon.min_price, salon.max_price)}
                      </div>
                    </div>
                    <div
                      className="px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{
                        background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                        color: "var(--landing-on-accent)",
                        boxShadow: "0 1px 8px var(--landing-accent-20)",
                      }}
                    >
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