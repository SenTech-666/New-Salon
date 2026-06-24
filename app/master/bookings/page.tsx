import { createClient } from '@/lib/supabase/server';
import MasterBookingCard from '@/components/master/MasterBookingCard';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MasterDatePicker from '@/components/master/DatePicker';

function shiftDate(date: string, days: number) {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default async function MasterBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ?? new Date().toISOString().split('T')[0];

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, date, time, client_name, client_phone, status, services(name, duration, price)')
    .eq('date', date)
    .order('time');

  const label = new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="p-5 sm:p-8 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Все записи</h1>

      <div className="flex items-center gap-3 mb-6 mt-4">
        <Link
          href={`/master/bookings?date=${shiftDate(date, -1)}`}
          className="w-10 h-10 rounded-2xl border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>

        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-foreground capitalize">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{bookings?.length ?? 0} записей</p>
        </div>

        <Link
          href={`/master/bookings?date=${shiftDate(date, 1)}`}
          className="w-10 h-10 rounded-2xl border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

    <div className="mb-6">
  <MasterDatePicker date={date} />
</div>

      {!bookings?.length && (
        <div className="bg-card rounded-3xl border border-border p-12 text-center">
          <p className="text-muted-foreground">На эту дату записей нет</p>
        </div>
      )}

      <div className="space-y-3">
        {bookings?.map((b: any) => (
          <MasterBookingCard key={b.id} booking={b} />
        ))}
      </div>
    </div>
  );
}