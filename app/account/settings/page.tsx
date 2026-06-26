// app/account/settings/page.tsx

import { fetchMyProfile, fetchMySettings } from '@/lib/client-db/actions';
import { SettingsForm } from './settings-form';

export default async function AccountSettingsPage() {
  const [profile, settings] = await Promise.all([fetchMyProfile(), fetchMySettings()]);

  return (
    <div>
      <h1
        className="text-3xl sm:text-4xl font-bold italic mb-2"
        style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
      >
        Настройки
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--landing-text-dim)' }}>
        Профиль, уведомления и оформление кабинета
      </p>

      <SettingsForm profile={profile} settings={settings} />
    </div>
  );
}
