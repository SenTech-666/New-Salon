'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Clock, Wallet } from 'lucide-react';
import Link from 'next/link';

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  is_active: boolean;
  master_id: string | null;
  masters: { name: string } | null;
};

export default function ServicesTable({ services }: { services: Service[] }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState<string | null>(null);

  const toggleActive = async (id: string, current: boolean) => {
    if (!supabase) return;
    setLoading(id);
    const { error } = await supabase
      .from('services')
      .update({ is_active: !current })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления');
    } else {
      toast.success(!current ? 'Услуга включена' : 'Услуга скрыта');
      router.refresh();
    }
    setLoading(null);
  };

  const deleteService = async (id: string) => {
    if (!supabase) return;
    if (!confirm('Удалить услугу? Это действие необратимо.')) return;
    setLoading(id);
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления: ' + error.message);
    } else {
      toast.success('Услуга удалена');
      router.refresh();
    }
    setLoading(null);
  };

  if (services.length === 0) {
    return (
      <div className="bg-card rounded-3xl border border-border p-16 text-center">
        <p className="text-muted-foreground">Услуг пока нет</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Услуга</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Мастер</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Длительность</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Цена</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-card-foreground text-sm">{s.name}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-card-foreground/80">{s.masters?.name ?? 'Не указан'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-card-foreground/80 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {s.duration} мин
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-card-foreground/80 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                    {s.price} ₽
                  </p>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(s.id, s.is_active)}
                    disabled={loading === s.id || !supabase}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      s.is_active
                        ? 'bg-success/15 text-success hover:bg-success/25'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {s.is_active ? 'Активна' : 'Скрыта'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/services/${s.id}/edit`}
                      className="w-8 h-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => deleteService(s.id)}
                      disabled={loading === s.id || !supabase}
                      className="w-8 h-8 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}