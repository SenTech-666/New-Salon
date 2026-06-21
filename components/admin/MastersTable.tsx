'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { toast } from 'sonner';
import { Pencil, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Master = {
  id: string;
  name: string;
  specialty: string | null;
  is_active: boolean;
  photo: string | null;
};

export default function MastersTable({ masters }: { masters: Master[] }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState<string | null>(null);

  const toggleActive = async (id: string, current: boolean) => {
    if (!supabase) return;
    setLoading(id);
    const { error } = await supabase
      .from('masters')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) {
      toast.error('Ошибка обновления');
    } else {
      toast.success(current ? 'Мастер деактивирован' : 'Мастер активирован');
      router.refresh();
    }
    setLoading(null);
  };

  if (masters.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
        <p className="text-slate-400 mb-4">Мастеров пока нет</p>
        <Link
          href="/admin/masters/new"
          className="text-sm text-[#c9a08a] hover:underline"
        >
          Добавить первого мастера
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {masters.map(m => (
        <div
          key={m.id}
          className={`bg-white rounded-3xl border p-6 flex items-center justify-between transition-all ${
            m.is_active ? 'border-slate-100' : 'border-slate-100 opacity-60'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fdf7f0] flex items-center justify-center text-[#c9a08a] font-bold text-lg">
              {m.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{m.name}</p>
              <p className="text-sm text-slate-400 mt-0.5">{m.specialty ?? 'Специальность не указана'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              m.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {m.is_active ? 'Активен' : 'Неактивен'}
            </span>

            <Link
              href={`/admin/masters/${m.id}/edit`}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Pencil className="w-4 h-4" />
            </Link>

            <button
              onClick={() => toggleActive(m.id, m.is_active)}
              disabled={loading === m.id || !supabase}
              title={m.is_active ? 'Деактивировать' : 'Активировать'}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                m.is_active
                  ? 'border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50'
                  : 'border-emerald-200 text-emerald-500 hover:bg-emerald-50'
              }`}
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}