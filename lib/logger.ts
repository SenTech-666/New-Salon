// lib/logger.ts
//
// Минималистичный структурированный логгер без внешних зависимостей.
// В dev печатает читаемо в консоль; в prod — JSON-строки (удобно для
// любого лог-агрегатора: Vercel Logs, Datadog, Logtail и т.д.).
//
// Если заданы LOG_DRAIN_URL/LOG_DRAIN_TOKEN — error-уровень логи
// дополнительно асинхронно отправляются туда (fire-and-forget, не
// блокирует ответ пользователю и не бросает исключение при сбое сети).
//
// Использование:
//   import { logger } from '@/lib/logger';
//   logger.info('booking.created', { bookingId, salonId });
//   logger.error('booking.create_failed', { error, salonId });

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const isProd = process.env.NODE_ENV === 'production';

function serializeContext(context?: LogContext): Record<string, unknown> {
  if (!context) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value instanceof Error) {
      out[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack,
        // AppError-специфичные поля, если есть (см. lib/errors.ts)
        code: (value as any).code,
      };
    } else {
      out[key] = value;
    }
  }
  return out;
}

function write(level: LogLevel, event: string, context?: LogContext) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...serializeContext(context),
  };

  if (isProd) {
    // Один JSON на строку — стандарт для большинства лог-коллекторов.
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  } else {
    const prefix = `[${entry.timestamp}] ${level.toUpperCase()} ${event}`;
    if (level === 'error') console.error(prefix, context ?? '');
    else if (level === 'warn') console.warn(prefix, context ?? '');
    else console.log(prefix, context ?? '');
  }

  if (level === 'error') {
    void drainError(entry);
  }
}

async function drainError(entry: Record<string, unknown>) {
  const url = process.env.LOG_DRAIN_URL;
  const token = process.env.LOG_DRAIN_TOKEN;
  if (!url) return; // не настроено — молча пропускаем, это нормально на старте

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(entry),
      // Не ждём ответ дольше пары секунд и не роняем процесс при таймауте.
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Намеренно глушим: сбой логирования не должен влиять на основной
    // ответ пользователю. Если это произошло — увидим в console.error
    // выше (запись уже была выведена локально).
  }
}

export const logger = {
  debug: (event: string, context?: LogContext) => {
    if (!isProd) write('debug', event, context);
  },
  info: (event: string, context?: LogContext) => write('info', event, context),
  warn: (event: string, context?: LogContext) => write('warn', event, context),
  error: (event: string, context?: LogContext) => write('error', event, context),
};
