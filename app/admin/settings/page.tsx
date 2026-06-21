'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { toast } from 'sonner';
import ScheduleGrid from '@/components/admin/ScheduleGrid';
import { DaySchedule, defaultWeeklyTemplate } from '@/lib/scheduling';

export default function SettingsForm({
  initialHorizonDays,
  initialSlotInterval,
}: {
  initialHorizonDays: number;
  initialSlotInterval: number;
}) {
  const supabase = useSupabaseClient();
  const [horizonDays, setHorizonDays] = useState(initialHorizonDays);
  const [slotInterval, setSlotInterval] = useState(initialSlotInterval);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [template, setTemplate] = useState<DaySchedule[]>(defaultWeeklyTemplate());
  const [applying, setApplying] = useState(false);
  const [mastersCount, setMastersCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('masters')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(({ count }) => setMastersCount(count ?? 0));
  }, [supabase]);

  const handleSaveGeneral = async () => {
    if (!supabase) {
      toast.error('Подождите, проверяем вход в систему...');
      return;
    }
    if (horizonDays < 1 || horizonDays > 365) {
      toast.error('Количество дней должно быть от 1 до 365');
      return;
    }
    if (slotInterval < 5 || slotInterval > 240) {
      toast.error('Шаг сетки должен быть от 5 до 240 минут');
      return;
    }

    setSavingGeneral(true);
    // Настройки теперь хранятся в salons (одна строка на салон), а не в
    // старой salon_settings (id=1 на всех). Без .eq() — RLS сам найдёт
    // именно строку текущего владельца через salons_update.
    const { error } = await supabase
      .from('salons')
      .update({ booking_horizon_days: horizonDays, slot_interval_minutes: slotInterval });

    if (error) {
      toast.error('Ошибка сохранения: ' + error.message);
    } else {
      toast.success('Настройки сохранены');
    }
    setSavingGeneral(false);
  };

  const handleApplyToAll = async () => {
    if (!supabase) {
      toast.error('Подождите, проверяем вход в систему...');
      return;
    }
    if (!confirm('Это перезапишет график работы у ВСЕХ мастеров. Продолжить?')) return;

    setApplying(true);
    try {
      const { data: masters, error: mastersError } = await supabase
        .from('masters')
        .select('id');

      if (mastersError) throw mastersError;
      if (!masters || masters.length === 0) {
        toast.error('Мастеров пока нет');
        return;
      }

      const rows = masters.flatMap((m: { id: string }) =>
        template.map((d) => ({
          master_id: m.id,
          day_of_week: d.day_of_week,
          is_day_off: d.is_day_off,
          time_from: d.is_day_off ? null : d.time_from,
          time_to: d.is_day_off ? null : d.time_to,
        }))
      );

      const { error } = await supabase
        .from('master_weekly_hours')
        .upsert(rows, { onConflict: 'master_id,day_of_week' });

      if (error) throw error;
      toast.success(`График применён к ${masters.length} мастерам`);
    } catch (err: any) {
      toast.error('Ошибка: ' + (err?.message ?? 'неизвестная'));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="bg-white rounded-3xl border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Запись клиентов</h2>
        <p className="text-sm text-slate-500 mb-6">
          Общие правила того, как клиенты бронируют время
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Горизонт записи (дней вперёд)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Шаг сетки времени (минут между слотами)
            </label>
            <input
              type="number"
              min={5}
              max={240}
              step={5}
              value={slotInterval}
              onChange={(e) => setSlotInterval(Number(e.target.value))}
              className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Например, 30 — клиент сможет выбрать 10:00, 10:30, 11:00 и т.д.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveGeneral}
          disabled={savingGeneral || !supabase}
          className="w-full h-11 mt-6 rounded-2xl bg-[#c9a08a] hover:bg-[#b38f79] text-white text-sm font-medium transition-all disabled:opacity-50"
        >
          {savingGeneral ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Общие часы работы</h2>
        <p className="text-sm text-slate-500 mb-6">
          Настройте шаблон один раз и примените ко всем мастерам сразу.
          {mastersCount !== null && (
            <span className="block mt-1 text-xs text-slate-400">
              Сейчас активных мастеров: {mastersCount}
            </span>
          )}
          {' '}После применения график каждого мастера можно донастроить
          индивидуально на странице мастера.
        </p>

        <ScheduleGrid schedule={template} onChange={setTemplate} />

        <button
          onClick={handleApplyToAll}
          disabled={applying || !supabase}
          className="w-full h-11 mt-6 rounded-2xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium transition-all disabled:opacity-50"
        >
          {applying ? 'Применяем...' : 'Применить ко всем мастерам'}
        </button>
      </div>
    </div>
  );
}