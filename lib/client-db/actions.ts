'use server';

// lib/client-db/actions.ts
//
// Server Actions кабинета клиента. Каждая функция здесь сначала
// получает clientId через getCurrentClientId() (сейчас — заглушка,
// см. session.ts), а затем вызывает соответствующий запрос из
// queries.ts. Компоненты страниц вызывают ЭТИ функции, а не queries.ts
// напрямую — так при подключении настоящего auth нужно будет поменять
// только session.ts, а вызовы из UI останутся как есть.

import { revalidatePath } from 'next/cache';
import { getCurrentClientId } from './session';
import * as queries from './queries';
import type { BookingHistoryStatus } from './queries';

// ------------------------------------------------------------
// Профиль
// ------------------------------------------------------------

export async function fetchMyProfile() {
  const clientId = await getCurrentClientId();
  return queries.getClientProfile(clientId);
}

export async function updateMyProfile(data: { name: string; email: string | null; avatar_url: string | null }) {
  const clientId = await getCurrentClientId();

  if (!data.name.trim()) {
    return { error: 'Имя не может быть пустым' };
  }

  await queries.updateClientProfile(clientId, data);
  revalidatePath('/account/settings');
  return { success: true };
}

// ------------------------------------------------------------
// Настройки
// ------------------------------------------------------------

export async function fetchMySettings() {
  const clientId = await getCurrentClientId();
  return queries.getClientSettings(clientId);
}

export async function updateMySettings(
  data: Partial<{
    theme: 'light' | 'dark';
    notify_email: boolean;
    notify_sms: boolean;
    notify_push: boolean;
    notify_booking_reminder: boolean;
    notify_booking_changes: boolean;
    notify_marketing: boolean;
    reminder_hours_before: number;
  }>
) {
  const clientId = await getCurrentClientId();
  await queries.updateClientSettings(clientId, data);
  revalidatePath('/account/settings');
  return { success: true };
}

// ------------------------------------------------------------
// Избранное
// ------------------------------------------------------------

export async function fetchMyFavorites() {
  const clientId = await getCurrentClientId();
  return queries.getFavoriteSalons(clientId);
}

export async function toggleFavoriteSalon(salon: {
  salonId: string;
  name: string;
  slug: string;
  photoUrl: string | null;
}) {
  const clientId = await getCurrentClientId();
  const already = await queries.isSalonFavorite(clientId, salon.salonId);

  if (already) {
    await queries.removeFavoriteSalon(clientId, salon.salonId);
  } else {
    await queries.addFavoriteSalon(clientId, salon);
  }

  revalidatePath('/account/favorites');
  return { success: true, isFavorite: !already };
}

// ------------------------------------------------------------
// История записей
// ------------------------------------------------------------

export async function fetchMyBookingHistory(status?: BookingHistoryStatus) {
  const clientId = await getCurrentClientId();
  return queries.getBookingHistory(clientId, status ? { status } : undefined);
}

// ------------------------------------------------------------
// Уведомления
// ------------------------------------------------------------

export async function fetchMyNotifications() {
  const clientId = await getCurrentClientId();
  return queries.getNotifications(clientId);
}

export async function fetchMyUnreadNotificationsCount() {
  const clientId = await getCurrentClientId();
  return queries.getUnreadNotificationsCount(clientId);
}

export async function markNotificationAsRead(notificationId: string) {
  const clientId = await getCurrentClientId();
  await queries.markNotificationRead(notificationId, clientId);
  revalidatePath('/account/notifications');
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const clientId = await getCurrentClientId();
  await queries.markAllNotificationsRead(clientId);
  revalidatePath('/account/notifications');
  return { success: true };
}
