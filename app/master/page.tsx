// app/master/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function MasterBookingsPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, services(name, duration, price)')
    .gte('date', today)
    .order('date')
    .order('time');

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Мои записи</h1>
      <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50">
        {bookings?.length === 0 && (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">Записей пока нет</p>
        )}
        {bookings?.map((b: any) => (
          <div key={b.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 text-sm">{b.client_name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{b.services?.name}</p>
            </div>
            <p className="text-sm text-slate-700">{b.date} в {b.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}