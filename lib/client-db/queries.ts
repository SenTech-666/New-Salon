// lib/client-db/queries.ts
//
// Все запросы к данным кабинета клиента в одном месте. Каждая функция
// СНАЧАЛА проверяет isMockMode() — если переменные подключения к
// Postgres (CLIENT_DB_HOST) не заданы в .env (нет VPS/денег пока),
// возвращает/мутирует данные из mock-data.ts вместо реального SQL.
// Как только появятся переменные подключения — переключение на
// настоящую базу происходит само, без правок кода здесь или в
// actions.ts/страницах.

import { getClientPool } from './pool';
import * as mock from './mock-data';

function isMockMode(): boolean {
  return !process.env.CLIENT_DB_HOST;
}

// ------------------------------------------------------------
// Типы — отражают структуру таблиц из 001_init_client_schema.sql
// ------------------------------------------------------------

export type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type ClientSettings = {
  client_id: string;
  theme: 'light' | 'dark';
  notify_email: boolean;
  notify_sms: boolean;
  notify_push: boolean;
  notify_booking_reminder: boolean;
  notify_booking_changes: boolean;
  notify_marketing: boolean;
  reminder_hours_before: number;
};

export type FavoriteSalon = {
  id: string;
  salon_id: string;
  salon_name: string;
  salon_slug: string;
  salon_photo_url: string | null;
  created_at: string;
};

export type BookingHistoryStatus = 'upcoming' | 'completed' | 'cancelled' | 'no_show';

export type BookingHistoryEntry = {
  id: string;
  source_booking_id: string;
  salon_id: string;
  salon_name: string;
  salon_slug: string;
  master_name: string | null;
  service_name: string;
  service_duration: number;
  service_price: number;
  booking_date: string;
  booking_time: string;
  status: BookingHistoryStatus;
};

export type ClientNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  related_booking_id: string | null;
  salon_name: string | null;
  is_read: boolean;
  created_at: string;
};

// ------------------------------------------------------------
// Профиль
// ------------------------------------------------------------

export async function getClientProfile(clientId: string): Promise<ClientProfile | null> {
  if (isMockMode()) return mock.mockProfile;

  const pool = getClientPool();
  const { rows } = await pool.query<ClientProfile>(
    `select id, name, phone, email, avatar_url, created_at
     from clients
     where id = $1`,
    [clientId]
  );
  return rows[0] ?? null;
}

export async function updateClientProfile(
  clientId: string,
  data: { name: string; email: string | null; avatar_url: string | null }
): Promise<void> {
  if (isMockMode()) {
    mock.mockProfile.name = data.name;
    mock.mockProfile.email = data.email;
    mock.mockProfile.avatar_url = data.avatar_url;
    return;
  }

  const pool = getClientPool();
  await pool.query(
    `update clients
     set name = $2, email = $3, avatar_url = $4
     where id = $1`,
    [clientId, data.name, data.email, data.avatar_url]
  );
}

// ------------------------------------------------------------
// Настройки
// ------------------------------------------------------------

export async function getClientSettings(clientId: string): Promise<ClientSettings | null> {
  if (isMockMode()) return mock.mockSettings;

  const pool = getClientPool();
  const { rows } = await pool.query<ClientSettings>(
    `select client_id, theme, notify_email, notify_sms, notify_push,
            notify_booking_reminder, notify_booking_changes, notify_marketing,
            reminder_hours_before
     from client_settings
     where client_id = $1`,
    [clientId]
  );
  return rows[0] ?? null;
}

export async function updateClientSettings(
  clientId: string,
  data: Partial<Omit<ClientSettings, 'client_id'>>
): Promise<void> {
  if (isMockMode()) {
    Object.assign(mock.mockSettings, data);
    return;
  }

  const pool = getClientPool();
  const fields = Object.keys(data) as Array<keyof typeof data>;
  if (fields.length === 0) return;

  const setClauses = fields.map((field, i) => `${field} = $${i + 2}`);
  const values = fields.map((field) => data[field]);

  await pool.query(
    `update client_settings set ${setClauses.join(', ')} where client_id = $1`,
    [clientId, ...values]
  );
}

// ------------------------------------------------------------
// Избранные салоны
// ------------------------------------------------------------

export async function getFavoriteSalons(clientId: string): Promise<FavoriteSalon[]> {
  if (isMockMode()) {
    return [...mock.mockFavorites].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const pool = getClientPool();
  const { rows } = await pool.query<FavoriteSalon>(
    `select id, salon_id, salon_name, salon_slug, salon_photo_url, created_at
     from favorite_salons
     where client_id = $1
     order by created_at desc`,
    [clientId]
  );
  return rows;
}

export async function isSalonFavorite(clientId: string, salonId: string): Promise<boolean> {
  if (isMockMode()) {
    return mock.mockFavorites.some((f) => f.salon_id === salonId);
  }

  const pool = getClientPool();
  const { rows } = await pool.query(
    `select 1 from favorite_salons where client_id = $1 and salon_id = $2`,
    [clientId, salonId]
  );
  return rows.length > 0;
}

export async function addFavoriteSalon(
  clientId: string,
  salon: { salonId: string; name: string; slug: string; photoUrl: string | null }
): Promise<void> {
  if (isMockMode()) {
    if (mock.mockFavorites.some((f) => f.salon_id === salon.salonId)) return;
    mock.mockFavorites.push({
      id: `fav-${Date.now()}`,
      salon_id: salon.salonId,
      salon_name: salon.name,
      salon_slug: salon.slug,
      salon_photo_url: salon.photoUrl,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const pool = getClientPool();
  await pool.query(
    `insert into favorite_salons (client_id, salon_id, salon_name, salon_slug, salon_photo_url)
     values ($1, $2, $3, $4, $5)
     on conflict (client_id, salon_id) do nothing`,
    [clientId, salon.salonId, salon.name, salon.slug, salon.photoUrl]
  );
}

export async function removeFavoriteSalon(clientId: string, salonId: string): Promise<void> {
  if (isMockMode()) {
    const idx = mock.mockFavorites.findIndex((f) => f.salon_id === salonId);
    if (idx !== -1) mock.mockFavorites.splice(idx, 1);
    return;
  }

  const pool = getClientPool();
  await pool.query(
    `delete from favorite_salons where client_id = $1 and salon_id = $2`,
    [clientId, salonId]
  );
}

// ------------------------------------------------------------
// История записей
// ------------------------------------------------------------

export async function getBookingHistory(
  clientId: string,
  filter?: { status?: BookingHistoryStatus }
): Promise<BookingHistoryEntry[]> {
  if (isMockMode()) {
    const all = [...mock.mockBookingHistory].sort((a, b) =>
      `${b.booking_date}T${b.booking_time}`.localeCompare(`${a.booking_date}T${a.booking_time}`)
    );
    return filter?.status ? all.filter((b) => b.status === filter.status) : all;
  }

  const pool = getClientPool();

  if (filter?.status) {
    const { rows } = await pool.query<BookingHistoryEntry>(
      `select id, source_booking_id, salon_id, salon_name, salon_slug,
              master_name, service_name, service_duration, service_price,
              booking_date, booking_time, status
       from booking_history
       where client_id = $1 and status = $2
       order by booking_date desc, booking_time desc`,
      [clientId, filter.status]
    );
    return rows;
  }

  const { rows } = await pool.query<BookingHistoryEntry>(
    `select id, source_booking_id, salon_id, salon_name, salon_slug,
            master_name, service_name, service_duration, service_price,
            booking_date, booking_time, status
     from booking_history
     where client_id = $1
     order by booking_date desc, booking_time desc`,
    [clientId]
  );
  return rows;
}

/**
 * Создаёт снимок записи в истории клиента. Вызывается из кода
 * бронирования (там, где сейчас insert в Supabase bookings) сразу
 * после успешного создания записи в Supabase — это ДОПОЛНИТЕЛЬНАЯ
 * запись в другую базу, а не замена. on conflict защищает от
 * дублирования снимка, если этот код вызовется повторно для той же
 * source_booking_id (например, при ретрае сетевого запроса).
 */
export async function createBookingHistorySnapshot(entry: {
  clientId: string;
  sourceBookingId: string;
  salonId: string;
  salonName: string;
  salonSlug: string;
  masterName: string | null;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  bookingDate: string;
  bookingTime: string;
}): Promise<void> {
  if (isMockMode()) {
    if (mock.mockBookingHistory.some((b) => b.source_booking_id === entry.sourceBookingId)) return;
    mock.mockBookingHistory.push({
      id: `hist-${Date.now()}`,
      source_booking_id: entry.sourceBookingId,
      salon_id: entry.salonId,
      salon_name: entry.salonName,
      salon_slug: entry.salonSlug,
      master_name: entry.masterName,
      service_name: entry.serviceName,
      service_duration: entry.serviceDuration,
      service_price: entry.servicePrice,
      booking_date: entry.bookingDate,
      booking_time: entry.bookingTime,
      status: 'upcoming',
    });
    return;
  }

  const pool = getClientPool();
  await pool.query(
    `insert into booking_history (
       client_id, source_booking_id, salon_id, salon_name, salon_slug,
       master_name, service_name, service_duration, service_price,
       booking_date, booking_time, status
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'upcoming')
     on conflict (source_booking_id) do nothing`,
    [
      entry.clientId, entry.sourceBookingId, entry.salonId, entry.salonName, entry.salonSlug,
      entry.masterName, entry.serviceName, entry.serviceDuration, entry.servicePrice,
      entry.bookingDate, entry.bookingTime,
    ]
  );
}

export async function updateBookingHistoryStatus(
  sourceBookingId: string,
  status: BookingHistoryStatus
): Promise<void> {
  if (isMockMode()) {
    const row = mock.mockBookingHistory.find((b) => b.source_booking_id === sourceBookingId);
    if (row) row.status = status;
    return;
  }

  const pool = getClientPool();
  await pool.query(
    `update booking_history set status = $2 where source_booking_id = $1`,
    [sourceBookingId, status]
  );
}

// ------------------------------------------------------------
// Уведомления
// ------------------------------------------------------------

export async function getNotifications(clientId: string, limit = 50): Promise<ClientNotification[]> {
  if (isMockMode()) {
    return [...mock.mockNotifications]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  const pool = getClientPool();
  const { rows } = await pool.query<ClientNotification>(
    `select id, type, title, body, related_booking_id, salon_name, is_read, created_at
     from client_notifications
     where client_id = $1
     order by created_at desc
     limit $2`,
    [clientId, limit]
  );
  return rows;
}

export async function getUnreadNotificationsCount(clientId: string): Promise<number> {
  if (isMockMode()) {
    return mock.mockNotifications.filter((n) => !n.is_read).length;
  }

  const pool = getClientPool();
  const { rows } = await pool.query<{ count: string }>(
    `select count(*) from client_notifications where client_id = $1 and is_read = false`,
    [clientId]
  );
  return Number(rows[0]?.count ?? 0);
}

export async function markNotificationRead(notificationId: string, clientId: string): Promise<void> {
  if (isMockMode()) {
    const row = mock.mockNotifications.find((n) => n.id === notificationId);
    if (row) row.is_read = true;
    return;
  }

  const pool = getClientPool();
  await pool.query(
    `update client_notifications set is_read = true where id = $1 and client_id = $2`,
    [notificationId, clientId]
  );
}

export async function markAllNotificationsRead(clientId: string): Promise<void> {
  if (isMockMode()) {
    mock.mockNotifications.forEach((n) => { n.is_read = true; });
    return;
  }

  const pool = getClientPool();
  await pool.query(
    `update client_notifications set is_read = true where client_id = $1 and is_read = false`,
    [clientId]
  );
}

export async function createNotification(entry: {
  clientId: string;
  type: string;
  title: string;
  body: string;
  relatedBookingId?: string | null;
  salonName?: string | null;
}): Promise<void> {
  if (isMockMode()) {
    mock.mockNotifications.push({
      id: `notif-${Date.now()}`,
      type: entry.type,
      title: entry.title,
      body: entry.body,
      related_booking_id: entry.relatedBookingId ?? null,
      salon_name: entry.salonName ?? null,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const pool = getClientPool();
  await pool.query(
    `insert into client_notifications (client_id, type, title, body, related_booking_id, salon_name)
     values ($1, $2, $3, $4, $5, $6)`,
    [entry.clientId, entry.type, entry.title, entry.body, entry.relatedBookingId ?? null, entry.salonName ?? null]
  );
}