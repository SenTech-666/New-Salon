import { createClient } from '@/lib/supabase/server';
import MasterBookingCard from '@/components/master/MasterBookingCard';

export default async function MasterTodayPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, date, time, client_name, client_phone, status, services(name, duration, price)')
    .eq('date', today)
    .neq('status', 'cancelled')
    .order('time');

  return (
    <div className="p-5 sm:p-8 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Сегодня</h1>
      <p className="text-muted-foreground mb-6">
        {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        {' · '}
        {bookings?.length ?? 0} записей
      </p>

      {!bookings?.length && (
        <div className="bg-card rounded-3xl border border-border p-12 text-center">
          <p className="text-muted-foreground">На сегодня записей нет</p>
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