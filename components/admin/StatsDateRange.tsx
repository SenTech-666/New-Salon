'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar } from 'lucide-react';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const presets = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
];

export default function StatsDateRange({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  const apply = (f: string, t: string) => {
    router.push(`/admin/stats?from=${f}&to=${t}`);
  };

  const applyPreset = (days: number) => {
    const f = daysAgo(days);
    const t = new Date().toISOString().split('T')[0];
    setLocalFrom(f);
    setLocalTo(t);
    apply(f, t);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 bg-card rounded-2xl border border-border p-1">
        {presets.map((p) => (
          <button
            key={p.days}
            onClick={() => applyPreset(p.days)}
            className="px-3 py-1.5 rounded-xl text-sm font-medium text-card-foreground/80 hover:bg-accent hover:text-primary transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-card rounded-2xl border border-border px-3 py-1.5">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <input
          type="date"
          value={localFrom}
          onChange={(e) => setLocalFrom(e.target.value)}
          className="text-sm text-card-foreground/80 bg-transparent focus:outline-none"
        />
        <span className="text-muted-foreground/50">—</span>
        <input
          type="date"
          value={localTo}
          onChange={(e) => setLocalTo(e.target.value)}
          className="text-sm text-card-foreground/80 bg-transparent focus:outline-none"
        />
        <button
          onClick={() => apply(localFrom, localTo)}
          className="ml-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          ОК
        </button>
      </div>
    </div>
  );
}