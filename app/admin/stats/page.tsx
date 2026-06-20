import { createClient } from '@/lib/supabase/server';
import StatsDateRange from '@/components/admin/StatsDateRange';
import StatsOverview from '@/components/admin/StatsOverview';
import MastersRanking from '@/components/admin/MastersRanking';
import WeekdayHeatmap from '@/components/admin/WeekdayHeatmap';

type SearchParams = Promise<{ from?: string; to?: string }>;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];
  const from = params.from ?? daysAgo(30);
  const to = params.to ?? today;

  // Текущий период — все записи (для счётчика клиентов/отмен) и завершённые (для денег)
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('*, masters(id, name), services(id, name, price, duration)')
    .gte('date', from)
    .lte('date', to);

  // Предыдущий период такой же длины — для сравнения
  const rangeDays = Math.max(
    1,
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000)
  );
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - rangeDays);

  const { data: prevBookings } = await supabase
    .from('bookings')
    .select('status, services(price)')
    .gte('date', prevFrom.toISOString().split('T')[0])
    .lte('date', prevTo.toISOString().split('T')[0]);

  const bookings = allBookings ?? [];
  const completed = bookings.filter((b) => b.status === 'completed');
  const cancelled = bookings.filter((b) => b.status === 'cancelled');

  const revenue = completed.reduce((sum, b) => sum + (b.services?.price ?? 0), 0);
  const prevCompleted = (prevBookings ?? []).filter((b) => b.status === 'completed');
  const prevRevenue = prevCompleted.reduce((sum, b: any) => sum + (b.services?.price ?? 0), 0);

  const uniqueClients = new Set(bookings.map((b) => b.client_phone)).size;
  const prevUniqueClients = new Set(
    (prevBookings ?? []).map((b: any) => b.client_phone)
  ).size;

  const avgTicket = completed.length > 0 ? Math.round(revenue / completed.length) : 0;
  const cancelRate = bookings.length > 0 ? Math.round((cancelled.length / bookings.length) * 100) : 0;

  // Топ услуга по выручке
  const revenueByService = new Map<string, { name: string; total: number }>();
  completed.forEach((b) => {
    if (!b.services) return;
    const key = b.services.id;
    const prev = revenueByService.get(key) ?? { name: b.services.name, total: 0 };
    prev.total += b.services.price;
    revenueByService.set(key, prev);
  });
  const topService = [...revenueByService.values()].sort((a, b) => b.total - a.total)[0];

  // Рейтинг по мастерам
  const masterStats = new Map<
    string,
    { name: string; bookingsCount: number; revenue: number }
  >();
  completed.forEach((b) => {
    if (!b.masters) return;
    const key = b.masters.id;
    const prev = masterStats.get(key) ?? { name: b.masters.name, bookingsCount: 0, revenue: 0 };
    prev.bookingsCount += 1;
    prev.revenue += b.services?.price ?? 0;
    masterStats.set(key, prev);
  });
  const ranking = [...masterStats.values()].sort((a, b) => b.revenue - a.revenue);

  // Загруженность по дням недели (на основе всех записей, не только completed)
  const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const weekdayCounts = new Array(7).fill(0);
  bookings.forEach((b) => {
    const jsDay = new Date(b.date).getDay(); // 0 = Sunday
    const idx = jsDay === 0 ? 6 : jsDay - 1; // переводим в Пн=0..Вс=6
    weekdayCounts[idx] += 1;
  });

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Статистика</h1>
          <p className="text-slate-500 mt-1">
            {new Date(from).toLocaleDateString('ru-RU')} — {new Date(to).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <StatsDateRange from={from} to={to} />
      </div>

      <StatsOverview
        revenue={revenue}
        prevRevenue={prevRevenue}
        clients={uniqueClients}
        prevClients={prevUniqueClients}
        avgTicket={avgTicket}
        cancelRate={cancelRate}
        topService={topService?.name ?? '—'}
        completedCount={completed.length}
      />

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 mt-6">
        <MastersRanking ranking={ranking} />
        <WeekdayHeatmap labels={weekdayLabels} counts={weekdayCounts} />
      </div>
    </div>
  );
}