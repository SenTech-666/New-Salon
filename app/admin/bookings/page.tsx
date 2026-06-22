import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
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

  if (params.date)   query = query.eq('date', params.date);
  if (params.master) query = query.eq('master_id', params.master);
  if (params.status) query = query.eq('status', params.status);

  const { data: bookings } = await query;
  const { data: masters } = await supabase.from('masters').select('id, name').eq('is_active', true);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Записи</h1>
          <p className="text-muted-foreground mt-1">{bookings?.length ?? 0} записей</p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Новая запись
        </Link>
      </div>

      {/* Фильтры */}
      <form className="flex gap-3 mb-6 flex-wrap">
        <input
          name="date"
          type="date"
          defaultValue={params.date}
          className="h-10 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
        />
        <select
          name="master"
          defaultValue={params.master}
          className="h-10 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">Все мастера</option>
          {masters?.map((m: any) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status}
          className="h-10 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="confirmed">Подтверждено</option>
          <option value="cancelled">Отменено</option>
          <option value="completed">Завершено</option>
        </select>
        <button
          type="submit"
          className="h-10 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all"
        >
          Применить
        </button>
        <Link
          href="/admin/bookings"
          className="h-10 px-5 rounded-2xl border border-border text-card-foreground/80 text-sm font-medium hover:bg-muted transition-all flex items-center"
        >
          Сбросить
        </Link>
      </form>

      <BookingsTable bookings={bookings ?? []} />
    </div>
  );
}