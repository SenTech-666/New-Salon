// lib/client-db/session.ts
//
// ЗАГЛУШКА. Входа в кабинет клиента пока нет. Эта функция — единственное
// место в коде, которое отвечает на вопрос "кто сейчас смотрит кабинет".
// Когда появится реальный auth (см. шапку SQL-файла — auth_provider/
// auth_subject в таблице clients), здесь поменяется ТОЛЬКО тело этой
// функции: она начнёт читать cookie/JWT и резолвить clientId из него.
// Все Server Actions уже вызывают getCurrentClientId() вместо хардкода —
// переход на настоящий auth не потребует трогать остальной код.
//
// Режимы:
// 1. Postgres не настроен (нет CLIENT_DB_HOST в .env, т.е. VPS/денег
//    пока нет) — возвращается MOCK_CLIENT_ID, и весь queries.ts работает
//    на данных из mock-data.ts. Это сейчас.
// 2. Postgres настроен, но DEMO_CLIENT_ID не задан — ошибка с понятной
//    инструкцией (что делать описано в самом сообщении).
// 3. Всё настроено — возвращается DEMO_CLIENT_ID из .env.

import { MOCK_CLIENT_ID } from './mock-data';

export async function getCurrentClientId(): Promise<string> {
  // Нет подключения к Postgres — работаем полностью на mock-данных,
  // id клиента в этом случае не используется queries.ts для запросов
  // (там тоже проверяется mock-режим), но возвращать что-то осмысленное
  // всё равно нужно, чтобы actions.ts не получал undefined.
  if (!process.env.CLIENT_DB_HOST) {
    return MOCK_CLIENT_ID;
  }

  const demoId = process.env.DEMO_CLIENT_ID;

  if (!demoId) {
    throw new Error(
      'getCurrentClientId(): CLIENT_DB_HOST задан, но DEMO_CLIENT_ID отсутствует. ' +
      'Postgres подключён — теперь нужен id реального клиента в нём. ' +
      'Создайте тестового клиента (sql/002_seed_demo_client.sql) ' +
      'и укажите его id в DEMO_CLIENT_ID.'
    );
  }

  return demoId;
}

// На будущее: когда появится реальный auth, сигнатура расширится,
// например getCurrentClientId(req: NextRequest) или через cookies()
// из 'next/headers' — но имя функции и место вызова в actions.ts
// останутся прежними.