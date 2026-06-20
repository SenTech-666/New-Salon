import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Scissors, Calendar, 
  BarChart2, History, PackageOpen, LogOut, CalendarOff, Settings
} from 'lucide-react';

const nav = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Записи', icon: Calendar },
  { href: '/admin/masters', label: 'Мастера', icon: Users },
  { href: '/admin/services', label: 'Услуги', icon: Scissors },
  { href: '/admin/stats', label: 'Статистика', icon: BarChart2 },
  { href: '/admin/history', label: 'История', icon: History },
  { href: '/admin/blocks', label: 'Расписание', icon: CalendarOff },
  { href: '/admin/inventory', label: 'Учёт', icon: PackageOpen },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/admin');

  return (
    <div className="min-h-screen flex bg-[#faf8f5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-20">
        <div className="px-6 py-7 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Панель управления</p>
          <h1 className="text-xl font-bold text-slate-900">Василики</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-[#fdf7f0] hover:text-[#c9a08a] transition-all text-sm font-medium group"
            >
              <Icon className="w-4 h-4 group-hover:text-[#c9a08a] transition-colors" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            На сайт
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}