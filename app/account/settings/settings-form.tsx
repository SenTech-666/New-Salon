'use client';

// app/account/settings/settings-form.tsx

import { useState, useTransition } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { updateMyProfile, updateMySettings } from '@/lib/client-db/actions';
import type { ClientProfile, ClientSettings } from '@/lib/client-db/queries';

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 sm:p-7 flex flex-col gap-5"
      style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-accent-12)' }}
    >
      <div>
        <h2 className="font-semibold text-base" style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}>
          {title}
        </h2>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--landing-text-faint)' }}>{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--landing-text)' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--landing-text-faint)' }}>{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors"
        style={{ background: checked ? 'var(--landing-accent)' : 'var(--landing-accent-15)' }}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full transition-transform"
          style={{
            background: 'var(--landing-surface)',
            transform: checked ? 'translateX(24px)' : 'translateX(4px)',
          }}
        />
      </button>
    </div>
  );
}

export function SettingsForm({
  profile,
  settings,
}: {
  profile: ClientProfile | null;
  settings: ClientSettings | null;
}) {
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');

  const [theme, setTheme] = useState(settings?.theme ?? 'light');
  const [notifyEmail, setNotifyEmail] = useState(settings?.notify_email ?? true);
  const [notifySms, setNotifySms] = useState(settings?.notify_sms ?? true);
  const [notifyReminder, setNotifyReminder] = useState(settings?.notify_booking_reminder ?? true);
  const [notifyChanges, setNotifyChanges] = useState(settings?.notify_booking_changes ?? true);
  const [notifyMarketing, setNotifyMarketing] = useState(settings?.notify_marketing ?? false);

  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<'profile' | 'notifications' | 'theme' | null>(null);

  function flashSaved(which: typeof savedAt) {
    setSavedAt(which);
    setTimeout(() => setSavedAt((cur) => (cur === which ? null : cur)), 2000);
  }

  function handleSaveProfile() {
    startTransition(async () => {
      await updateMyProfile({ name, email: email.trim() || null, avatar_url: profile?.avatar_url ?? null });
      flashSaved('profile');
    });
  }

  function handleToggleNotification(setter: (v: boolean) => void, key: Parameters<typeof updateMySettings>[0]) {
    return (value: boolean) => {
      setter(value);
      startTransition(async () => {
        await updateMySettings(key);
        flashSaved('notifications');
      });
    };
  }

  function handleThemeChange(next: 'light' | 'dark') {
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    startTransition(async () => {
      await updateMySettings({ theme: next });
      flashSaved('theme');
    });
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Профиль */}
      <SectionCard title="Профиль" description="Эти данные видят салоны при подтверждении записи">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--landing-text-dim)' }}>Имя и фамилия</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl text-sm outline-none"
              style={{ background: 'var(--landing-bg-alt)', border: '1px solid var(--landing-accent-15)', color: 'var(--landing-text)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--landing-text-dim)' }}>Email (необязательно)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 px-4 rounded-xl text-sm outline-none"
              style={{ background: 'var(--landing-bg-alt)', border: '1px solid var(--landing-accent-15)', color: 'var(--landing-text)' }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveProfile}
            disabled={isPending || !name.trim()}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center gap-2"
            style={{ background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`, color: 'var(--landing-on-accent)' }}
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Сохранить
          </button>
          {savedAt === 'profile' && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--landing-success-text)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Сохранено
            </span>
          )}
        </div>
      </SectionCard>

      {/* Уведомления */}
      <SectionCard title="Уведомления" description="Что и куда вам присылать">
        <Toggle
          checked={notifyReminder}
          onChange={handleToggleNotification(setNotifyReminder, { notify_booking_reminder: !notifyReminder })}
          label="Напоминания о записи"
          description="За несколько часов до визита"
        />
        <Toggle
          checked={notifyChanges}
          onChange={handleToggleNotification(setNotifyChanges, { notify_booking_changes: !notifyChanges })}
          label="Изменения записи"
          description="Отмена или перенос времени салоном"
        />
        <Toggle
          checked={notifyEmail}
          onChange={handleToggleNotification(setNotifyEmail, { notify_email: !notifyEmail })}
          label="Email-уведомления"
        />
        <Toggle
          checked={notifySms}
          onChange={handleToggleNotification(setNotifySms, { notify_sms: !notifySms })}
          label="SMS-уведомления"
        />
        <Toggle
          checked={notifyMarketing}
          onChange={handleToggleNotification(setNotifyMarketing, { notify_marketing: !notifyMarketing })}
          label="Акции и новости салонов"
          description="Не чаще пары раз в месяц"
        />
        {savedAt === 'notifications' && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--landing-success-text)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Сохранено
          </span>
        )}
      </SectionCard>

      {/* Оформление */}
      <SectionCard title="Оформление" description="Тема кабинета — применяется сразу">
        <div className="flex gap-3">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
              style={
                theme === t
                  ? { background: 'var(--landing-accent)', color: 'var(--landing-on-accent)' }
                  : { background: 'var(--landing-bg-alt)', border: '1px solid var(--landing-accent-15)', color: 'var(--landing-text-dim)' }
              }
            >
              {t === 'light' ? 'Светлая' : 'Тёмная'}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
