// app/account/layout.tsx
//
// Общий каркас кабинета клиента: боковая навигация (десктоп) /
// нижняя панель (мобильный) между четырьмя разделами. Использует
// ту же тему --landing-*, что Storefront и BookingPage — кабинет
// клиента продолжает тот же визуальный путь, а не начинает новый.
//
// Доступ пока не проверяется (нет реального auth) — см.
// lib/client-db/session.ts. Когда появится auth, проверку "залогинен
// ли человек" разумно добавить именно сюда, в layout, одним местом
// для всех страниц /account/*.

import Link from 'next/link';
import { CalendarClock, Heart, Bell, Settings, User } from 'lucide-react';
import { fetchMyUnreadNotificationsCount, fetchMyProfile } from '@/lib/client-db/actions';

const NAV_ITEMS = [
  { href: '/account', label: 'Обзор', icon: User, exact: true },
  { href: '/account/history', label: 'История записей', icon: CalendarClock },
  { href: '/account/favorites', label: 'Избранные салоны', icon: Heart },
  { href: '/account/notifications', label: 'Уведомления', icon: Bell, showBadge: true },
  { href: '/account/settings', label: 'Настройки', icon: Settings },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [profile, unreadCount] = await Promise.all([
    fetchMyProfile(),
    fetchMyUnreadNotificationsCount(),
  ]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--landing-bg)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ── Сайдбар (десктоп) ── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: 'var(--landing-accent-12)' }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span
                    style={{ color: 'var(--landing-accent)', fontFamily: 'var(--landing-font-display)', fontSize: 18, fontWeight: 700 }}
                  >
                    {profile?.name?.[0] ?? '?'}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--landing-text)' }}>
                  {profile?.name ?? 'Гость'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--landing-text-faint)' }}>
                  {profile?.phone ?? ''}
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group"
                    style={{ color: 'var(--landing-text-dim)' }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--landing-accent)' }} />
                    <span className="flex-1">{item.label}</span>
                    {item.showBadge && unreadCount > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'var(--landing-accent)', color: 'var(--landing-on-accent)' }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* ── Контент ── */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</main>
        </div>
      </div>

      {/* ── Нижняя навигация (мобильный) ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2"
        style={{
          background: 'color-mix(in srgb, var(--landing-surface) 95%, transparent)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--landing-accent-15)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl"
            >
              <Icon className="w-5 h-5" style={{ color: 'var(--landing-text-dim)' }} />
              {item.showBadge && unreadCount > 0 && (
                <span
                  className="absolute top-0 right-0 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                  style={{ background: 'var(--landing-accent)', color: 'var(--landing-on-accent)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="text-[10px]" style={{ color: 'var(--landing-text-faint)' }}>
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
