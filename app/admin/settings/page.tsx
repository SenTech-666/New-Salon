import { createClient } from '@/lib/supabase/server';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('salon_settings')
    .select('booking_horizon_days, slot_interval_minutes')
    .eq('id', 1)
    .single();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Настройки</h1>
        <p className="text-slate-500 mt-1">Общие правила работы салона</p>
      </div>

      <SettingsForm
        initialHorizonDays={data?.booking_horizon_days ?? 30}
        initialSlotInterval={data?.slot_interval_minutes ?? 30}
      />
    </div>
  );
}