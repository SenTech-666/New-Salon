// lib/supabase/server.ts
//
// Клиент для использования в Server Components, Server Actions и Route
// Handlers (всё, что не помечено 'use client'). Передаёт Clerk session
// token в Supabase через accessToken() — нативная third-party auth
// интеграция, без отдельного JWT secret.
//
// Раньше здесь был createServerClient из @supabase/ssr с cookies() —
// это был способ для Supabase Auth (свои email/пароль сессии). Сейчас
// авторизацией полностью занимается Clerk, поэтому cookies Supabase
// больше не нужны, нужен только токен от Clerk на каждый запрос.

import { auth } from '@clerk/nextjs/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    }
  );
}