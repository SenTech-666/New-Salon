// lib/booking-status.ts
// Единый источник цветов и подписей статусов записи.
// Импортируется в BookingsTable, HistoryTable, AdminDashboard и других
// компонентах, чтобы не дублировать логику и не расходиться в переводах.

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface StatusConfig {
  label: string;
  cls: string; // Tailwind-классы для badge
}

const STATUS_MAP: Record<string, StatusConfig> = {
  pending:   { label: 'Ожидает',      cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  confirmed: { label: 'Подтверждено', cls: 'bg-success/15 text-success' },
  completed: { label: 'Завершено',    cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  cancelled: { label: 'Отменено',     cls: 'bg-destructive/15 text-destructive' },
};

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_MAP[status] ?? { label: status, cls: 'bg-muted text-muted-foreground' };
}