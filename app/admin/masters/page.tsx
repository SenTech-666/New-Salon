import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import MastersTable from '@/components/admin/MastersTable';

export default async function AdminMastersPage() {
  const supabase = await createClient();

  // RLS на masters теперь фильтрует по current_salon_id() сам — этот
  // .order('name') без явного .eq('salon_id', ...) безопасен ПОСЛЕ
  // применения fix_masters_rls.sql. До фикса политика на masters была
  // либо отсутствующей, либо слишком широкой ('true'), из-за чего
  // отдавались мастера всех салонов сразу.
  //
  // Явного .eq('salon_id', ...) здесь намеренно не добавляем: salon_id
  // текущего пользователя не известен на фронте без отдельного запроса,
  // а current_salon_id() в RLS уже делает это надёжно на стороне базы.
  const { data: masters, error } = await supabase
    .from('masters')
    .select('*, services(count)')
    .order('name');

  if (error) {
    console.error('Ошибка загрузки мастеров:', error);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Мастера</h1>
          <p className="text-muted-foreground mt-1">{masters?.length ?? 0} мастеров</p>
        </div>
        <Link
          href="/admin/masters/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Добавить мастера
        </Link>
      </div>

      <MastersTable masters={masters ?? []} />
    </div>
  );
}