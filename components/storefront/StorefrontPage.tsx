'use client';

import { useState } from 'react';
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
  const bookingHref = `/${salon.slug}/booking`;
  const hasGallery = gallery.length > 0;
  const hasHours = salon.business_hours && salon.business_hours.length > 0;
  const socialEntries = Object.entries(salon.social_links ?? {}).filter(([, url]) => !!url);
  const today = todayIndex();

  return (
    <div className="bp-bg min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {salon.cover_url ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${salon.cover_url})` }}
            />
            {/* двухслойный градиент: сверху лёгкий, снизу плотный */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/75" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, var(--bp-bg-1), var(--bp-bg-2))' }}
          />
        )}

        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-20 sm:px-10 sm:pb-24 sm:pt-28">
          {/* аватар */}
          {salon.photo_url && (
            <div
              className="mb-6 h-20 w-20 overflow-hidden rounded-2xl shadow-2xl ring-2 sm:h-24 sm:w-24"
              style={{ outline: '2px solid rgba(255,255,255,0.25)', outlineOffset: '2px' }}
            >
              <img src={salon.photo_url} alt={salon.name} className="h-full w-full object-cover" />
            </div>
          )}

          <h1
            className="mb-3 text-4xl font-bold leading-tight tracking-tight sm:text-6xl"
            style={{
              fontFamily: 'var(--bp-font-display)',
              color: salon.cover_url ? '#fff' : 'var(--bp-text)',
            }}
          >
            {salon.name}
          </h1>

          {salon.description && (
            <p
              className="mb-8 max-w-lg text-base leading-relaxed sm:text-lg"
              style={{ color: salon.cover_url ? 'rgba(255,255,255,0.80)' : 'var(--bp-text-dim)' }}
            >
              {salon.description}
            </p>
          )}

          <Link href={bookingHref}>
            <Button
              size="lg"
              className="bp-submit-btn rounded-full px-8 py-3 text-base font-semibold shadow-lg"
            >
              <CalendarCheck className="mr-2 h-5 w-5" />
              Записаться онлайн
            </Button>
          </Link>
        </div>
      </section>

      {/* ── ГАЛЕРЕЯ ──────────────────────────────────────────── */}
      {hasGallery && (
        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <h2
              className="mb-8 text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: 'var(--bp-font-display)', color: 'var(--bp-text)' }}
            >
              Наши работы
            </h2>
            <div className="columns-2 gap-3 sm:columns-3 sm:gap-4">
              {gallery.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(i)}
                  className="group mb-3 block w-full overflow-hidden rounded-2xl sm:mb-4"
                >
                  <img
                    src={img.url}
                    alt={`${salon.name} — фото ${i + 1}`}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── УСЛУГИ ───────────────────────────────────────────── */}
      {services.length > 0 && (
        <section className="px-6 py-16 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <h2
              className="mb-8 text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: 'var(--bp-font-display)', color: 'var(--bp-text)' }}
            >
              Услуги
            </h2>
            <div className="flex flex-col divide-y"
              style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--bp-glass-border)' }}>
              {services.map((service, idx) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between px-6 py-4 transition"
                  style={{ background: idx % 2 === 0 ? 'var(--bp-glass-bg)' : 'transparent' }}
                >
                  <div>
                    <div className="font-medium" style={{ color: 'var(--bp-text)' }}>
                      {service.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-sm" style={{ color: 'var(--bp-text-dim)' }}>
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(service.duration)}
                    </div>
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--bp-accent)' }}>
                    {formatPrice(service.price)}
                  </div>
                </div>
              ))}
            </div>

            <Link href={bookingHref}>
              <Button variant="outline" className="mt-6 rounded-full px-6">
                Выбрать услугу и записаться
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* ── КОНТАКТЫ + ЧАСЫ ──────────────────────────────────── */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div
            className="grid gap-0 overflow-hidden rounded-3xl sm:grid-cols-2"
            style={{ border: '1px solid var(--bp-glass-border)' }}
          >
            {/* левая колонка — контакты */}
            <div className="flex flex-col gap-5 p-8" style={{ background: 'var(--bp-glass-bg)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--bp-text)' }}>Контакты</h3>

              {salon.address && (
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'var(--bp-accent-10)' }}
                  >
                    <MapPin className="h-4 w-4" style={{ color: 'var(--bp-accent)' }} />
                  </div>
                  <span className="pt-1.5 text-sm leading-relaxed" style={{ color: 'var(--bp-text)' }}>
                    {salon.address}
                  </span>
                </div>
              )}

              {salon.phone && (
                <a href={`tel:${salon.phone}`} className="flex items-center gap-3 group">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition"
                    style={{ background: 'var(--bp-accent-10)' }}
                  >
                    <Phone className="h-4 w-4" style={{ color: 'var(--bp-accent)' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--bp-text)' }}>{salon.phone}</span>
                </a>
              )}

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
                        style={{ background: 'var(--bp-accent-10)', color: 'var(--bp-accent)' }}
                      >
                        <Icon className="h-4 w-4" />
                        {cfg?.label ?? key}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* правая колонка — часы */}
            {hasHours && (
              <div className="flex flex-col gap-4 p-8" style={{ borderLeft: '1px solid var(--bp-glass-border)' }}>
                <h3 className="text-lg font-bold" style={{ color: 'var(--bp-text)' }}>Часы работы</h3>
                <div className="flex flex-col gap-2">
                  {salon.business_hours!
                    .slice()
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((d) => {
                      const isToday = d.day_of_week === today;
                      return (
                        <div
                          key={d.day_of_week}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
                          style={{
                            background: isToday ? 'var(--bp-accent-10)' : 'transparent',
                            fontWeight: isToday ? 600 : 400,
                          }}
                        >
                          <span style={{ color: isToday ? 'var(--bp-accent)' : 'var(--bp-text-dim)' }}>
                            {DAY_LABELS[d.day_of_week]}
                          </span>
                          <span style={{ color: isToday ? 'var(--bp-accent)' : 'var(--bp-text-dim)' }}>
                            {d.is_day_off ? 'Выходной' : `${d.time_from}–${d.time_to}`}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <Link href={bookingHref} className="mt-8 block">
            <Button size="lg" className="bp-submit-btn w-full rounded-full text-base sm:w-auto">
              <CalendarCheck className="mr-2 h-5 w-5" />
              Записаться онлайн
            </Button>
          </Link>
        </div>
      </section>

      {/* ── STICKY CTA (мобильный) ────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-safe-area-inset-bottom pb-4 sm:hidden">
        <div className="rounded-2xl p-1" style={{ background: 'var(--bp-glass-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--bp-glass-border)' }}>
          <Link href={bookingHref}>
            <Button size="lg" className="bp-submit-btn w-full rounded-xl text-base">
              <CalendarCheck className="mr-2 h-5 w-5" />
              Записаться онлайн
            </Button>
          </Link>
        </div>
      </div>
      <div className="h-24 sm:hidden" />

      {/* ── ЛАЙТБОКС ─────────────────────────────────────────── */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="bp-modal max-w-4xl border-none bg-black/90 p-2 sm:p-4">
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

              {/* счётчик */}
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
