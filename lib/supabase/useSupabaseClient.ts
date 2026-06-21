'use client';

// lib/supabase/useSupabaseClient.ts
//
// Единая точка получения авторизованного Supabase-клиента в Client
// Components. Используется во всех компонентах админки, которым нужно
// читать/писать данные с учётом текущего пользователя (RLS по salon_id).
//
// Почему хук, а не просто createClient(session) в каждом компоненте:
// так гарантированно везде передаётся актуальная Clerk-сессия одним
// и тем же способом, без риска забыть session в одном из компонентов
// и тихо откатиться к анонимному доступу.
//
// isLoaded === false означает, что Clerk ещё не успел сообщить, есть ли
// сессия вообще. В этот момент лучше не выполнять запросы (вернуть null
// и подождать), чем случайно сходить в Supabase без токена.

import { useMemo } from 'react';
import { useSession } from '@clerk/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './client';

export function useSupabaseClient(): SupabaseClient | null {
  const { session, isLoaded } = useSession();

  return useMemo(() => {
    if (!isLoaded) return null;
    return createClient(session ?? null);
    // session?.id меняется при смене пользователя/выходе — пересоздаём
    // клиент в этом случае, чтобы не использовать чужой токен.
  }, [isLoaded, session?.id]);
}