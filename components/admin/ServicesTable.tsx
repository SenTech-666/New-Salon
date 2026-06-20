'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  const toggleActive = async (id: string, current: boolean) => {
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
      <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
        <p className="text-slate-400">Услуг пока нет</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Услуга</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Мастер</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Длительность</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Цена</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900 text-sm">{s.name}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-700">{s.masters?.name ?? 'Не указан'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {s.duration} мин
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-600 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    {s.price} ₽
                  </p>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(s.id, s.is_active)}
                    disabled={loading === s.id}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      s.is_active
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {s.is_active ? 'Активна' : 'Скрыта'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/services/${s.id}/edit`}
                      className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => deleteService(s.id)}
                      disabled={loading === s.id}
                      className="w-8 h-8 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
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