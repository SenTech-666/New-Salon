// app/account/page.tsx
//
// Обзорная страница кабинета — то, что человек видит первым делом:
// ближайшая запись, последние уведомления, пара избранных салонов.
// Не дублирует логику остальных страниц, только показывает срез из
// тех же Server Actions и даёт ссылки "смотреть всё".

import Link from 'next/link';
import { ArrowRight, CalendarClock, Heart, Bell } from 'lucide-react';
import {
  fetchMyBookingHistory,
  fetchMyFavorites,
  fetchMyNotifications,
} from '@/lib/client-db/actions';

export default async function AccountOverviewPage() {
  const [upcoming, favorites, notifications] = await Promise.all([
    fetchMyBookingHistory('upcoming'),
    fetchMyFavorites(),
    fetchMyNotifications(),
  ]);

  const nextBooking = upcoming[0];
  const recentNotifications = notifications.slice(0, 3);
  const topFavorites = favorites.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-3xl sm:text-4xl font-bold italic mb-2"
          style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
        >
          Добро пожаловать
        </h1>
        <p className="text-sm" style={{ color: 'var(--landing-text-dim)' }}>
          Здесь собрано всё, что касается ваших записей
        </p>
      </div>

      {/* Ближайшая запись */}
      {nextBooking ? (
        <Link
          href={`/${nextBooking.salon_slug}`}
          className="flex items-center gap-4 rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, var(--landing-accent-10), var(--landing-surface))`,
            border: '1px solid var(--landing-accent-20)',
          }}
        >
          <div
            className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
            style={{ background: 'var(--landing-surface)' }}
          >
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--landing-accent)', fontFamily: 'var(--landing-font-display)' }}
            >
              {new Date(nextBooking.booking_date + 'T00:00:00').getDate()}
            </span>
            <span className="text-[10px] uppercase" style={{ color: 'var(--landing-text-faint)' }}>
              {new Date(nextBooking.booking_date + 'T00:00:00').toLocaleDateString('ru-RU', { month: 'short' })}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--landing-accent)' }}>
              Ваша ближайшая запись
            </p>
            <p className="font-semibold" style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}>
              {nextBooking.salon_name} · {nextBooking.service_name}
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--landing-text-dim)' }}>
              в {nextBooking.booking_time.slice(0, 5)}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--landing-accent)' }} />
        </Link>
      ) : (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-12)' }}
        >
          <p className="text-sm" style={{ color: 'var(--landing-text-faint)' }}>Нет предстоящих записей</p>
          <Link href="/" className="text-sm font-semibold mt-2 inline-block" style={{ color: 'var(--landing-accent)' }}>
            Найти салон →
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Уведомления */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-12)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: 'var(--landing-accent)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--landing-text)' }}>Уведомления</h3>
            </div>
            <Link href="/account/notifications" className="text-xs font-medium" style={{ color: 'var(--landing-accent)' }}>
              Все
            </Link>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--landing-text-faint)' }}>Пока нет уведомлений</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentNotifications.map((n) => (
                <div key={n.id} className="flex items-start gap-2">
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--landing-accent)' }} />}
                  <p className="text-sm" style={{ color: n.is_read ? 'var(--landing-text-faint)' : 'var(--landing-text)' }}>
                    {n.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Избранное */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-12)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" style={{ color: 'var(--landing-accent)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--landing-text)' }}>Избранное</h3>
            </div>
            <Link href="/account/favorites" className="text-xs font-medium" style={{ color: 'var(--landing-accent)' }}>
              Все
            </Link>
          </div>
          {topFavorites.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--landing-text-faint)' }}>Список избранного пуст</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topFavorites.map((s) => (
                <Link key={s.id} href={`/${s.salon_slug}`} className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>
                  {s.salon_name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Link
        href="/account/history"
        className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium"
        style={{ background: 'var(--landing-bg-alt)', color: 'var(--landing-text-dim)' }}
      >
        <CalendarClock className="w-4 h-4" />
        Смотреть всю историю записей
      </Link>
    </div>
  );
}
