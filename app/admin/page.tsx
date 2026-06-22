import { createClient } from '@/lib/supabase/server';
import { Calendar, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getStatusConfig } from '@/lib/booking-status';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const [
    { count: totalBookings },
    { count: todayBookings },
    { count: totalMasters },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('date', today),
    supabase.from('masters').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('bookings')
      .select('*, masters(name), services(name, price)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: 'Записей сегодня', value: todayBookings ?? 0, icon: Calendar, iconCls: 'text-primary', bgCls: 'bg-accent' },
    { label: 'Всего записей',   value: totalBookings ?? 0,  icon: TrendingUp, iconCls: 'text-success', bgCls: 'bg-success/15' },
    { label: 'Активных мастеров', value: totalMasters ?? 0, icon: Users, iconCls: 'text-blue-500 dark:text-blue-400', bgCls: 'bg-blue-500/15' },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Дашборд</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Новая запись
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, iconCls, bgCls }) => (
          <div key={label} className="bg-card rounded-3xl p-6 border border-border">
            <div className={`w-10 h-10 ${bgCls} rounded-2xl flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${iconCls}`} />
            </div>
            <p className="text-3xl font-bold text-card-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-border">
          <h2 className="font-semibold text-card-foreground">Последние записи</h2>
          <Link
            href="/admin/bookings"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            Все записи <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-border/60">
          {recentBookings?.length === 0 && (
            <p className="px-6 py-8 text-center text-muted-foreground text-sm">Записей пока нет</p>
          )}
          {recentBookings?.map((b: any) => {
            const st = getStatusConfig(b.status);
            return (
              <div
                key={b.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-card-foreground text-sm">{b.client_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {b.masters?.name} · {b.services?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-card-foreground/80">
                    {b.date} в {b.time}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}