import { createClient } from '@/lib/supabase/server';
import { Calendar, Users, TrendingUp, Clock, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
    supabase.from('bookings')
      .select('*, masters(name), services(name, price)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: 'Записей сегодня', value: todayBookings ?? 0, icon: Calendar, color: 'text-[#c9a08a]', bg: 'bg-[#fdf7f0]' },
    { label: 'Всего записей', value: totalBookings ?? 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Активных мастеров', value: totalMasters ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Дашборд</h1>
          <p className="text-slate-500 mt-1">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="flex items-center gap-2 bg-[#c9a08a] hover:bg-[#b38f79] text-white px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Новая запись
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-3xl p-6 border border-slate-100">
            <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Последние записи</h2>
          <Link href="/admin/bookings" className="text-sm text-[#c9a08a] hover:underline flex items-center gap-1">
            Все записи <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentBookings?.length === 0 && (
            <p className="px-6 py-8 text-center text-slate-400 text-sm">Записей пока нет</p>
          )}
          {recentBookings?.map((b: any) => (
            <div key={b.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-900 text-sm">{b.client_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{b.masters?.name} · {b.services?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-700">{b.date} в {b.time}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                  b.status === 'cancelled' ? 'bg-red-50 text-red-500' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {b.status === 'confirmed' ? 'Подтверждено' : b.status === 'cancelled' ? 'Отменено' : 'Ожидает'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}