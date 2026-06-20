'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ScheduleGrid from '@/components/admin/ScheduleGrid';
import { DaySchedule, defaultWeeklyTemplate } from '@/lib/scheduling';

export default function MasterSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const masterId = params.id as string;

  const [masterName, setMasterName] = useState('');
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultWeeklyTemplate());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [masterRes, scheduleRes] = await Promise.all([
          supabase.from('masters').select('name').eq('id', masterId).single(),
          supabase
            .from('master_weekly_hours')
            .select('*')
            .eq('master_id', masterId)
            .order('day_of_week'),
        ]);

        if (!isMounted) return;

        if (masterRes.data) setMasterName(masterRes.data.name);

        if (scheduleRes.data && scheduleRes.data.length === 7) {
          setSchedule(
            scheduleRes.data.map((row: any) => ({
              day_of_week: row.day_of_week,
              is_day_off: row.is_day_off,
              time_from: row.time_from ? String(row.time_from).slice(0, 5) : null,
              time_to: row.time_to ? String(row.time_to).slice(0, 5) : null,
            }))
          );
        }
        // если строк меньше 7 (старый мастер до миграции) — остаётся дефолтный шаблон,
        // он же будет создан при сохранении (upsert)
      } catch {
        toast.error('Не удалось загрузить график');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [masterId, supabase]);

  const handleSave = async () => {
    setSaving(true);
    const rows = schedule.map((d) => ({
      master_id: masterId,
      day_of_week: d.day_of_week,
      is_day_off: d.is_day_off,
      time_from: d.is_day_off ? null : d.time_from,
      time_to: d.is_day_off ? null : d.time_to,
    }));

    const { error } = await supabase
      .from('master_weekly_hours')
      .upsert(rows, { onConflict: 'master_id,day_of_week' });

    if (error) {
      toast.error('Ошибка сохранения: ' + error.message);
    } else {
      toast.success('График сохранён');
      router.push('/admin/masters');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Загрузка...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/admin/masters"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к мастерам
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-1">График работы</h1>
      <p className="text-slate-500 mb-8">{masterName}</p>

      <ScheduleGrid schedule={schedule} onChange={setSchedule} />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 mt-6 rounded-2xl bg-[#c9a08a] hover:bg-[#b38f79] text-white text-sm font-medium transition-all disabled:opacity-50"
      >
        {saving ? 'Сохраняем...' : 'Сохранить график'}
      </button>
    </div>
  );
}