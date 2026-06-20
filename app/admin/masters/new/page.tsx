'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewMasterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    is_active: true,
  });

  const set = (key: string, val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Введите имя мастера');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('masters').insert({
      name: form.name.trim(),
      specialty: form.specialty.trim() || null,
      is_active: form.is_active,
    });
    if (error) {
      toast.error('Ошибка: ' + error.message);
    } else {
      toast.success('Мастер добавлен');
      router.push('/admin/masters');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/masters"
          className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Новый мастер</h1>
          <p className="text-slate-500 text-sm mt-0.5">Добавление в систему</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Имя и фамилия *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Анна Смирнова"
            className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Специальность</label>
          <input
            value={form.specialty}
            onChange={e => set('specialty', e.target.value)}
            placeholder="Маникюр и педикюр"
            className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('is_active', !form.is_active)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              form.is_active ? 'bg-[#c9a08a]' : 'bg-slate-200'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              form.is_active ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className="text-sm text-slate-600">
            {form.is_active ? 'Активен — принимает записи' : 'Неактивен — скрыт на сайте'}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-12 bg-[#c9a08a] hover:bg-[#b38f79] text-white rounded-2xl font-medium text-sm transition-all disabled:opacity-60"
          >
            {loading ? 'Сохраняем...' : 'Добавить мастера'}
          </button>
          <Link
            href="/admin/masters"
            className="h-12 px-6 border border-slate-200 text-slate-600 rounded-2xl font-medium text-sm transition-all hover:bg-slate-50 flex items-center"
          >
            Отмена
          </Link>
        </div>
      </div>
    </div>
  );
}