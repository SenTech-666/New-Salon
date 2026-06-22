'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Master = { id: string; name: string };

export default function NewServicePage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
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
    if (!supabase) return;
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
    if (!supabase) {
      toast.error('Подождите, проверяем вход в систему...');
      return;
    }
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
    // salon_id не передаём явно — он подставится автоматически на
    // стороне базы через DEFAULT current_salon_id().
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
          className="w-10 h-10 rounded-2xl border border-border flex items-center justify-center hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Новая услуга</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Добавление в систему</p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-8 space-y-5">
        <div>
          <label className="text-sm font-medium text-card-foreground mb-1.5 block">Название *</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Маникюр классика"
            className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-card-foreground mb-1.5 block">Мастер</label>
          <select
            value={form.master_id}
            onChange={(e) => set('master_id', e.target.value)}
            className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
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
            <label className="text-sm font-medium text-card-foreground mb-1.5 block">Длительность (мин) *</label>
            <input
              type="number"
              min={5}
              step={5}
              value={form.duration}
              onChange={(e) => set('duration', Number(e.target.value))}
              className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1.5 block">Цена (₽) *</label>
            <input
              type="number"
              min={0}
              step={50}
              value={form.price}
              onChange={(e) => set('price', Number(e.target.value))}
              className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('is_active', !form.is_active)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              form.is_active ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow transition-transform ${
                form.is_active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-muted-foreground">
            {form.is_active ? 'Активна — доступна для записи' : 'Неактивна — скрыта на сайте'}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !supabase}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium text-sm transition-all disabled:opacity-60"
          >
            {loading ? 'Сохраняем...' : 'Добавить услугу'}
          </button>
          <Link
            href="/admin/services"
            className="h-12 px-6 border border-border text-muted-foreground rounded-2xl font-medium text-sm transition-all hover:bg-muted flex items-center"
          >
            Отмена
          </Link>
        </div>
      </div>
    </div>
  );
}