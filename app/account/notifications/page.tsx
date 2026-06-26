// app/account/notifications/page.tsx

import { Bell, CalendarCheck, CalendarX, CalendarClock, Star, Info } from 'lucide-react';
import { fetchMyNotifications } from '@/lib/client-db/actions';
import { MarkAllReadButton, NotificationRow } from './notifications-client';

const TYPE_ICON: Record<string, React.ElementType> = {
  booking_reminder: CalendarClock,
  booking_confirmed: CalendarCheck,
  booking_cancelled: CalendarX,
  booking_rescheduled: CalendarClock,
  review_request: Star,
  system: Info,
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export default async function NotificationsPage() {
  const notifications = await fetchMyNotifications();
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1
          className="text-3xl sm:text-4xl font-bold italic"
          style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
        >
          Уведомления
        </h1>
        {hasUnread && <MarkAllReadButton />}
      </div>
      <p className="text-sm mb-7" style={{ color: 'var(--landing-text-dim)' }}>
        Напоминания о записях и важные изменения от салонов
      </p>

      {notifications.length === 0 ? (
        <div
          className="flex flex-col items-center text-center py-16 rounded-3xl"
          style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-12)' }}
        >
          <Bell className="w-10 h-10 mb-3" style={{ color: 'var(--landing-accent)' }} />
          <p className="font-medium" style={{ color: 'var(--landing-text)' }}>Уведомлений нет</p>
          <p className="text-sm mt-1" style={{ color: 'var(--landing-text-faint)' }}>
            Здесь появятся напоминания о ваших записях
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Info;
            return (
              <NotificationRow key={n.id} id={n.id} isRead={n.is_read}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--landing-accent-10)' }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: 'var(--landing-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--landing-text)' }}>{n.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--landing-text-dim)' }}>{n.body}</p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--landing-text-faint)' }}>
                    {n.salon_name ? `${n.salon_name} · ` : ''}{timeAgo(n.created_at)}
                  </p>
                </div>
              </NotificationRow>
            );
          })}
        </div>
      )}
    </div>
  );
}
