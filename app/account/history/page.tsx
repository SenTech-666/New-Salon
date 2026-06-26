// app/account/history/page.tsx

import Link from 'next/link';
import { Clock, MapPin, CalendarX2 } from 'lucide-react';
import { fetchMyBookingHistory } from '@/lib/client-db/actions';
import type { BookingHistoryStatus } from '@/lib/client-db/queries';

const STATUS_CONFIG: Record<BookingHistoryStatus, { label: string; bg: string; text: string }> = {
  upcoming:  { label: 'Скоро',     bg: 'var(--landing-accent-12)',  text: 'var(--landing-accent-dark)' },
  completed: { label: 'Завершено', bg: 'var(--landing-success-bg)', text: 'var(--landing-success-text)' },
  cancelled: { label: 'Отменено',  bg: 'rgba(192, 82, 74, 0.10)',   text: '#c0524a' },
  no_show:   { label: 'Не пришёл', bg: 'var(--landing-bg-alt)',     text: 'var(--landing-text-faint)' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function BookingHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: BookingHistoryStatus }>;
}) {
  const { status } = await searchParams;
  const bookings = await fetchMyBookingHistory(status);

  const filters: Array<{ value: BookingHistoryStatus | undefined; label: string }> = [
    { value: undefined, label: 'Все' },
    { value: 'upcoming', label: 'Скоро' },
    { value: 'completed', label: 'Завершённые' },
    { value: 'cancelled', label: 'Отменённые' },
  ];

  return (
    <div>
      <h1
        className="text-3xl sm:text-4xl font-bold italic mb-2"
        style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
      >
        История записей
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--landing-text-dim)' }}>
        Все ваши визиты и предстоящие записи в одном месте
      </p>

      {/* Фильтры по статусу */}
      <div className="flex flex-wrap gap-2 mb-7">
        {filters.map((f) => {
          const active = status === f.value;
          const href = f.value ? `/account/history?status=${f.value}` : '/account/history';
          return (
            <Link
              key={f.label}
              href={href}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={
                active
                  ? { background: 'var(--landing-accent)', color: 'var(--landing-on-accent)' }
                  : { background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-15)', color: 'var(--landing-text-dim)' }
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {bookings.length === 0 ? (
        <div
          className="flex flex-col items-center text-center py-16 rounded-3xl"
          style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-12)' }}
        >
          <CalendarX2 className="w-10 h-10 mb-3" style={{ color: 'var(--landing-accent)' }} />
          <p className="font-medium" style={{ color: 'var(--landing-text)' }}>Записей пока нет</p>
          <p className="text-sm mt-1" style={{ color: 'var(--landing-text-faint)' }}>
            Здесь появится история, когда вы запишетесь в салон
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => {
            const cfg = STATUS_CONFIG[b.status];
            return (
              <Link
                key={b.id}
                href={`/${b.salon_slug}`}
                className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-12)' }}
              >
                <div
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-xl flex-shrink-0"
                  style={{ background: 'var(--landing-accent-10)' }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{ color: 'var(--landing-accent)', fontFamily: 'var(--landing-font-display)' }}
                  >
                    {new Date(b.booking_date + 'T00:00:00').getDate()}
                  </span>
                  <span className="text-[10px] uppercase" style={{ color: 'var(--landing-text-faint)' }}>
                    {new Date(b.booking_date + 'T00:00:00').toLocaleDateString('ru-RU', { month: 'short' })}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}>
                    {b.salon_name}
                  </p>
                  <p className="text-sm truncate" style={{ color: 'var(--landing-text-dim)' }}>{b.service_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--landing-text-faint)' }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.booking_time.slice(0, 5)}</span>
                    {b.master_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.master_name}</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: cfg.bg, color: cfg.text }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--landing-accent)' }}>
                    {new Intl.NumberFormat('ru-RU').format(b.service_price)} ₽
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
