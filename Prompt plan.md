# Промт-план: error handling, .env.example, API bookings, e2e тесты

> Скопируйте всё содержимое ниже целиком в Claude Code / агента,
> запущенного в корне проекта salon-next.

---

## Контекст для агента

Это проект Next.js 16 (App Router) + Supabase + Clerk для управления
салонами красоты (мультитенантность). База данных уже рабочая, RLS
политики уже настроены и проверены — **не трогай схему БД, RLS,
таблицы, функции Postgres и ничего в Supabase Dashboard/SQL**. Любые
миграции исключены из задачи.

Задача разбита на 4 части. **Выполняй строго в этом порядке** —
каждая следующая часть зависит от предыдущей (API и тесты используют
error handling, тесты проверяют API).

---

## ЧАСТЬ 1 — `.env.example`

### Что сделать
1. Найди все обращения к `process.env.*` по всему проекту (`grep -r "process.env\." --include="*.ts" --include="*.tsx"`).
2. Создай `.env.example` в корне проекта со всеми найденными переменными.
3. Значения — **не настоящие секреты**, а плейсхолдеры по формату
   (`pk_test_xxx`, `https://xxxxx.supabase.co` и т.п.) или пустая строка.
4. Сгруппируй по сервису с комментариями: Clerk / Supabase / Stripe /
   Resend / прочее.
5. Отдельно отметь комментарием, какие переменные нужны **только на
   сервере** (без `NEXT_PUBLIC_`) и никогда не должны попадать в
   клиентский бандл — особенно `SUPABASE_SERVICE_ROLE_KEY`, если он
   используется.

### Критерий готовности
- [ ] `.env.example` существует, покрывает 100% переменных из кода
- [ ] Ни одного настоящего значения/секрета в файле
- [ ] `.env.local` (реальный) добавлен в `.gitignore`, если ещё не там

---

## ЧАСТЬ 2 — Error handling + логирование

### Что сделать

**2.1. Создать базовые утилиты**
- `lib/logger.ts` — структурированный логгер: `logger.debug/info/warn/error(event, context)`.
  В production выводит JSON-строки в `console.*`, в development — читаемый формат.
  `debug` уровень ничего не пишет в production.
- `lib/errors.ts` — класс `AppError` (code, status, message, details) +
  функция `mapSupabaseError(error)` (маппинг кодов Postgres 23505/23503/23502/42501/PGRST116
  в безопасные пользовательские сообщения) + функция `errorResponse(err, context)`
  для API routes (логирует полную ошибку на сервере, возвращает клиенту
  только безопасное сообщение в формате `{ error: { code, message, details } }`).
- В `lib/errors.ts` добавь также `toUserMessage(error)` — клиентскую
  версию маппинга для использования в `'use client'` компонентах с `toast.error()`.

**2.2. Создать клиентский мост логирования**
- `lib/client-logger.ts` — функция `reportClientError(event, error, context)`,
  отправляющая POST на `/api/log-error` (fire-and-forget, не блокирует UI).
- `app/api/log-error/route.ts` — принимает эти отправки, дописывает `userId`
  из Clerk и вызывает `logger.error()`.

**2.3. Применить к существующим API routes**
Пройди по всем файлам в `app/api/**/route.ts` (включи `gallery/route.ts`,
`photo/route.ts` и любые другие найденные) и для каждого:
- обернуть тело функции в `try { ... } catch (err) { return errorResponse(err, { route: '<METHOD> <путь>' }) }`
- заменить прямые `return Response.json({ error: ... }, { status: ... })` на `throw new AppError(code, message)`
- заменить ошибки Supabase (`if (error) return Response.json(...)`) на `if (error) throw mapSupabaseError(error)`
- убрать все `console.log('=== ... ===')` debug-вставки, заменить на `logger.debug(...)` (для замеров времени) или `logger.error(...)` (для ошибок)
- добавить `logger.info(...)` после успешных операций создания/изменения/удаления значимых сущностей (booking, salon, gallery image и т.п.)

**2.4. Применить к Client Components**
Пройди по компонентам с `toast.error(...)` (приоритет: `BookingsTable.tsx`,
`MastersTable.tsx`, `ServicesTable.tsx`, `SettingsForm.tsx`, `BlocksManager.tsx`,
`ServiceConsumablesEditor.tsx`, формы создания в `app/admin/*/new/page.tsx`):
- замени `toast.error('Ошибка: ' + error.message)` на `toast.error(toUserMessage(error))`
- добавь рядом `reportClientError('<контекст>.<действие>_failed', error, { ...релевантные id })`
- не трогай саму бизнес-логику и структуру компонента, только обработку ошибок

**2.5. Применить к Server Components (страницам)**
В файлах вида `app/admin/*/page.tsx`, где сейчас `console.error(...)` или
ошибка вообще не обрабатывается — замени на `logger.error(event, { error, context })`.
Приоритет: `app/onboarding/page.tsx`, `app/admin/page.tsx`, `app/admin/bookings/page.tsx`.

### Критерий готовности
- [ ] `lib/logger.ts`, `lib/errors.ts`, `lib/client-logger.ts` созданы
- [ ] `app/api/log-error/route.ts` создан и работает
- [ ] Все `app/api/**/route.ts` используют `errorResponse` + `mapSupabaseError`, нет debug `console.log`
- [ ] Минимум 4 приоритетных client-компонента переведены на `toUserMessage` + `reportClientError`
- [ ] `npm run build` проходит без ошибок типов после изменений

---

## ЧАСТЬ 3 — REST API для bookings

### Что сделать

**3.1. Валидация**
- `lib/validation/booking.ts` — zod-схемы: `createBookingSchema`,
  `updateBookingSchema`, `listBookingsQuerySchema` (с пагинацией `page`/`page_size`,
  фильтрами `date`/`date_from`/`date_to`/`master_id`/`status`).

**3.2. Эндпоинты**
- `app/api/bookings/route.ts`:
  - `GET` — список с фильтрами и пагинацией, авторизация через Clerk session
    (используй существующий `lib/supabase/server.ts`, RLS сам ограничит салоном)
  - `POST` — создание записи, валидация через `createBookingSchema`
- `app/api/bookings/[id]/route.ts`:
  - `GET` — одна запись по id
  - `PATCH` — частичное обновление (`updateBookingSchema`)
  - `DELETE` — удаление, ответ `204 No Content`

**3.3. Обязательно использовать инфраструктуру из Части 2**
Все эндпоинты должны быть обёрнуты в `try/catch` с `errorResponse`,
ошибки Supabase — через `mapSupabaseError`, успешные операции —
через `logger.info(...)`. Не изобретай отдельный формат ошибок для этого API.

**3.4. Валидация UUID в [id]/route.ts**
Перед запросом к базе проверь, что `params.id` — валидный UUID
(регулярка), иначе `throw new AppError('validation_error', ...)` —
не давай невалидной строке долетать до Postgres.

**3.5. Не добавлять API-ключи / внешнюю авторизацию**
На этом шаге — **только Clerk session auth** (для использования из
вашей собственной админки/будущего мобильного приложения через тот же
домен). API-ключи для сторонних интеграций — отдельная задача, не
делать сейчас, чтобы не плодить незавершённый функционал.

### Критерий готовности
- [ ] `GET /api/bookings` возвращает список с пагинацией, фильтры работают
- [ ] `POST /api/bookings` создаёт запись, отклоняет невалидные данные с 400 и понятным `error.message`
- [ ] `GET/PATCH/DELETE /api/bookings/[id]` работают, 404 на несуществующий id
- [ ] Без Clerk-сессии все эндпоинты отдают 401
- [ ] Запрос из салона A не может прочитать/изменить booking салона B (проверить вручную через два тестовых аккаунта, либо доверять существующему RLS)

---

## ЧАСТЬ 4 — E2E тесты (Playwright)

### Что сделать

**4.1. Установка**
```bash
npm install -D @playwright/test
npx playwright install chromium
```
Создать `playwright.config.ts` в корне (`testDir: './e2e'`, `baseURL` из `PLAYWRIGHT_BASE_URL` или `http://localhost:3000`, `webServer` поднимает `npm run dev` локально).

**4.2. Написать 3-5 тестов в `e2e/`**

Минимальный набор (без необходимости тестового логина — делай эти первыми):
1. `e2e/landing.spec.ts` — главная страница открывается, ключевые секции видны, поиск работает (если на проекте лендинг с поиском — адаптируй селекторы под реальный DOM, не выдумывай несуществующие data-testid)
2. `e2e/admin-auth-guard.spec.ts` — неавторизованный пользователь редиректится на `/sign-in` с правильным `redirect_url` со всех защищённых роутов (`/admin`, `/master`, `/owner/dashboard`, `/onboarding`)
3. `e2e/api-bookings.spec.ts` — без авторизации `/api/bookings` отдаёт 401; с некорректным телом запроса POST отдаёт 400 с `error.code === 'validation_error'`

Если будет настроен тестовый Clerk-юзер (см. 4.3) — добавь:
4. `e2e/admin-bookings-crud.spec.ts` — залогиненный owner создаёт запись через UI, видит её в списке, подтверждает, отменяет
5. `e2e/api-bookings-crud.spec.ts` — полный create→read→update→delete через сам API (Части 3) с реальной Clerk-сессией или тестовым токеном

**4.3. Тесты с авторизацией — не блокируй остальное**
Создай `e2e/helpers/auth.ts` с функцией `hasTestUser()` (проверяет
наличие `process.env.E2E_TEST_USER_TOKEN`) и `loginAsTestOwner(page)`.
Если тестовый юзер не настроен — тесты 4/5 должны **скипаться**
(`test.skip(!hasTestUser(), '...')`), а не фейлиться. Это даёт
зелёный прогон `npx playwright test` сразу после клонирования
репозитория, даже до настройки Clerk testing.

**4.4. Добавить переменные в `.env.example` (Часть 1)**
`PLAYWRIGHT_BASE_URL`, `E2E_TEST_USER_TOKEN` — допиши, если их там ещё нет.

### Критерий готовности
- [ ] `npx playwright test` запускается и проходит (тесты без авторизации — зелёные, тесты с авторизацией — skipped, если юзер не настроен)
- [ ] Минимум 3 теста реально проверяют поведение приложения (не заглушки вида `expect(true).toBe(true)`)
- [ ] Селекторы в тестах соответствуют реальной разметке проекта (агент должен открыть соответствующие компоненты и свериться с реальными текстами/лейблами, а не угадывать)

---

## Общие правила для агента на всё время выполнения

1. **Не трогать Supabase схему, миграции, RLS-политики, SQL-функции.**
   Если для какой-то части кажется, что нужна новая таблица или
   колонка (например, для API-ключей) — остановиться и сообщить об
   этом, а не создавать миграцию самостоятельно.
2. **Не менять бизнес-логику** существующих компонентов при
   рефакторинге error handling — только обработку ошибок.
3. После каждой части — запускать `npm run build` и убедиться, что
   нет ошибок типов, прежде чем переходить к следующей части.
4. Если в коде встречается ссылка на несуществующий файл/функцию
   (например, `lib/upload-helper.ts`, `lib/plans.ts`) — не выдумывать
   её содержимое заново, а спросить/отметить как блокер.
5. В конце — вывести итоговый список изменённых/созданных файлов по
   каждой части.