'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, X } from 'lucide-react';

type Master = { id: string; name: string };
type Service = { id: string; name: string };

type Filters = {
  date_from?: string;
  date_to?: string;
  master?: string;
  service?: string;
  name?: string;
  phone?: string;
};

export default function HistoryFilters({
  masters,
  services,
  current,
}: {
  masters: Master[];
  services: Service[];
  current: Filters;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Filters>({
    date_from: current.date_from ?? '',
    date_to: current.date_to ?? '',
    master: current.master ?? '',
    service: current.service ?? '',
    name: current.name ?? '',
    phone: current.phone ?? '',
  });

  const set = (key: keyof Filters, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/admin/history?${params.toString()}`);
  };

  const resetFilters = () => {
    setForm({ date_from: '', date_to: '', master: '', service: '', name: '', phone: '' });
    router.push('/admin/history');
  };

  const hasActiveFilters = Object.values(current).some((v) => v);

  return (
    <div className="bg-card rounded-3xl border border-border p-5 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Дата от</label>
          <input
            type="date"
            value={form.date_from}
            onChange={(e) => set('date_from', e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Дата до</label>
          <input
            type="date"
            value={form.date_to}
            onChange={(e) => set('date_to', e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Мастер</label>
          <select
            value={form.master}
            onChange={(e) => set('master', e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">Все мастера</option>
            {masters.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Услуга</label>
          <select
            value={form.service}
            onChange={(e) => set('service', e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">Все услуги</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Имя клиента</label>
          <input
            type="text"
            placeholder="Анна"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Телефон</label>
          <input
            type="text"
            placeholder="+7 999"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={applyFilters}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all"
        >
          <Search className="w-4 h-4" />
          Применить
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 h-10 px-5 rounded-xl border border-border text-card-foreground/80 text-sm font-medium hover:bg-muted transition-all"
          >
            <X className="w-4 h-4" />
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}