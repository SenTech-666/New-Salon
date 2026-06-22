import { createClient } from '@/lib/supabase/server';
import BlocksManager from '@/components/admin/BlocksManager';

export default async function AdminBlocksPage() {
  const supabase = await createClient();

  const { data: masters } = await supabase
    .from('masters')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  const { data: blocks } = await supabase
    .from('master_blocks')
    .select('*, masters(name)')
    .gte('date_to', new Date().toISOString().split('T')[0])
    .order('date_from');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Расписание мастеров</h1>
        <p className="text-muted-foreground mt-1">Блокировка времени, выходных и отпусков</p>
      </div>

      <BlocksManager masters={masters ?? []} initialBlocks={blocks ?? []} />
    </div>
  );
}