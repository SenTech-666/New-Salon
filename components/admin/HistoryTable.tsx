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
  pending: { label: 'Не подтверждено', class: 'bg-amber-50 text-amber-600' },
  confirmed: { label: 'Подтверждено', class: 'bg-emerald-50 text-emerald-600' },
  completed: { label: 'Завершено', class: 'bg-blue-50 text-blue-600' },
  cancelled: { label: 'Отменено', class: 'bg-red-50 text-red-500' },
};

export default function HistoryTable({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
        <p className="text-slate-400">Записей по выбранным фильтрам не найдено</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Дата и время</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Клиент</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Мастер</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Услуга</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-700">{b.date}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{b.time}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900 text-sm">{b.client_name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {b.client_phone}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-700">{b.masters?.name ?? 'Не указан'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-700">{b.services?.name ?? 'Не указана'}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
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
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[b.status]?.class ?? 'bg-slate-50 text-slate-500'}`}>
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