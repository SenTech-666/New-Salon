import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import BookingsTable from '@/components/admin/BookingsTable';

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; master?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('bookings')
    .select('*, masters(name, specialty), services(name, price, duration)')
    .order('date', { ascending: false })
    .order('time', { ascending: true });

  if (params.date) query = query.eq('date', params.date);
  if (params.master) query = query.eq('master_id', params.master);
  if (params.status) query = query.eq('status', params.status);

  const { data: bookings } = await query;
  const { data: masters } = await supabase.from('masters').select('id, name').eq('is_active', true);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Записи</h1>
          <p className="text-slate-500 mt-1">{bookings?.length ?? 0} записей</p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="flex items-center gap-2 bg-[#c9a08a] hover:bg-[#b38f79] text-white px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Новая запись
        </Link>
      </div>

      {/* Фильтры */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <form className="flex gap-3 flex-wrap">
          <input
            name="date"
            type="date"
            defaultValue={params.date}
            className="h-10 px-4 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#c9a08a]"
          />
          <select
            name="master"
            defaultValue={params.master}
            className="h-10 px-4 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#c9a08a]"
          >
            <option value="">Все мастера</option>
            {masters?.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status}
            className="h-10 px-4 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#c9a08a]"
          >
            <option value="">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="confirmed">Подтверждено</option>
            <option value="cancelled">Отменено</option>
            <option value="completed">Завершено</option>
          </select>
          <button
            type="submit"
            className="h-10 px-5 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-all"
          >
            Применить
          </button>
          <Link
            href="/admin/bookings"
            className="h-10 px-5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all flex items-center"
          >
            Сбросить
          </Link>
        </form>
      </div>

      <BookingsTable bookings={bookings ?? []} />
    </div>
  );
}