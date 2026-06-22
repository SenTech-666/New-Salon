'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { toast } from 'sonner';
import ScheduleGrid from '@/components/admin/ScheduleGrid';
import { DaySchedule, defaultWeeklyTemplate } from '@/lib/scheduling';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserPlus, Copy, Check, Trash2 } from 'lucide-react';

type TeamMember = {
  id: string;
  clerk_user_id: string;
  role: string;
  created_at: string;
};

export default function SettingsForm({
  initialHorizonDays,
  initialSlotInterval,
}: {
  initialHorizonDays: number;
  initialSlotInterval: number;
}) {
  const supabase = useSupabaseClient();
  const [horizonDays, setHorizonDays]     = useState(initialHorizonDays);
  const [slotInterval, setSlotInterval]   = useState(initialSlotInterval);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [template, setTemplate]         = useState<DaySchedule[]>(defaultWeeklyTemplate());
  const [applying, setApplying]         = useState(false);
  const [mastersCount, setMastersCount] = useState<number | null>(null);

  const [team, setTeam]                       = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam]         = useState(true);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteLink, setInviteLink]           = useState<string | null>(null);
  const [copied, setCopied]                   = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('masters')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(({ count }) => setMastersCount(count ?? 0));
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    loadTeam();
  }, [supabase]);

  const loadTeam = async () => {
    if (!supabase) return;
    setLoadingTeam(true);
    const { data } = await supabase
      .from('salon_members')
      .select('id, clerk_user_id, role, created_at')
      .order('created_at');
    setTeam(data ?? []);
    setLoadingTeam(false);
  };

  const handleSaveGeneral = async () => {
    if (!supabase) { toast.error('Подождите, проверяем вход в систему...'); return; }
    if (horizonDays < 1 || horizonDays > 365) { toast.error('Количество дней должно быть от 1 до 365'); return; }
    if (slotInterval < 5 || slotInterval > 240) { toast.error('Шаг сетки должен быть от 5 до 240 минут'); return; }

    setSavingGeneral(true);
    const { error } = await supabase
      .from('salons')
      .update({ booking_horizon_days: horizonDays, slot_interval_minutes: slotInterval });

    if (error) { toast.error('Ошибка сохранения: ' + error.message); }
    else        { toast.success('Настройки сохранены'); }
    setSavingGeneral(false);
  };

  const handleApplyToAll = async () => {
    if (!supabase) { toast.error('Подождите, проверяем вход в систему...'); return; }
    if (!confirm('Это перезапишет график работы у ВСЕХ мастеров. Продолжить?')) return;

    setApplying(true);
    try {
      const { data: masters, error: mastersError } = await supabase.from('masters').select('id');
      if (mastersError) throw mastersError;
      if (!masters || masters.length === 0) { toast.error('Мастеров пока нет'); return; }

      const rows = masters.flatMap((m: { id: string }) =>
        template.map((d) => ({
          master_id:   m.id,
          day_of_week: d.day_of_week,
          is_day_off:  d.is_day_off,
          time_from:   d.is_day_off ? null : d.time_from,
          time_to:     d.is_day_off ? null : d.time_to,
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

  const generateManagerInvite = async () => {
    if (!supabase) return;
    setGeneratingInvite(true);
    try {
      const { data, error } = await supabase
        .from('master_invites')
        .insert({ role: 'manager' })
        .select('token')
        .single();

      if (error || !data) { toast.error('Ошибка создания приглашения: ' + (error?.message ?? '')); return; }
      setInviteLink(`${window.location.origin}/master/invite/${data.token}`);
      setCopied(false);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Ссылка скопирована');
  };

  const removeMember = async (id: string) => {
    if (!supabase) return;
    if (!confirm('Убрать этого человека из команды? Доступ к админке будет потерян.')) return;
    const { error } = await supabase.from('salon_members').delete().eq('id', id);
    if (error) { toast.error('Ошибка: ' + error.message); }
    else        { toast.success('Удалено из команды'); loadTeam(); }
  };

  const roleLabel = (role: string) =>
    role === 'owner' ? 'Владелец' : role === 'manager' ? 'Менеджер' : 'Мастер';

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Запись клиентов */}
      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">Запись клиентов</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Общие правила того, как клиенты бронируют время
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-card-foreground/80 mb-2 block">
              Горизонт записи (дней вперёд)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground/80 mb-2 block">
              Шаг сетки времени (минут между слотами)
            </label>
            <input
              type="number"
              min={5}
              max={240}
              step={5}
              value={slotInterval}
              onChange={(e) => setSlotInterval(Number(e.target.value))}
              className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Например, 30 — клиент сможет выбрать 10:00, 10:30, 11:00 и т.д.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveGeneral}
          disabled={savingGeneral || !supabase}
          className="w-full h-11 mt-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-50"
        >
          {savingGeneral ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>

      {/* Общие часы работы */}
      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">Общие часы работы</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Настройте шаблон один раз и примените ко всем мастерам сразу.
          {mastersCount !== null && (
            <span className="block mt-1 text-xs text-muted-foreground/70">
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
          className="w-full h-11 mt-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-50"
        >
          {applying ? 'Применяем...' : 'Применить ко всем мастерам'}
        </button>
      </div>

      {/* Команда */}
      <div className="bg-card rounded-3xl border border-border p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">Команда</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Менеджеры видят записи, мастеров и услуги так же, как вы, но не
          могут менять настройки салона
        </p>

        {loadingTeam ? (
          <p className="text-sm text-muted-foreground py-4">Загрузка...</p>
        ) : (
          <div className="space-y-2 mb-6">
            {team.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-4 py-3 rounded-2xl bg-muted"
              >
                <div>
                  <p className="text-sm font-medium text-card-foreground">{roleLabel(m.role)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">
                    {m.clerk_user_id}
                  </p>
                </div>
                {m.role !== 'owner' && (
                  <button
                    onClick={() => removeMember(m.id)}
                    title="Убрать из команды"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={generateManagerInvite}
          disabled={generatingInvite || !supabase}
          className="w-full h-11 rounded-2xl border border-primary text-primary hover:bg-accent text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {generatingInvite ? 'Создаём...' : 'Пригласить менеджера'}
        </button>
      </div>

      <Dialog open={!!inviteLink} onOpenChange={(open) => !open && setInviteLink(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Приглашение менеджера</DialogTitle>
            <DialogDescription>
              Отправьте эту ссылку. Она действует 7 дней и одноразовая.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 bg-muted rounded-2xl p-3 mt-2">
            <input
              readOnly
              value={inviteLink ?? ''}
              className="flex-1 bg-transparent text-sm text-card-foreground/80 outline-none truncate"
            />
            <button
              onClick={copyLink}
              className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-all shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}