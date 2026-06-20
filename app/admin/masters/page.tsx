import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import MastersTable from '@/components/admin/MastersTable';

export default async function AdminMastersPage() {
  const supabase = await createClient();
  const { data: masters } = await supabase
    .from('masters')
    .select('*, services(count)')
    .order('name');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Мастера</h1>
          <p className="text-slate-500 mt-1">{masters?.length ?? 0} мастеров</p>
        </div>
        <Link
          href="/admin/masters/new"
          className="flex items-center gap-2 bg-[#c9a08a] hover:bg-[#b38f79] text-white px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Добавить мастера
        </Link>
      </div>

      <MastersTable masters={masters ?? []} />
    </div>
  );
}