'use client';

// app/account/notifications/notifications-client.tsx
//
// Маленькие клиентские куски страницы уведомлений: кнопка "прочитать
// всё" и сама строка-уведомление (отмечается прочитанной по клику).
// Вынесены в отдельный файл, потому что сама страница — серверный
// компонент (там делается основной fetch), а интерактивность нужна
// только в этих двух местах.

import { useState, useTransition } from 'react';
import { CheckCheck } from 'lucide-react';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/client-db/actions';

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => markAllNotificationsAsRead())}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-opacity disabled:opacity-50"
      style={{ background: 'var(--landing-accent-10)', color: 'var(--landing-accent-dark)' }}
    >
      <CheckCheck className="w-3.5 h-3.5" />
      Прочитать всё
    </button>
  );
}

export function NotificationRow({
  id,
  isRead,
  children,
}: {
  id: string;
  isRead: boolean;
  children: React.ReactNode;
}) {
  const [localRead, setLocalRead] = useState(isRead);
  const [, startTransition] = useTransition();

  function handleClick() {
    if (localRead) return;
    setLocalRead(true); // оптимистично — не ждём ответ сервера, чтобы точка погасла сразу
    startTransition(() => markNotificationAsRead(id));
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-start gap-3 text-left rounded-2xl px-4 py-3.5 transition-colors w-full"
      style={{
        background: localRead ? 'var(--landing-surface)' : 'var(--landing-accent-10)',
        border: '1px solid var(--landing-accent-12)',
      }}
    >
      {children}
      {!localRead && (
        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--landing-accent)' }} />
      )}
    </button>
  );
}
