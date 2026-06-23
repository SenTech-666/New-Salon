'use client';

// app/register/page.tsx
//
// Публичная страница (не за Clerk-гвардом). Собирает название/slug/телефон
// БУДУЩЕГО салона до логина — специально до, чтобы человек видел "на что
// он подписывается" прежде чем создавать аккаунт (выше конверсия, чем
// просить логиниться вслепую). Сама запись в БД происходит позже, на
// /onboarding, через register_salon() — там уже есть Clerk-сессия,
// которая обязательна для RPC (auth.jwt() ->> 'sub').
//
// Данные формы передаются в /sign-up через query-параметры, а оттуда
// Clerk сам передаст redirect_url на /onboarding после успешной
// регистрации — onboarding заберёт name/slug/phone из своих собственных
// query-параметров (см. комментарий в onboarding/page.tsx).

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
import { isReservedSlug } from '@/lib/slugs';

const supabase = createClient();

function slugify(input: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return input
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'reserved';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [phone, setPhone] = useState('');
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Пока пользователь не трогал поле slug руками — авто-генерируем его
  // из названия. Как только он впервые отредактирует slug вручную,
  // авто-синхронизация выключается навсегда (slugTouched), чтобы не
  // перетирать его правки на каждое нажатие клавиши в поле "Название".
  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  const displayUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/${slug || '...'}`;
  }, [slug]);

  // Debounced проверка уникальности slug через is_slug_available RPC.
  useEffect(() => {
    if (!slug) {
      setSlugStatus('idle');
      return;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      setSlugStatus('invalid');
      return;
    }
    if (isReservedSlug(slug)) {
    setSlugStatus('reserved');
    return;
  }
    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc('is_slug_available', { p_slug: slug });
      if (error) {
        setSlugStatus('idle');
        return;
      }
      setSlugStatus(data ? 'available' : 'taken');
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  const canSubmit =
    name.trim().length >= 2 &&
    slugStatus === 'available' &&
    phone.trim().length >= 5 &&
    !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    const params = new URLSearchParams({
      salon_name: name.trim(),
      salon_slug: slug,
      salon_phone: phone.trim(),
    });

    // /sign-up сам передаст redirect_url=/onboarding?<те же параметры>
    // через fallbackRedirectUrl — но т.к. fallbackRedirectUrl статичен
    // в коде sign-up/page.tsx, передаём параметры явным redirect_url,
    // который Clerk уважает с приоритетом выше fallbackRedirectUrl.
    const onboardingUrl = `/onboarding?${params.toString()}`;
    router.push(`/sign-up?redirect_url=${encodeURIComponent(onboardingUrl)}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Создать салон</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            14 дней бесплатно, без карты. Дальше — обычный логин.
          </p>
        </div>

        <div className="bg-card rounded-3xl border border-border p-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1.5 block">
              Название салона
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Василики"
              className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-1.5 block">
              Адрес вашей страницы
            </label>
            <div className="relative">
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="vasiliki"
                className="w-full h-11 px-4 pr-9 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === 'checking' && (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                )}
                {slugStatus === 'available' && <Check className="w-4 h-4 text-success" />}
                {(slugStatus === 'taken' || slugStatus === 'reserved' || slugStatus === 'invalid') && (
                     <X className="w-4 h-4 text-destructive" />
                       )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Ваш сайт будет:{' '}
              <span className="text-card-foreground/80">{displayUrl}</span>
              {slugStatus === 'taken' && (
             <span className="text-destructive"> — уже занят</span>
                )}
               {slugStatus === 'reserved' && (
  <span className="text-destructive"> — зарезервирован системой</span>
                  )}
                  {slugStatus === 'invalid' && slug && (
                <span className="text-destructive"> — только латиница, цифры и дефис</span>
                    )}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-1.5 block">
              Телефон
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Переходим...' : 'Продолжить'}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Уже есть салон?{' '}
            <Link href="/sign-in" className="text-primary hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}