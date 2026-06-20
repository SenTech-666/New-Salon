'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Pencil, X, CheckCircle, RotateCcw, Phone, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Ожидает',      cls: 'bg-amber-50 text-amber-600' },
  confirmed: { label: 'Подтверждено', cls: 'bg-emerald-50 text-emerald-600' },
  completed: { label: 'Завершено',    cls: 'bg-blue-50 text-blue-600' },
  cancelled: { label: 'Отменено',     cls: 'bg-red-50 text-red-500' },
};

export default function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (id: string, status: string) => {
    setLoading(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) {
      toast.error('Ошибка обновления');
    } else {
      toast.success('Статус обновлён');
      router.refresh();
    }
    setLoading(null);
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    setLoading(id);
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления');
    } else {
      toast.success('Запись удалена');
      router.refresh();
    }
    setLoading(null);
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
        <p className="text-slate-400">Записей не найдено</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Клиент</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Мастер</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Услуга</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Дата и время</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.map((b) => {
              const st = statusConfig[b.status] ?? { label: b.status, cls: 'bg-slate-50 text-slate-500' };
              return (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900 text-sm">{b.client_name}</p>
                    <a
                      href={`tel:${b.client_phone}`}
                      className="text-xs text-slate-400 hover:text-[#c9a08a] flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      {b.client_phone}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{b.masters?.name ?? '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{b.services?.name ?? '—'}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {b.services?.duration} мин
                      {' / '}
                      {b.services?.price} руб.
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{b.date}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{b.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(b.id, 'confirmed')}
                          disabled={loading === b.id}
                          title="Подтвердить"
                          className="w-8 h-8 rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {b.status !== 'cancelled' && b.status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(b.id, 'cancelled')}
                          disabled={loading === b.id}
                          title="Отменить"
                          className="w-8 h-8 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {b.status === 'cancelled' && (
                        <button
                          onClick={() => updateStatus(b.id, 'pending')}
                          disabled={loading === b.id}
                          title="Восстановить"
                          className="w-8 h-8 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-all flex items-center justify-center"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {b.status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(b.id, 'completed')}
                          disabled={loading === b.id}
                          title="Завершить"
                          className="w-8 h-8 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center text-xs font-bold"
                        >
                          OK
                        </button>
                      )}
                      <a
                        href={`/admin/bookings/${b.id}/edit`}
                        className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => deleteBooking(b.id)}
                        disabled={loading === b.id}
                        title="Удалить"
                        className="w-8 h-8 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}