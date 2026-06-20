'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Master = { id: string; name: string };

export default function NewServicePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [masters, setMasters] = useState<Master[]>([]);
  const [form, setForm] = useState({
    name: '',
    duration: 30,
    price: 1000,
    master_id: '',
    is_active: true,
  });

  useEffect(() => {
    let isMounted = true;
    supabase
      .from('masters')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (isMounted) setMasters(data ?? []);
      });
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const set = (key: string, val: string | number | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Введите название услуги');
      return;
    }
    if (form.duration <= 0) {
      toast.error('Длительность должна быть больше нуля');
      return;
    }
    if (form.price < 0) {
      toast.error('Цена не может быть отрицательной');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('services').insert({
      name: form.name.trim(),
      duration: form.duration,
      price: form.price,
      master_id: form.master_id || null,
      is_active: form.is_active,
    });

    if (error) {
      toast.error('Ошибка: ' + error.message);
    } else {
      toast.success('Услуга добавлена');
      router.push('/admin/services');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/services"
          className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Новая услуга</h1>
          <p className="text-slate-500 text-sm mt-0.5">Добавление в систему</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Название *</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Маникюр классика"
            className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Мастер</label>
          <select
            value={form.master_id}
            onChange={(e) => set('master_id', e.target.value)}
            className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#c9a08a] transition-colors"
          >
            <option value="">Без привязки к мастеру</option>
            {masters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Длительность (мин) *</label>
            <input
              type="number"
              min={5}
              step={5}
              value={form.duration}
              onChange={(e) => set('duration', Number(e.target.value))}
              className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Цена (₽) *</label>
            <input
              type="number"
              min={0}
              step={50}
              value={form.price}
              onChange={(e) => set('price', Number(e.target.value))}
              className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('is_active', !form.is_active)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              form.is_active ? 'bg-[#c9a08a]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.is_active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-slate-600">
            {form.is_active ? 'Активна — доступна для записи' : 'Неактивна — скрыта на сайте'}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-12 bg-[#c9a08a] hover:bg-[#b38f79] text-white rounded-2xl font-medium text-sm transition-all disabled:opacity-60"
          >
            {loading ? 'Сохраняем...' : 'Добавить услугу'}
          </button>
          <Link
            href="/admin/services"
            className="h-12 px-6 border border-slate-200 text-slate-600 rounded-2xl font-medium text-sm transition-all hover:bg-slate-50 flex items-center"
          >
            Отмена
          </Link>
        </div>
      </div>
    </div>
  );
}