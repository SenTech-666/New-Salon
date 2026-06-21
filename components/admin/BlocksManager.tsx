'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Clock, CalendarOff, Plus } from 'lucide-react';

type Master = { id: string; name: string };

type Block = {
  id: string;
  master_id: string;
  date_from: string;
  date_to: string;
  is_full_day: boolean;
  time_from: string | null;
  time_to: string | null;
  reason: string | null;
  masters: { name: string } | null;
};

export default function BlocksManager({
  masters,
  initialBlocks,
}: {
  masters: Master[];
  initialBlocks: Block[];
}) {
  const supabase = useSupabaseClient();
  const router = useRouter();

  const [masterId, setMasterId] = useState(masters[0]?.id ?? '');
  const [mode, setMode] = useState<'hours' | 'fullday'>('hours');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeFrom, setTimeFrom] = useState('14:00');
  const [timeTo, setTimeTo] = useState('16:00');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!supabase) {
      toast.error('Подождите, проверяем вход в систему...');
      return;
    }
    if (!masterId) {
      toast.error('Выберите мастера');
      return;
    }
    if (!dateFrom) {
      toast.error('Укажите дату начала');
      return;
    }
    const finalDateTo = dateTo || dateFrom;

    if (mode === 'hours' && (!timeFrom || !timeTo || timeTo <= timeFrom)) {
      toast.error('Время окончания должно быть позже времени начала');
      return;
    }

    setSaving(true);

    // salon_id не передаём явно — он подставится автоматически на
    // стороне базы через DEFAULT current_salon_id().
    const { error } = await supabase.from('master_blocks').insert({
      master_id: masterId,
      date_from: dateFrom,
      date_to: finalDateTo,
      is_full_day: mode === 'fullday',
      time_from: mode === 'hours' ? timeFrom : null,
      time_to: mode === 'hours' ? timeTo : null,
      reason: reason.trim() || null,
    });

    if (error) {
      toast.error('Ошибка: ' + error.message);
    } else {
      toast.success(
        mode === 'fullday' ? 'Дни заблокированы' : 'Время заблокировано'
      );
      setDateFrom('');
      setDateTo('');
      setReason('');
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    setDeletingId(id);
    const { error } = await supabase.from('master_blocks').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления: ' + error.message);
    } else {
      toast.success('Блокировка снята');
      router.refresh();
    }
    setDeletingId(null);
  };

  const formatDateRange = (b: Block) => {
    const from = new Date(b.date_from).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
    if (b.date_from === b.date_to) return from;
    const to = new Date(b.date_to).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
    return `${from} — ${to}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      {/* Форма создания блокировки */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 h-fit">
        <h2 className="font-semibold text-slate-900 mb-5">Новая блокировка</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1.5">
              Мастер
            </label>
            <select
              value={masterId}
              onChange={(e) => setMasterId(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
            >
              {masters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setMode('hours')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium transition-all ${
                mode === 'hours'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              По времени
            </button>
            <button
              onClick={() => setMode('fullday')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium transition-all ${
                mode === 'fullday'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <CalendarOff className="w-3.5 h-3.5" />
              Весь день
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1.5">
                {mode === 'fullday' ? 'С даты' : 'Дата'}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-11 px-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
              />
            </div>
            {mode === 'fullday' && (
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  По дату
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom}
                  className="w-full h-11 px-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
                />
              </div>
            )}
          </div>

          {mode === 'hours' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  С
                </label>
                <input
                  type="time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  className="w-full h-11 px-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1.5">
                  До
                </label>
                <input
                  type="time"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  className="w-full h-11 px-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1.5">
              Причина (необязательно)
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === 'fullday' ? 'Отпуск, больничный' : 'Обед, личное'}
              className="w-full h-11 px-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !supabase}
            className="w-full h-12 rounded-2xl bg-[#c9a08a] hover:bg-[#b38f79] text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Сохраняем...' : 'Заблокировать'}
          </button>
        </div>
      </div>

      {/* Список текущих блокировок */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden h-fit">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Активные блокировки</h2>
        </div>

        {initialBlocks.length === 0 ? (
          <p className="text-sm text-slate-400 py-12 text-center">
            Нет активных блокировок
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {initialBlocks.map((b) => (
              <div
                key={b.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    {b.masters?.name ?? 'Мастер'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    {b.is_full_day ? (
                      <CalendarOff className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {formatDateRange(b)}
                    {!b.is_full_day && b.time_from && b.time_to && (
                      <span>
                        , {b.time_from.slice(0, 5)}–{b.time_to.slice(0, 5)}
                      </span>
                    )}
                    {b.reason && <span>· {b.reason}</span>}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={deletingId === b.id || !supabase}
                  className="w-8 h-8 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}