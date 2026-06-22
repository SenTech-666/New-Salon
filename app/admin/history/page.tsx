import { createClient } from '@/lib/supabase/server';
import HistoryFilters from '@/components/admin/HistoryFilters';
import HistoryTable from '@/components/admin/HistoryTable';

type SearchParams = Promise<{
  date_from?: string;
  date_to?: string;
  master?: string;
  service?: string;
  name?: string;
  phone?: string;
}>;

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('bookings')
    .select('*, masters(name, specialty), services(name, price, duration)')
    .lt('date', today)
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  if (params.date_from) query = query.gte('date', params.date_from);
  if (params.date_to)   query = query.lte('date', params.date_to);
  if (params.master)    query = query.eq('master_id', params.master);
  if (params.service)   query = query.eq('service_id', params.service);
  if (params.name)      query = query.ilike('client_name', `%${params.name}%`);
  if (params.phone)     query = query.ilike('client_phone', `%${params.phone}%`);

  const { data: bookings } = await query;
  const { data: masters }  = await supabase.from('masters').select('id, name').order('name');
  const { data: services } = await supabase.from('services').select('id, name').order('name');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">История записей</h1>
        <p className="text-muted-foreground mt-1">
          {bookings?.length ?? 0} записей до сегодняшнего дня
        </p>
      </div>

      <HistoryFilters
        masters={masters ?? []}
        services={services ?? []}
        current={params}
      />

      <HistoryTable bookings={bookings ?? []} />
    </div>
  );
}