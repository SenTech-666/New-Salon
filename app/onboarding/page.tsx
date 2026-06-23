// app/onboarding/page.tsx
//
// Финальный шаг регистрации. К этому моменту пользователь УЖЕ залогинен
// через Clerk (страницу защищает middleware.ts — см. там добавленный
// '/onboarding(.*)' в isProtectedRoute). Здесь только один вызов RPC
// register_salon(), который атомарно создаёт salons + salon_members
// (см. 002_register_salon_rpc.sql) — и сразу редирект в /admin.
//
// Это серверный компонент (без 'use client'): создание салона должно
// случиться один раз за один заход, без лишнего клиентского useEffect,
// который мог бы дать сработать RPC дважды при двойном рендере/Fast
// Refresh в деве.
//
// Если salon_members у юзера уже есть (он уже владелец/мастер другого
// салона — например, открыл /register повторно по старой вкладке) —
// RPC вернёт ошибку 'already_has_salon', и мы просто отправим его в
// /admin: там RLS сам подставит его существующий салон через
// current_salon_id(), ничего ломать не нужно.

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{
  salon_name?: string;
  salon_slug?: string;
  salon_phone?: string;
}>;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/onboarding');

  const params = await searchParams;

  // Нет данных формы — значит сюда попали не через /register (например,
  // прямой заход по ссылке после логина существующего пользователя).
  // Просто пускаем в /admin: если у юзера уже есть salon_members — он
  // окажется в своём кабинете; если нет — /admin сам должен показать
  // понятное сообщение "у вас пока нет салона" со ссылкой на /register
  // (это отдельная, более лёгкая правка в самой /admin/layout.tsx).
  if (!params.salon_name || !params.salon_slug) {
    redirect('/admin');
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('register_salon', {
    p_name: params.salon_name,
    p_slug: params.salon_slug,
    p_phone: params.salon_phone || null,
  });

  if (error) {
    const messages: Record<string, string> = {
      already_has_salon: null as any, // обрабатывается отдельно ниже редиректом, не текстом
      slug_taken: 'Этот адрес страницы уже занят. Вернитесь и выберите другой.',
      invalid_slug: 'Некорректный адрес страницы.',
      not_authenticated: 'Сессия истекла, войдите снова.',
      reserved_slug: 'Этот адрес зарезервирован системой. Вернитесь и выберите другой.',
    };

    // already_has_salon — это не ошибка для пользователя, а сигнал
    // "у тебя уже есть салон, веди себя как обычный логин".
    if (error.message?.includes('already_has_salon')) {
      redirect('/admin');
    }

    const text =
      Object.entries(messages).find(([code]) => error.message?.includes(code))?.[1] ??
      'Не удалось создать салон. Попробуйте снова или напишите нам.';

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <p className="text-lg text-foreground mb-2">Не получилось создать салон</p>
          <p className="text-sm text-muted-foreground mb-6">{text}</p>
          <a
            href="/register"
            className="inline-flex h-11 px-6 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
          >
            Попробовать снова
          </a>
        </div>
      </div>
    );
  }

  redirect('/admin');
}