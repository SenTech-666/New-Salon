// lib/client-db/mock-data.ts
//
// Данные в памяти на случай, когда Postgres ещё не поднят (нет VPS).
// Используются только если CLIENT_DB_HOST не задан в .env — см.
// переключатель в queries.ts (isMockMode()). Как только появится
// реальная база и переменные подключения, этот файл просто перестаёт
// использоваться — ничего удалять не нужно.
//
// Данные намеренно "живые" (не просто заглушки вида "Тест 1"), чтобы
// сразу видно было, как выглядит заполненный интерфейс — история с
// разными статусами, прочитанные/непрочитанные уведомления и т.д.
//
// ВАЖНО: это in-memory копия, не файл и не БД. Мутации (toggle избранного,
// отметка уведомления прочитанным) живут только пока жив процесс
// Next.js dev-сервера — перезапуск sервера сбрасывает их к этим
// исходным значениям. Это ожидаемо для mock-режима.

import type {
  ClientProfile,
  ClientSettings,
  FavoriteSalon,
  BookingHistoryEntry,
  ClientNotification,
} from './queries';

export const MOCK_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

export const mockProfile: ClientProfile = {
  id: MOCK_CLIENT_ID,
  name: 'Анна Смирнова',
  phone: '+7 (916) 123-45-67',
  email: 'anna.smirnova@example.com',
  avatar_url: null,
  created_at: '2026-03-12T10:00:00.000Z',
};

export const mockSettings: ClientSettings = {
  client_id: MOCK_CLIENT_ID,
  theme: 'light',
  notify_email: true,
  notify_sms: true,
  notify_push: false,
  notify_booking_reminder: true,
  notify_booking_changes: true,
  notify_marketing: false,
  reminder_hours_before: 3,
};

// mutable массивы (не readonly) — toggle/markRead в mock-режиме реально
// меняют эти данные в памяти, чтобы интерфейс ощущался живым при клике,
// а не просто статичной картинкой.
export const mockFavorites: FavoriteSalon[] = [
  {
    id: 'fav-1',
    salon_id: 'salon-vasiliki',
    salon_name: 'Василики',
    salon_slug: 'vasiliki',
    salon_photo_url: null,
    created_at: '2026-05-02T14:00:00.000Z',
  },
  {
    id: 'fav-2',
    salon_id: 'salon-kaktus',
    salon_name: 'Каккактус',
    salon_slug: 'kak-kaktus',
    salon_photo_url: null,
    created_at: '2026-06-10T09:30:00.000Z',
  },
];

export const mockBookingHistory: BookingHistoryEntry[] = [
  {
    id: 'hist-1',
    source_booking_id: 'booking-1',
    salon_id: 'salon-vasiliki',
    salon_name: 'Василики',
    salon_slug: 'vasiliki',
    master_name: 'Елена Петрова',
    service_name: 'Маникюр классика',
    service_duration: 60,
    service_price: 2200,
    booking_date: '2026-07-03',
    booking_time: '14:00:00',
    status: 'upcoming',
  },
  {
    id: 'hist-2',
    source_booking_id: 'booking-2',
    salon_id: 'salon-kaktus',
    salon_name: 'Каккактус',
    salon_slug: 'kak-kaktus',
    master_name: 'Дмитрий Орлов',
    service_name: 'Стрижка мужская',
    service_duration: 40,
    service_price: 1500,
    booking_date: '2026-06-18',
    booking_time: '11:30:00',
    status: 'completed',
  },
  {
    id: 'hist-3',
    source_booking_id: 'booking-3',
    salon_id: 'salon-vasiliki',
    salon_name: 'Василики',
    salon_slug: 'vasiliki',
    master_name: 'Елена Петрова',
    service_name: 'Окрашивание корней',
    service_duration: 90,
    service_price: 3800,
    booking_date: '2026-05-22',
    booking_time: '16:00:00',
    status: 'cancelled',
  },
];

export const mockNotifications: ClientNotification[] = [
  {
    id: 'notif-1',
    type: 'booking_reminder',
    title: 'Напоминание о записи',
    body: 'Завтра в 14:00 у вас маникюр в Василики',
    related_booking_id: 'hist-1',
    salon_name: 'Василики',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'booking_cancelled',
    title: 'Запись отменена',
    body: 'Окрашивание 22 мая отменено салоном — мастер заболел',
    related_booking_id: 'hist-3',
    salon_name: 'Василики',
    is_read: false,
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    type: 'review_request',
    title: 'Как всё прошло?',
    body: 'Оставьте отзыв о визите в Каккактус — это поможет другим клиентам',
    related_booking_id: 'hist-2',
    salon_name: 'Каккактус',
    is_read: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];