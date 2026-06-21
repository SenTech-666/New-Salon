'use client';

// lib/supabase/client.ts
//
// Универсальный клиент для Client Components ('use client').
// Принимает Clerk session ОПЦИОНАЛЬНО:
//
//  - createClient()           -> анонимный клиент. Сегодня так работает
//                                 публичная страница /booking, потому что
//                                 клиент салона записывается без логина.
//  - createClient(session)    -> авторизованный клиент с Clerk JWT.
//                                 Так работает админка (через хук
//                                 useSupabaseClient, который сам берёт
//                                 useSession() и передаёт сюда).
//
// Почему так, а не два отдельных файла:
// когда у клиентов салона появятся личные кабинеты (Clerk-аккаунт +
// история своих визитов), единственное, что понадобится поменять —
// начать передавать session в BookingPage точно так же, как уже
// передаётся в админке. Сам этот файл и его контракт не меняются.

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

type ClerkSessionLike = { getToken: () => Promise<string | null> };

export function createClient(session?: ClerkSessionLike | null): SupabaseClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    session
      ? {
          async accessToken() {
            return (await session.getToken()) ?? null;
          },
        }
      : undefined
  );
}