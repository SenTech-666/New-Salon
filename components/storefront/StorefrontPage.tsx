'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  MapPin,
  Clock,
  Phone,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

type Salon = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  photo_url: string | null;
  cover_url: string | null;
  business_hours: DaySchedule[] | null;
  social_links: Record<string, string> | null;
  lat: number | null;
  lng: number | null;
};

type DaySchedule = {
  day_of_week: number;
  is_day_off: boolean;
  time_from: string;
  time_to: string;
};

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type GalleryImage = {
  id: string;
  url: string;
  position: number;
};

const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAY_LABELS_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

function formatPrice(price: number) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`;
}

function todayIndex() {
  return new Date().getDay();
}

/** Текущий статус салона на основе business_hours: открыто сейчас / до скольки / закрыто. */
function getOpenStatus(hours: DaySchedule[] | null): { open: boolean; label: string } | null {
  if (!hours || hours.length === 0) return null;
  const now = new Date();
  const today = hours.find((h) => h.day_of_week === now.getDay());
  if (!today || today.is_day_off) return { open: false, label: 'Сегодня выходной' };

  const [fromH, fromM] = today.time_from.split(':').map(Number);
  const [toH, toM] = today.time_to.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const fromMinutes = fromH * 60 + fromM;
  const toMinutes = toH * 60 + toM;

  if (nowMinutes >= fromMinutes && nowMinutes < toMinutes) {
    return { open: true, label: `Открыто до ${today.time_to}` };
  }
  if (nowMinutes < fromMinutes) {
    return { open: false, label: `Откроется в ${today.time_from}` };
  }
  return { open: false, label: 'Сегодня закрыто' };
}

const SOCIAL_CONFIG: Record<string, { label: string; Icon: React.ElementType }> = {
  telegram: { label: 'Telegram', Icon: Send },
  instagram: { label: 'Instagram', Icon: ExternalLink },
  vk: { label: 'ВКонтакте', Icon: ExternalLink },
  whatsapp: { label: 'WhatsApp', Icon: Phone },
};

export default function StorefrontPage({
  salon,
  services,
  gallery,
}: {
  salon: Salon;
  services: Service[];
  gallery: GalleryImage[];
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const bookingHref = `/${salon.slug}/booking`;

  // Ссылка на запись конкретной услуги — передаёт ?service=<id>, чтобы
  // BookingPage сразу подставил эту услугу и не просил выбрать её повторно
  // (клиент уже выбрал её здесь, в прайс-листе). Общая кнопка "Записаться
  // онлайн" (хедер, контакты, sticky CTA) продолжает вести на bookingHref
  // без параметра — там выбор услуги действительно нужен.
  const bookingHrefForService = (serviceId: string) => `${bookingHref}?service=${serviceId}`;

  const hasGallery = gallery.length > 0;
  const hasHours = salon.business_hours && salon.business_hours.length > 0;
  const socialEntries = Object.entries(salon.social_links ?? {}).filter(([, url]) => !!url);
  const today = todayIndex();
  const openStatus = getOpenStatus(salon.business_hours);

  const minPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : null;
  const serviceTags = [...new Set(services.map((s) => s.name))].slice(0, 4);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--landing-bg)' }}>

      {/* ══════════════════════════════════════════════════════
          HERO — двухколоночный, в стиле главной страницы
          ══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-28 pb-16 px-6 sm:pt-36 sm:pb-24"
        style={{ background: `linear-gradient(to bottom right, var(--landing-bg), var(--landing-bg-alt), var(--landing-bg-alt))` }}
      >
        {/* decorative copper orbs */}
        <div
          className="absolute rounded-full pointer-events-none storefront-orb"
          style={{
            width: 340, height: 340, top: '-8%', left: '-10%',
            background: 'radial-gradient(circle, var(--landing-accent) 0%, transparent 70%)',
            filter: 'blur(56px)', opacity: 0.22, animationDelay: '0s',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none storefront-orb"
          style={{
            width: 200, height: 200, top: '55%', right: '-6%',
            background: 'radial-gradient(circle, var(--landing-accent) 0%, transparent 70%)',
            filter: 'blur(48px)', opacity: 0.18, animationDelay: '1.5s',
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── левая колонка: текст ── */}
            <div className={mounted ? 'storefront-fade-in' : 'opacity-0'}>
              {openStatus && (
                <div
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase px-3.5 py-1.5 rounded-full mb-7"
                  style={{
                    background: openStatus.open ? 'var(--landing-success-bg)' : 'var(--landing-accent-12)',
                    border: `1px solid ${openStatus.open ? 'var(--landing-success-border)' : 'var(--landing-accent-25)'}`,
                    color: openStatus.open ? 'var(--landing-success-text)' : 'var(--landing-accent-dark)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: openStatus.open ? 'var(--landing-success-dot)' : 'var(--landing-text-faint)' }}
                  />
                  {openStatus.label}
                </div>
              )}

              <h1
                className="mb-5 leading-[0.98]"
                style={{
                  fontFamily: 'var(--landing-font-display)',
                  fontStyle: 'italic',
                  fontWeight: 800,
                  fontSize: 'clamp(42px, 6vw, 76px)',
                  color: 'var(--landing-text)',
                  letterSpacing: '-0.01em',
                }}
              >
                {salon.name}
              </h1>

              {salon.description && (
                <p
                  className="text-base sm:text-lg leading-relaxed mb-7 max-w-md"
                  style={{ color: 'var(--landing-text-dim)' }}
                >
                  {salon.description}
                </p>
              )}

              {serviceTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-9">
                  {serviceTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        background: 'var(--landing-surface)',
                        border: '1px solid var(--landing-accent-15)',
                        color: 'var(--landing-text-dim)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-5">
                <Link href={bookingHref}>
                  <Button
                    size="lg"
                    className="rounded-full px-8 py-6 text-base font-semibold transition-transform hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                      color: 'var(--landing-on-accent)',
                      boxShadow: '0 10px 30px var(--landing-accent-30)',
                      border: 'none',
                    }}
                  >
                    <CalendarCheck className="mr-2 h-5 w-5" />
                    Записаться онлайн
                  </Button>
                </Link>

                {minPrice !== null && (
                  <div className="text-sm" style={{ color: 'var(--landing-text-faint)' }}>
                    Услуги от{' '}
                    <span className="font-semibold" style={{ color: 'var(--landing-text)' }}>
                      {formatPrice(minPrice)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── правая колонка: фото + floating card ── */}
            <div className={`relative ${mounted ? 'storefront-fade-in-delayed' : 'opacity-0'}`}>
              <div
                className="rounded-[28px] overflow-hidden aspect-[4/5] w-full max-w-md mx-auto lg:ml-auto relative"
                style={{
                  boxShadow: '0 30px 60px -15px var(--landing-accent-20)',
                  border: '1px solid var(--landing-accent-15)',
                }}
              >
                {salon.cover_url || salon.photo_url ? (
                  <img
                    src={salon.cover_url ?? salon.photo_url!}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, var(--landing-bg-alt), var(--landing-accent-20))` }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--landing-font-accent)',
                        fontStyle: 'italic',
                        fontSize: 96,
                        color: 'var(--landing-accent)',
                      }}
                    >
                      {salon.name[0]}
                    </span>
                  </div>
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, var(--landing-accent-20), transparent 55%)' }}
                />
              </div>

              {/* floating status / hours card */}
              {hasHours && (
                <div
                  className="absolute -bottom-6 left-4 right-4 sm:left-8 sm:right-8 rounded-2xl p-4 sm:p-5"
                  style={{
                    background: 'color-mix(in srgb, var(--landing-surface) 94%, transparent)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--landing-accent-20)',
                    boxShadow: '0 20px 40px -10px var(--landing-accent-15)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--landing-accent-12)' }}
                      >
                        <Clock className="w-4 h-4" style={{ color: 'var(--landing-accent)' }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--landing-text)' }}>
                          {openStatus?.label ?? 'Часы работы'}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--landing-text-faint)' }}>
                          {DAY_LABELS_FULL[today]}
                        </p>
                      </div>
                    </div>
                    {openStatus && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: openStatus.open ? 'var(--landing-success-dot)' : 'var(--landing-text-placeholder)' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* decorative dashed ring */}
              <div
                className="absolute -top-5 -right-5 w-20 h-20 rounded-full border border-dashed pointer-events-none storefront-spin"
                style={{ borderColor: 'var(--landing-accent-25)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          УСЛУГИ — карточки-строки премиум, hover CTA
          ══════════════════════════════════════════════════════ */}
      {services.length > 0 && (
        <section className="px-6 py-16 sm:py-20" style={{ background: 'var(--landing-bg)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-10">
              <div>
                <p
                  className="text-xs font-semibold tracking-[0.2em] uppercase mb-3"
                  style={{ color: 'var(--landing-accent)' }}
                >
                  Прайс-лист
                </p>
                <h2
                  style={{
                    fontFamily: 'var(--landing-font-display)',
                    fontWeight: 700,
                    fontSize: 'clamp(28px, 3.5vw, 42px)',
                    color: 'var(--landing-text)',
                  }}
                >
                  Услуги{' '}
                  <span
                    style={{
                      fontFamily: 'var(--landing-font-accent)',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      color: 'var(--landing-accent)',
                    }}
                  >
                    и цены
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {services.map((service, idx) => (
                <Link
                  key={service.id}
                  href={bookingHrefForService(service.id)}
                  className="group relative flex items-center justify-between gap-4 rounded-2xl px-6 py-5 transition-all duration-300 hover:-translate-y-0.5 storefront-rise"
                  style={{
                    background: 'var(--landing-surface)',
                    border: '1px solid var(--landing-accent-12)',
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors"
                      style={{ background: 'var(--landing-accent-10)', color: 'var(--landing-accent)' }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="font-semibold text-base truncate"
                        style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
                      >
                        {service.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm" style={{ color: 'var(--landing-text-faint)' }}>
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(service.duration)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div
                      className="text-lg sm:text-xl font-bold whitespace-nowrap"
                      style={{ color: 'var(--landing-accent)', fontFamily: 'var(--landing-font-display)' }}
                    >
                      {formatPrice(service.price)}
                    </div>
                    <div
                      className="hidden sm:flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap"
                      style={{
                        background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                        color: 'var(--landing-on-accent)',
                      }}
                    >
                      Записаться
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          ГАЛЕРЕЯ
          ══════════════════════════════════════════════════════ */}
      {hasGallery && (
        <section className="px-6 py-16 sm:py-20" style={{ background: 'var(--landing-bg-alt)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--landing-accent)' }} />
              <p
                className="text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ color: 'var(--landing-accent)' }}
              >
                Портфолио
              </p>
            </div>
            <h2
              className="mb-10"
              style={{
                fontFamily: 'var(--landing-font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 3.5vw, 42px)',
                color: 'var(--landing-text)',
              }}
            >
              Наши{' '}
              <span style={{ fontFamily: 'var(--landing-font-accent)', fontStyle: 'italic', fontWeight: 300, color: 'var(--landing-accent)' }}>
                работы
              </span>
            </h2>

            <div className="columns-2 gap-3 sm:columns-3 sm:gap-4">
              {gallery.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(i)}
                  className="group relative mb-3 block w-full overflow-hidden rounded-2xl sm:mb-4 storefront-rise"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <img
                    src={img.url}
                    alt={`${salon.name} — фото ${i + 1}`}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: 'linear-gradient(to top, var(--landing-accent-20), transparent 60%)' }}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          КОНТАКТЫ + ЧАСЫ — премиум-карточка
          ══════════════════════════════════════════════════════ */}
      <section className="px-6 py-16 sm:py-20" style={{ background: 'var(--landing-bg)' }}>
        <div className="max-w-4xl mx-auto">
          <div
            className={`relative overflow-hidden rounded-[28px] grid ${hasHours ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}
            style={{
              border: '1px solid var(--landing-accent-15)',
              boxShadow: '0 20px 50px -20px var(--landing-accent-15)',
            }}
          >
            {/* decorative accent strip */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-light), var(--landing-accent))` }}
            />

            {/* левая колонка — контакты */}
            <div className="flex flex-col gap-6 p-8 sm:p-10" style={{ background: 'var(--landing-surface)' }}>
              <h3
                className="text-xl font-bold"
                style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)', fontStyle: 'italic' }}
              >
                Как нас найти
              </h3>

              <div className="flex flex-col gap-4">
                {salon.address && (
                  <div className="flex items-start gap-3.5">
                    <div
                      className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'var(--landing-accent-10)' }}
                    >
                      <MapPin className="h-4.5 w-4.5" style={{ color: 'var(--landing-accent)' }} />
                    </div>
                    <span className="pt-2 text-sm leading-relaxed" style={{ color: 'var(--landing-text)' }}>
                      {salon.address}
                    </span>
                  </div>
                )}

                {salon.phone && (
                  <a href={`tel:${salon.phone}`} className="flex items-center gap-3.5 group">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                      style={{ background: 'var(--landing-accent-10)' }}
                    >
                      <Phone className="h-4.5 w-4.5" style={{ color: 'var(--landing-accent)' }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>{salon.phone}</span>
                  </a>
                )}
              </div>

              {socialEntries.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {socialEntries.map(([key, url]) => {
                    const cfg = SOCIAL_CONFIG[key];
                    const Icon = cfg?.Icon ?? Send;
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-80"
                        style={{ background: 'var(--landing-accent-10)', color: 'var(--landing-accent)' }}
                      >
                        <Icon className="h-4 w-4" />
                        {cfg?.label ?? key}
                      </a>
                    );
                  })}
                </div>
              )}

              <Link href={bookingHref} className="mt-auto">
                <Button
                  className="w-full rounded-full transition-transform hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                    color: 'var(--landing-on-accent)',
                    border: 'none',
                  }}
                >
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Записаться онлайн
                </Button>
              </Link>
            </div>

            {/* правая колонка — часы */}
            {hasHours && (
              <div
                className="flex flex-col gap-4 p-8 sm:p-10"
                style={{ borderLeft: '1px solid var(--landing-accent-15)', background: 'var(--landing-bg-alt)' }}
              >
                <h3
                  className="text-xl font-bold"
                  style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)', fontStyle: 'italic' }}
                >
                  Часы работы
                </h3>
                <div className="flex flex-col gap-1.5">
                  {salon.business_hours!
                    .slice()
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((d) => {
                      const isToday = d.day_of_week === today;
                      return (
                        <div
                          key={d.day_of_week}
                          className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors"
                          style={{
                            background: isToday ? 'var(--landing-accent-12)' : 'transparent',
                            fontWeight: isToday ? 600 : 400,
                          }}
                        >
                          <span style={{ color: isToday ? 'var(--landing-accent-dark)' : 'var(--landing-text-dim)' }}>
                            {DAY_LABELS[d.day_of_week]}
                          </span>
                          <span style={{ color: isToday ? 'var(--landing-accent-dark)' : 'var(--landing-text-dim)' }}>
                            {d.is_day_off ? 'Выходной' : `${d.time_from} – ${d.time_to}`}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STICKY CTA — мобильный
          ══════════════════════════════════════════════════════ */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:hidden">
        <div
          className="rounded-2xl p-1.5"
          style={{
            background: 'color-mix(in srgb, var(--landing-surface) 95%, transparent)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--landing-accent-20)',
            boxShadow: '0 -8px 30px -10px var(--landing-accent-20)',
          }}
        >
          <Link href={bookingHref}>
            <Button
              size="lg"
              className="w-full rounded-xl text-base"
              style={{
                background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                color: 'var(--landing-on-accent)',
                border: 'none',
              }}
            >
              <CalendarCheck className="mr-2 h-5 w-5" />
              Записаться онлайн
            </Button>
          </Link>
        </div>
      </div>
      <div className="h-24 sm:hidden" />

      {/* ══════════════════════════════════════════════════════
          ЛАЙТБОКС
          ══════════════════════════════════════════════════════ */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-4xl border-none bg-black/90 p-2 sm:p-4">
          {lightboxIndex !== null && (
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20"
              >
                <X className="h-5 w-5 text-white" />
              </button>

              {lightboxIndex > 0 && (
                <button
                  onClick={() => setLightboxIndex(lightboxIndex - 1)}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
              )}

              <img
                src={gallery[lightboxIndex].url}
                alt={`${salon.name} — фото ${lightboxIndex + 1}`}
                className="max-h-[85vh] w-full rounded-2xl object-contain"
              />

              {lightboxIndex < gallery.length - 1 && (
                <button
                  onClick={() => setLightboxIndex(lightboxIndex + 1)}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs text-white/70 bg-white/10 backdrop-blur">
                {lightboxIndex + 1} / {gallery.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}