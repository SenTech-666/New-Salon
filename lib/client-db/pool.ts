// lib/client-db/pool.ts
//
// Единый пул соединений к базе aptio_client на VPS (Timeweb Cloud).
// Next.js на серверless-платформах создаёт новый процесс на каждый
// запрос, что плодит соединения — но на VPS с обычным Node-сервером
// (а не Vercel Functions) модуль импортируется один раз за жизнь
// процесса, поэтому один Pool на модуль — то, что нужно: переиспользуется
// между запросами, не открывает новое соединение каждый раз.
//
// ВАЖНО: эта база отдельная от Supabase. Никакого RLS, никакого
// auth.jwt() — весь контроль доступа происходит в коде ниже, в
// queries.ts и actions.ts, а не в самой базе.

import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __aptioClientPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    host: process.env.CLIENT_DB_HOST,
    port: Number(process.env.CLIENT_DB_PORT ?? 5432),
    database: process.env.CLIENT_DB_NAME ?? 'aptio_client',
    user: process.env.CLIENT_DB_USER,
    password: process.env.CLIENT_DB_PASSWORD,
    // Timeweb Cloud Postgres обычно требует SSL при подключении не с
    // localhost. Если база и приложение на одном VPS без сети между
    // серверами — можно поставить CLIENT_DB_SSL=false в .env.
    ssl: process.env.CLIENT_DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 10,                      // лимит соединений в пуле — хватает для одного VPS-инстанса
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

// global.__aptioClientPool вместо module-level переменной — переживает
// hot-reload в dev-режиме Next.js (без этого каждый save файла создавал
// бы новый Pool, и старые соединения утекали бы до перезапуска сервера).
//
// ВАЖНО: эта функция создаёт реальное соединение при первом вызове.
// Она вызывается из queries.ts только внутри веток "else" — после
// проверки isMockMode(). Если CLIENT_DB_HOST не задан (нет VPS пока),
// getClientPool() вообще не должен вызываться — иначе pg попытается
// подключиться к undefined-хосту и упадёт с ошибкой соединения.
export function getClientPool(): Pool {
  if (!global.__aptioClientPool) {
    global.__aptioClientPool = createPool();
  }
  return global.__aptioClientPool;
}