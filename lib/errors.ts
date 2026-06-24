// lib/errors.ts
//
// Единая модель ошибок для API routes и server actions.
//
// Проблема, которую это решает: в текущем коде везде паттерн
//   if (error) toast.error('Ошибка: ' + error.message)
// — это (а) течёт детали Postgres/RLS прямо пользователю, (б) не
// логируется структурированно на сервере, (в) несогласовано по форме
// ответа между разными route'ами.
//
// Использование в API route:
//   import { AppError, mapSupabaseError, errorResponse } from '@/lib/errors';
//
//   const { data, error } = await supabase.from('bookings').insert(...);
//   if (error) throw mapSupabaseError(error);
//   ...
//   } catch (err) {
//     return errorResponse(err, { route: 'POST /api/bookings' });
//   }

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export type ErrorCode =
  | 'validation_error'
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'rate_limited'
  | 'internal_error';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal_error: 500,
};

/**
 * AppError — единственный тип ошибки, чьё .message безопасно
 * показывать конечному пользователю. Всё остальное (Postgres errors,
 * unexpected exceptions) логируется полностью на сервере, а клиенту
 * уходит generic-сообщение.
 */
export class AppError extends Error {
  code: ErrorCode;
  status: number;
  /** Дополнительные безопасные для клиента детали (например, какое поле невалидно) */
  details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

/**
 * Маппинг частых Postgres/PostgREST кодов ошибок в AppError.
 * Полный список kодов: https://www.postgresql.org/docs/current/errcodes-summary.html
 */
export function mapSupabaseError(error: {
  code?: string;
  message?: string;
  details?: string | null;
}): AppError {
  switch (error.code) {
    case '23505': // unique_violation
      return new AppError('conflict', 'Запись с такими данными уже существует');
    case '23503': // foreign_key_violation
      return new AppError('validation_error', 'Связанная запись не найдена (проверьте id)');
    case '23502': // not_null_violation
      return new AppError('validation_error', 'Не заполнено обязательное поле');
    case '42501': // insufficient_privilege — обычно означает срабатывание RLS
      return new AppError('forbidden', 'Доступ запрещён');
    case 'PGRST116': // PostgREST: no rows found for .single()
      return new AppError('not_found', 'Запись не найдена');
    default:
      // Неизвестная ошибка БД — не показываем message клиенту (может
      // содержать детали схемы), но сохраняем оригинал для лога.
      return new AppError('internal_error', 'Внутренняя ошибка сервера', {
        originalCode: error.code,
        originalMessage: error.message,
      });
  }
}

/**
 * Унифицированный JSON error response + структурированный лог.
 * AppError -> безопасное сообщение клиенту, status из кода.
 * Любая другая ошибка -> generic 500, полная ошибка только в логах.
 */
export function errorResponse(err: unknown, context?: Record<string, unknown>) {
  if (err instanceof AppError) {
    // 5xx логируем как error, 4xx как warn (это пользовательская ошибка,
    // не инцидент) — так алерты не шумят на каждый невалидный запрос.
    const log = err.status >= 500 ? logger.error : logger.warn;
    log('api.error', { ...context, code: err.code, message: err.message, details: err.details });

    return NextResponse.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status }
    );
  }

  logger.error('api.unhandled_error', { ...context, error: err });
  return NextResponse.json(
    { error: { code: 'internal_error', message: 'Внутренняя ошибка сервера' } },
    { status: 500 }
  );
}
