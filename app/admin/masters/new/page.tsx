'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewMasterPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
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
    if (!supabase) {
      toast.error('Подождите, проверяем вход в систему...');
      return;
    }
    setLoading(true);
    // salon_id не передаём явно — он подставится автоматически на
    // стороне базы через DEFAULT current_salon_id(), исходя из того,
    // кто сейчас залогинен (Clerk JWT).
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
          className="w-10 h-10 rounded-2xl border border-border flex items-center justify-center hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Новый мастер</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Добавление в систему</p>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-8 space-y-5">
        <div>
          <label className="text-sm font-medium text-card-foreground mb-1.5 block">Имя и фамилия *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Анна Смирнова"
            className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-card-foreground mb-1.5 block">Специальность</label>
          <input
            value={form.specialty}
            onChange={e => set('specialty', e.target.value)}
            placeholder="Маникюр и педикюр"
            className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('is_active', !form.is_active)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              form.is_active ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow transition-transform ${
              form.is_active ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className="text-sm text-muted-foreground">
            {form.is_active ? 'Активен — принимает записи' : 'Неактивен — скрыт на сайте'}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !supabase}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium text-sm transition-all disabled:opacity-60"
          >
            {loading ? 'Сохраняем...' : 'Добавить мастера'}
          </button>
          <Link
            href="/admin/masters"
            className="h-12 px-6 border border-border text-muted-foreground rounded-2xl font-medium text-sm transition-all hover:bg-muted flex items-center"
          >
            Отмена
          </Link>
        </div>
      </div>
    </div>
  );
}