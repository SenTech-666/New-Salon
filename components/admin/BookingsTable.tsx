'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { toast } from 'sonner';
import { Pencil, X, CheckCircle, RotateCcw, Phone, Clock, CalendarClock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateTimeSlots, dayOfWeekFromDateString, DAY_NAMES_FULL } from '@/lib/scheduling';

type Booking = {
  id: string;
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
  status: string;
  master_id: string;
  service_id: string;
  masters: { name: string; specialty: string } | null;
  services: { name: string; price: number; duration: number } | null;
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Ожидает',      cls: 'bg-accent text-accent-foreground' },
  confirmed: { label: 'Подтверждено', cls: 'bg-success/15 text-success' },
  completed: { label: 'Завершено',    cls: 'bg-blue-500/15 text-blue-500 dark:text-blue-400' },
  cancelled: { label: 'Отменено',     cls: 'bg-destructive/15 text-destructive' },
};

export default function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);

  const updateStatus = async (id: string, status: string) => {
    if (!supabase) return;
    setLoading(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) {
      toast.error('Ошибка обновления');
    } else {
      toast.success('Статус обновлён');
      router.refresh();
    }
    setLoading(null);
  };

  const deleteBooking = async (id: string) => {
    if (!supabase) return;
    if (!confirm('Удалить запись?')) return;
    setLoading(id);
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления');
    } else {
      toast.success('Запись удалена');
      router.refresh();
    }
    setLoading(null);
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-card rounded-3xl border border-border p-16 text-center">
        <p className="text-muted-foreground">Записей не найдено</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Клиент</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Мастер</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Услуга</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата и время</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {bookings.map((b) => {
                const st = statusConfig[b.status] ?? { label: b.status, cls: 'bg-muted text-muted-foreground' };
                return (
                  <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-card-foreground text-sm">{b.client_name}</p>
                      <a
                        href={`tel:${b.client_phone}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {b.client_phone}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-card-foreground/80">{b.masters?.name ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-card-foreground/80">{b.services?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.services?.duration} мин
                        {' / '}
                        {b.services?.price} руб.
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-card-foreground/80">{b.date}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.time}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(b.id, 'confirmed')}
                            disabled={loading === b.id || !supabase}
                            title="Подтвердить"
                            className="w-8 h-8 rounded-xl hover:bg-success/15 text-muted-foreground hover:text-success transition-all flex items-center justify-center"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {b.status !== 'cancelled' && b.status !== 'completed' && (
                          <button
                            onClick={() => setRescheduling(b)}
                            disabled={loading === b.id}
                            title="Перенести"
                            className="w-8 h-8 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-all flex items-center justify-center"
                          >
                            <CalendarClock className="w-4 h-4" />
                          </button>
                        )}
                        {b.status !== 'cancelled' && b.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus(b.id, 'cancelled')}
                            disabled={loading === b.id || !supabase}
                            title="Отменить"
                            className="w-8 h-8 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === 'cancelled' && (
                          <button
                            onClick={() => updateStatus(b.id, 'pending')}
                            disabled={loading === b.id || !supabase}
                            title="Восстановить"
                            className="w-8 h-8 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all flex items-center justify-center"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {b.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus(b.id, 'completed')}
                            disabled={loading === b.id || !supabase}
                            title="Завершить"
                            className="w-8 h-8 rounded-xl hover:bg-blue-500/15 text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 transition-all flex items-center justify-center text-xs font-bold"
                          >
                            OK
                          </button>
                        )}
                        <a
                          href={`/admin/bookings/${b.id}/edit`}
                          className="w-8 h-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-card-foreground transition-all flex items-center justify-center"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => deleteBooking(b.id)}
                          disabled={loading === b.id || !supabase}
                          title="Удалить"
                          className="w-8 h-8 rounded-xl hover:bg-destructive/15 text-muted-foreground/70 hover:text-destructive transition-all flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {rescheduling && (
        <RescheduleModal
          booking={rescheduling}
          onClose={() => setRescheduling(null)}
          onSaved={() => {
            setRescheduling(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function RescheduleModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: Booking;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = useSupabaseClient();
  const [date, setDate] = useState(booking.date);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullDayBlock, setFullDayBlock] = useState<string | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<{ from: string; to: string }[]>([]);
  const [takenTimes, setTakenTimes] = useState<string[]>([]);
  const [slotInterval, setSlotInterval] = useState(30);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase) return;
    // Шаг сетки времени теперь хранится в salons (старая таблица
    // salon_settings больше не обновляется — её можно удалить из базы
    // после того, как все места, читавшие из неё, переведены сюда).
    supabase
      .from('salons')
      .select('slot_interval_minutes')
      .single()
      .then(({ data }) => {
        if (data?.slot_interval_minutes) setSlotInterval(data.slot_interval_minutes);
      });
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const loadAvailability = async () => {
      setLoadingSlots(true);
      setFullDayBlock(null);
      setBlockedRanges([]);
      setTakenTimes([]);
      setAvailableSlots([]);
      setSelectedTime('');

      try {
        const dayOfWeek = dayOfWeekFromDateString(date);

        const [blocksRes, bookingsRes, weeklyRes] = await Promise.all([
          supabase
            .from('master_blocks')
            .select('*')
            .eq('master_id', booking.master_id)
            .lte('date_from', date)
            .gte('date_to', date),
          supabase
            .from('bookings')
            .select('time, status, id')
            .eq('master_id', booking.master_id)
            .eq('date', date)
            .neq('status', 'cancelled'),
          supabase
            .from('master_weekly_hours')
            .select('is_day_off, time_from, time_to')
            .eq('master_id', booking.master_id)
            .eq('day_of_week', dayOfWeek)
            .maybeSingle(),
        ]);

        if (!isMounted) return;

        const blocks = blocksRes.data ?? [];
        const fullDay = blocks.find((bl: any) => bl.is_full_day);

        if (fullDay) {
          setFullDayBlock(fullDay.reason || 'Мастер не работает в этот день');
        } else if (!weeklyRes.data || weeklyRes.data.is_day_off) {
          setFullDayBlock(`Выходной день у мастера (${DAY_NAMES_FULL[dayOfWeek]})`);
        } else {
          const ranges = blocks
            .filter((bl: any) => !bl.is_full_day && bl.time_from && bl.time_to)
            .map((bl: any) => ({
              from: String(bl.time_from).slice(0, 5),
              to: String(bl.time_to).slice(0, 5),
            }));
          setBlockedRanges(ranges);

          const duration = booking.services?.duration ?? 30;
          const slots = generateTimeSlots(
            weeklyRes.data.time_from,
            weeklyRes.data.time_to,
            slotInterval,
            duration
          );
          setAvailableSlots(slots);
        }

        const taken = (bookingsRes.data ?? [])
          .filter((bk: any) => bk.id !== booking.id)
          .map((bk: any) => bk.time);
        setTakenTimes(taken);
      } catch (err) {
        toast.error('Не удалось загрузить занятость мастера');
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    loadAvailability();
    return () => {
      isMounted = false;
    };
  }, [date, booking.master_id, booking.id, booking.services?.duration, slotInterval, supabase]);

  const isSlotBlocked = (slot: string) => {
    if (takenTimes.includes(slot)) return true;
    return blockedRanges.some((r) => slot >= r.from && slot < r.to);
  };

  const handleSave = async () => {
    if (!supabase) return;
    if (!selectedTime) {
      toast.error('Выберите время');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('bookings')
      .update({ date, time: selectedTime })
      .eq('id', booking.id);

    if (error) {
      toast.error('Не удалось перенести запись');
    } else {
      toast.success(`Запись перенесена на ${date} в ${selectedTime}`);
      onSaved();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Перенос записи</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {booking.client_name} · {booking.masters?.name ?? '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Новая дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Новое время</label>

            {loadingSlots ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Проверка занятости...</p>
            ) : fullDayBlock ? (
              <div className="bg-destructive/15 text-destructive text-sm rounded-2xl p-4 text-center">
                {fullDayBlock}
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Нет свободного времени с учётом длительности услуги
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const blocked = isSlotBlocked(slot);
                  const isCurrentSlot = slot === booking.time && date === booking.date;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={blocked}
                      onClick={() => !blocked && setSelectedTime(slot)}
                      className={`h-11 rounded-xl text-sm font-medium transition-all ${
                        blocked
                          ? 'bg-destructive/15 border border-destructive/30 text-destructive/50 cursor-not-allowed'
                          : selectedTime === slot
                          ? 'bg-primary text-primary-foreground'
                          : isCurrentSlot
                          ? 'border-2 border-primary text-primary'
                          : 'border border-border text-muted-foreground hover:border-primary'
                      }`}
                    >
                      {slot}
                    </button>

                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-5 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-all"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedTime || !!fullDayBlock || !supabase}
            className="flex-1 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-50"
          >
            {saving ? 'Сохраняем...' : 'Перенести'}
          </button>
        </div>
      </div>
    </div>
  );
}