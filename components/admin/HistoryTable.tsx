import { Phone, Clock, Wallet } from 'lucide-react';

type Booking = {
  id: string;
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
  status: string;
  masters: { name: string; specialty: string } | null;
  services: { name: string; price: number; duration: number } | null;
};

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: 'Не подтверждено', class: 'bg-accent text-accent-foreground' },
  confirmed: { label: 'Подтверждено', class: 'bg-success/15 text-success' },
  completed: { label: 'Завершено', class: 'bg-blue-500/15 text-blue-500 dark:text-blue-400' },
  cancelled: { label: 'Отменено', class: 'bg-destructive/15 text-destructive' },
};

export default function HistoryTable({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-card rounded-3xl border border-border p-16 text-center">
        <p className="text-muted-foreground">Записей по выбранным фильтрам не найдено</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата и время</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Клиент</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Мастер</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Услуга</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm text-card-foreground/80">{b.date}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.time}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-card-foreground text-sm">{b.client_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {b.client_phone}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-card-foreground/80">{b.masters?.name ?? 'Не указан'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-card-foreground/80">{b.services?.name ?? 'Не указана'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {b.services?.duration} мин
                    </span>
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      {b.services?.price} ₽
                    </span>
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[b.status]?.class ?? 'bg-muted text-muted-foreground'}`}>
                    {statusConfig[b.status]?.label ?? b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}