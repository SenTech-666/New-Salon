'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ListChecks } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/master', label: 'Сегодня', icon: Calendar },
  { href: '/master/bookings', label: 'Все записи', icon: ListChecks },
];

export function MasterNavDesktop() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MasterNavMobile() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border flex sm:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-all ${
              active ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}