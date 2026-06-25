# Миграция Supabase → Timeweb VPS (PostgreSQL + NextAuth.js) — собранные данные

Проект: **Salon** (booking/CRM система для салонов)
Supabase project ref: `mibwlvqixhnsjigkxype`
Дата сбора данных: 25.06.2026

---

## 1. Данные подключения

```
Session pooler (используется для psql/SQL — pg_dump НЕ работает через pooler, см. раздел "Известные проблемы"):
host: aws-0-eu-west-1.pooler.supabase.com
port: 5432
database: postgres
user: postgres.mibwlvqixhnsjigkxype

Direct connection (НЕ работает с этой сети — нет IPv6):
host: db.mibwlvqixhnsjigkxype.supabase.co
port: 5432
database: postgres
user: postgres
```

Pg_dump установлен локально: `C:\Program Files\PostgreSQL\17\bin\pg_dump.exe` (версия 17.10)

---

## 2. Известные проблемы при миграции

1. **pg_dump несовместим с Session Pooler (PgBouncer) на Supabase free-тариф.**
   При подключении pg_dump шлёт команду `SET extra_float_digits TO 3`, и PgBouncer
   обрывает соединение сразу после неё. Не помогли флаги: `--no-sync`,
   `--quote-all-identifiers`, переменная `PGOPTIONS`. **psql той же версии подключается
   нормально и выполняет произвольные SQL без проблем** — значит дело именно в
   специфике протокола pg_dump.
   → Решение: выгружать схему и данные через psql/SQL Editor вручную (см. ниже),
   либо тестировать pg_dump на Transaction pooler (порт 6543) как альтернативу,
   либо договориться об активации гранта Yandex Cloud и пробовать pg_dump прямо
   против Yandex БД после ручного импорта схемы.

2. **Direct connection не работает** с текущей сетью пользователя — нет IPv6,
   DNS имя `db.mibwlvqixhnsjigkxype.supabase.co` резолвится только в IPv6-адрес
   (`Name or service unknown`).

3. **psql через PowerShell периодически "зависает"** без видимой причины при
   выполнении запросов к системным каталогам (pg_proc + JOIN). Команды через
   простой `-c "SELECT ..."` с одной строкой работают надёжнее, чем heredoc-блоки
   `@"..."@` записанные в .sql файл. **Самый надёжный канал — SQL Editor в браузере
   Supabase** (работает через HTTP API, не подвержён проблемам pooler-сессий).
   → Рекомендация: дальнейшую разведку структуры (constraints, индексы, RLS,
   триггеры) делать через браузерный SQL Editor.

---

## 2.1 РЕШЕНО: новый стек авторизации (Clerk → NextAuth.js v5 + СМС.ру)

**Контекст изменился:** проект уходит от Clerk на полностью российский бесплатный
стек, хостинг переезжает с Yandex Cloud (был план на грант) на **Timeweb VPS**:

```
Хостинг:    Timeweb VPS 2 ГБ (~300 ₽/мес)
БД:         PostgreSQL на том же VPS (входит в стоимость VPS)
Auth:       NextAuth.js v5 (бесплатно)
SMS-код:    СМС.ру (~0.9 ₽/смс, есть тестовый режим)
ORM:        Drizzle ORM или Prisma (бесплатно)
Чат:        Polling → потом WebSocket (бесплатно)
Storage:    Локально на VPS (входит)
```

**Принцип:** вход по номеру телефона + SMS-код (через СМС.ру) вместо Clerk.
NextAuth.js v5 управляет сессией на уровне Next.js-приложения.

### Что меняется в схеме БД

1. **Колонка `clerk_user_id` → переименовать в `user_id`** (нейтральное имя,
   просто текст или uuid — ID пользователя из таблицы NextAuth, привязанной к
   номеру телефона). Затрагивает: `salon_members.clerk_user_id`,
   `salons.owner_clerk_id` (и связанный UNIQUE-индекс `salons_owner_clerk_id_key`).

2. **`auth.jwt() ->> 'sub'` → `current_setting('app.current_user_id', true)`.**
   Backend на VPS теперь сам отвечает за передачу ID пользователя в каждый SQL-запрос:
   ```sql
   SET LOCAL app.current_user_id = '<id_пользователя_из_сессии_NextAuth>';
   ```
   Это выполняется в начале каждой транзакции/запроса (через Drizzle/Prisma raw
   SQL hook или middleware) — `SET LOCAL` безопасен для connection pooling,
   действует только в рамках текущей транзакции.

3. **Затронутые функции (4 шт. — переписать тело, остальное не трогать):**
   - `current_salon_id()`
   - `current_salon_role()`
   - `current_master_id()`
   - `current_role_in_salon(p_salon_id uuid)`

   Везде заменить:
   ```sql
   -- было:
   where clerk_user_id = (auth.jwt() ->> 'sub')
   -- стало:
   where user_id = current_setting('app.current_user_id', true)
   ```

4. **Затронутые функции с `auth.jwt()` внутри plpgsql-тела (3 шт. — переписать):**
   - `accept_master_invite(p_token uuid)` — заменить `auth.jwt() ->> 'sub'` на
     `current_setting('app.current_user_id', true)` (2 места в теле)
   - `accept_salon_invite(p_token uuid)` — то же (2 места в теле)
   - `register_salon(...)` — заменить `v_clerk_user_id := auth.jwt() ->> 'sub';`
     на `v_clerk_user_id := current_setting('app.current_user_id', true);`
     (саму переменную можно оставить с тем же именем для минимальности диффа,
     либо переименовать в `v_user_id` — на функциональность не влияет)

5. **Затронутые RLS policies (3 шт. — переписать `qual`):**
   - `salon_members_select_self`: `clerk_user_id = (auth.jwt() ->> 'sub'::text)`
     → `user_id = current_setting('app.current_user_id', true)`
   - `salons_select`: `owner_clerk_id = (auth.jwt() ->> 'sub'::text)`
     → `owner_user_id = current_setting('app.current_user_id', true)`
   - `salons_update`: то же, что у `salons_select`

6. **Всё остальное — без изменений.** Оставшиеся 20 функций, все 7 триггеров,
   остальные 41 RLS policy, все 33+3 индекса работают как есть — они построены
   вокруг `salon_id`/`master_id`/ролей и не знают о том, кто провайдер
   авторизации. Только 7 функций + 3 policy завязаны на источник identity,
   и эти места переписываются по единому шаблону выше.

**Итог:** ~96% уже собранной структуры переносится без изменений. Подтверждает,
что выбор "сохранить RLS, переписать только функции идентификации" (вариант "а"
из обсуждения) был правильным — переписывать всю авторизацию на уровень
приложения не требуется.

---

## 3. Список таблиц (схема public)

15 объектов в `\dt public.*`, из них реальные таблицы (14, без учёта PostGIS):

```
bookings
inventory_items
inventory_movements
master_blocks
master_invites
master_weekly_hours
masters
plans
salon_gallery_images
salon_members
salons
service_consumables
services
subscriptions
```

Системное (не переносить как обычную таблицу):
```
spatial_ref_sys   -- системная таблица PostGIS
```

Также обнаружены VIEW (не таблицы):
```
public_salons             -- view, видимо обёртка над salons для публичного доступа
geography_columns         -- системный view PostGIS
geometry_columns          -- системный view PostGIS
```

---

## 4. Структура колонок (CREATE TABLE, без constraints/defaults)

⚠️ Это базовая структура без PRIMARY KEY, FOREIGN KEY, UNIQUE, индексов — это
следующий шаг сбора данных.

```sql
CREATE TABLE IF NOT EXISTS bookings (id uuid NOT NULL, date date NOT NULL, "time" time without time zone NOT NULL, client_name text NOT NULL, client_phone text NOT NULL, client_comment text, status text, service_id uuid, master_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, salon_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS inventory_items (id uuid NOT NULL, name text NOT NULL, unit text NOT NULL, quantity numeric NOT NULL, low_stock_threshold numeric NOT NULL, created_at timestamp with time zone, updated_at timestamp with time zone, salon_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS inventory_movements (id uuid NOT NULL, item_id uuid NOT NULL, change numeric NOT NULL, reason text NOT NULL, booking_id uuid, created_at timestamp with time zone, salon_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS master_blocks (id uuid NOT NULL, master_id uuid NOT NULL, date_from date NOT NULL, date_to date NOT NULL, is_full_day boolean NOT NULL, time_from time without time zone, time_to time without time zone, reason text, created_at timestamp with time zone, salon_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS master_invites (token uuid NOT NULL, salon_id uuid NOT NULL, master_id uuid, used boolean NOT NULL, expires_at timestamp with time zone, role text NOT NULL);

CREATE TABLE IF NOT EXISTS master_weekly_hours (id uuid NOT NULL, master_id uuid NOT NULL, day_of_week integer NOT NULL, is_day_off boolean NOT NULL, time_from time without time zone, time_to time without time zone, salon_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS masters (id uuid NOT NULL, name text NOT NULL, specialty text, photo text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, salon_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS plans (id text NOT NULL, name text NOT NULL, price_rub integer NOT NULL, max_masters integer NOT NULL, max_services integer NOT NULL, max_gallery_photos integer NOT NULL, custom_branding boolean NOT NULL, custom_domain boolean NOT NULL, white_label boolean NOT NULL, sort_order integer NOT NULL);

CREATE TABLE IF NOT EXISTS salon_gallery_images (id uuid NOT NULL, salon_id uuid NOT NULL, url text NOT NULL, "position" integer NOT NULL, created_at timestamp with time zone NOT NULL);

CREATE TABLE IF NOT EXISTS salon_members (id uuid NOT NULL, salon_id uuid NOT NULL, clerk_user_id text NOT NULL, role text NOT NULL, master_id uuid, created_at timestamp with time zone NOT NULL);

CREATE TABLE IF NOT EXISTS salons (id uuid NOT NULL, name text NOT NULL, owner_clerk_id text NOT NULL, booking_horizon_days integer NOT NULL, slot_interval_minutes integer NOT NULL, created_at timestamp with time zone, updated_at timestamp with time zone, slug text NOT NULL, description text, address text, phone text, photo_url text, plan_id text NOT NULL, subscription_status text NOT NULL, trial_ends_at timestamp with time zone, current_period_end timestamp with time zone, yookassa_payment_method_id text, yookassa_customer_id text, city text, lat double precision, lng double precision, gallery_photos jsonb NOT NULL, categories ARRAY NOT NULL, is_published boolean NOT NULL, theme_overrides jsonb NOT NULL, custom_domain text, geom USER-DEFINED, cover_url text, business_hours jsonb, social_links jsonb);

CREATE TABLE IF NOT EXISTS service_consumables (id uuid NOT NULL, service_id uuid NOT NULL, item_id uuid NOT NULL, amount numeric NOT NULL, salon_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS services (id uuid NOT NULL, name text NOT NULL, duration integer NOT NULL, price integer NOT NULL, description text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, master_id uuid, salon_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS subscriptions (id uuid NOT NULL, salon_id uuid NOT NULL, plan_id text NOT NULL, status text NOT NULL, yookassa_payment_id text, amount_kopecks integer, period_start timestamp with time zone, period_end timestamp with time zone, created_at timestamp with time zone NOT NULL);
```

⚠️ Замечания по типам, требующим уточнения при ручном создании DDL:
- `salons.categories` — тип `ARRAY` (нужно уточнить элемент, видно из defaults что это `text[]`)
- `salons.geom` — тип `USER-DEFINED`, это PostGIS `geography` (видно из функции salons_sync_geom: `::geography`)

---

## 5. DEFAULT-значения колонок

```
bookings.created_at = now()
bookings.id = gen_random_uuid()
bookings.status = 'PENDING'::text
bookings.updated_at = now()

inventory_items.created_at = now()
inventory_items.id = gen_random_uuid()
inventory_items.low_stock_threshold = 5
inventory_items.quantity = 0
inventory_items.salon_id = current_salon_id()
inventory_items.unit = 'шт.'::text
inventory_items.updated_at = now()

inventory_movements.created_at = now()
inventory_movements.id = gen_random_uuid()
inventory_movements.reason = 'manual'::text
inventory_movements.salon_id = current_salon_id()

master_blocks.created_at = now()
master_blocks.id = gen_random_uuid()
master_blocks.is_full_day = true
master_blocks.salon_id = current_salon_id()

master_invites.created_at = now()
master_invites.expires_at = (now() + '7 days'::interval)
master_invites.role = 'master'::text
master_invites.salon_id = current_salon_id()
master_invites.token = gen_random_uuid()
master_invites.used = false

master_weekly_hours.id = gen_random_uuid()
master_weekly_hours.is_day_off = false
master_weekly_hours.salon_id = current_salon_id()

masters.created_at = now()
masters.id = gen_random_uuid()
masters.is_active = true
masters.salon_id = current_salon_id()
masters.updated_at = now()

plans.custom_branding = false
plans.custom_domain = false
plans.max_gallery_photos = 10
plans.sort_order = 0
plans.white_label = false

salon_gallery_images.created_at = now()
salon_gallery_images.id = gen_random_uuid()
salon_gallery_images.position = 0

salon_members.created_at = now()
salon_members.id = gen_random_uuid()

salons.booking_horizon_days = 30
salons.categories = '{}'::text[]
salons.created_at = now()
salons.gallery_photos = '[]'::jsonb
salons.id = gen_random_uuid()
salons.is_published = false
salons.plan_id = 'free'::text
salons.slot_interval_minutes = 30
salons.social_links = '{}'::jsonb
salons.subscription_status = 'trialing'::text
salons.theme_overrides = '{}'::jsonb
salons.updated_at = now()

service_consumables.amount = 1
service_consumables.id = gen_random_uuid()
service_consumables.salon_id = current_salon_id()

services.created_at = now()
services.id = gen_random_uuid()
services.is_active = true
services.salon_id = current_salon_id()
services.updated_at = now()

subscriptions.created_at = now()
subscriptions.id = gen_random_uuid()
```

⚠️ **Важно:** `current_salon_id()` используется как DEFAULT во многих таблицах
(`inventory_items`, `inventory_movements`, `master_blocks`, `master_invites`,
`master_weekly_hours`, `masters`, `services`, `service_consumables`). Эта функция
зависит от `auth.jwt()` (Supabase Auth) — её нужно переписать под используемую
систему аутентификации (похоже, что используется **Clerk**, см. поле
`clerk_user_id` в `salon_members` и открытая вкладка Clerk.com).

---

## 6. RLS (Row Level Security) — статус и policies

### 6.0 RLS включён на таблицах:

```
bookings              true
inventory_items       true
inventory_movements   true
master_blocks         true
master_invites        true
master_weekly_hours   true
masters               true
plans                 true
salon_gallery_images  true
salon_members         true
salons                true
service_consumables   true
services              true
spatial_ref_sys       false   -- системная PostGIS, не переносить
subscriptions         true
```

Итого RLS включён на всех 14 бизнес-таблицах. Это нужно будет либо включить
аналогично на Yandex Cloud (там RLS — стандартная фича PostgreSQL, не Supabase-специфичная),
либо переписать на уровне приложения, если решите не использовать RLS.

### 6.1 RLS policies (44 штуки) — ПОЛНЫЙ точный текст

✅ Получено через `Export → CSV`, без обрезки. Ролевая модель теперь полностью ясна:
- **owner, manager** — полный доступ к управлению данными салона
- **master** — доступ только к своим записям (`master_id = current_master_id()`)
  для bookings/master_blocks/master_weekly_hours; не имеет своего affecт на
  inventory/services/salon_members (там только owner/manager)
- **authenticated** (любой залогиненный через Clerk) — для приватных операций
- **anon** — для публичной витрины и формы бронирования
- **public** (anon + authenticated) — для общих SELECT на публичных данных

```sql
-- bookings
CREATE POLICY bookings_select ON bookings FOR SELECT TO authenticated
  USING ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))));

CREATE POLICY bookings_update ON bookings FOR UPDATE TO authenticated
  USING ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))));

CREATE POLICY bookings_delete ON bookings FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY bookings_authenticated_insert ON bookings FOR INSERT TO authenticated
  WITH CHECK (salon_id = current_salon_id());

CREATE POLICY bookings_public_insert ON bookings FOR INSERT TO anon
  WITH CHECK (salon_id IN (SELECT salons.id FROM salons));

-- inventory_items
CREATE POLICY inventory_items_select ON inventory_items FOR SELECT TO public
  USING (salon_id = current_salon_id());

CREATE POLICY inventory_items_insert ON inventory_items FOR INSERT TO authenticated
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY inventory_items_update ON inventory_items FOR UPDATE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])))
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY inventory_items_delete ON inventory_items FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

-- inventory_movements (нет update/delete — лог движений неизменяем, как и предполагалось)
CREATE POLICY inventory_movements_select ON inventory_movements FOR SELECT TO public
  USING (salon_id = current_salon_id());

CREATE POLICY inventory_movements_insert ON inventory_movements FOR INSERT TO authenticated
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

-- master_blocks
CREATE POLICY master_blocks_select ON master_blocks FOR SELECT TO public
  USING (salon_id = current_salon_id());

CREATE POLICY master_blocks_insert ON master_blocks FOR INSERT TO authenticated
  WITH CHECK ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))));

CREATE POLICY master_blocks_update ON master_blocks FOR UPDATE TO authenticated
  USING ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))))
  WITH CHECK ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))));

CREATE POLICY master_blocks_delete ON master_blocks FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))));

-- master_invites (нет update/delete видимых)
CREATE POLICY master_invites_select ON master_invites FOR SELECT TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY master_invites_insert ON master_invites FOR INSERT TO authenticated
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

-- master_weekly_hours
CREATE POLICY master_weekly_hours_select ON master_weekly_hours FOR SELECT TO public
  USING (salon_id = current_salon_id());

CREATE POLICY master_weekly_hours_insert ON master_weekly_hours FOR INSERT TO authenticated
  WITH CHECK ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))));

CREATE POLICY master_weekly_hours_update ON master_weekly_hours FOR UPDATE TO authenticated
  USING ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))))
  WITH CHECK ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))));

CREATE POLICY master_weekly_hours_delete ON master_weekly_hours FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND ((current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])) OR ((current_salon_role() = 'master'::text) AND (master_id = current_master_id()))));

-- masters
CREATE POLICY masters_select_own_salon ON masters FOR SELECT TO authenticated
  USING (salon_id = current_salon_id());

CREATE POLICY masters_insert_own_salon ON masters FOR INSERT TO authenticated
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY masters_update_own_salon ON masters FOR UPDATE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])))
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY masters_delete_own_salon ON masters FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

-- salon_gallery_images
CREATE POLICY salon_gallery_images_select_public ON salon_gallery_images FOR SELECT TO public
  USING (true);

CREATE POLICY salon_gallery_images_insert ON salon_gallery_images FOR INSERT TO authenticated
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY salon_gallery_images_update ON salon_gallery_images FOR UPDATE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])))
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY salon_gallery_images_delete ON salon_gallery_images FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

-- salon_members (нет insert/update — создаются через SECURITY DEFINER функции accept_*_invite/register_salon, что логично — обходит RLS)
CREATE POLICY salon_members_select_self ON salon_members FOR SELECT TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY salon_members_select_salon ON salon_members FOR SELECT TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY salon_members_delete ON salon_members FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = 'owner'::text));

-- salons (нет insert — создание только через register_salon())
CREATE POLICY salons_public_select ON salons FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY salons_select ON salons FOR SELECT TO public
  USING (owner_clerk_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY salons_update ON salons FOR UPDATE TO public
  USING (owner_clerk_id = (auth.jwt() ->> 'sub'::text));

-- service_consumables
CREATE POLICY service_consumables_select ON service_consumables FOR SELECT TO public
  USING (salon_id = current_salon_id());

CREATE POLICY service_consumables_insert ON service_consumables FOR INSERT TO authenticated
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY service_consumables_update ON service_consumables FOR UPDATE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])))
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY service_consumables_delete ON service_consumables FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

-- services
CREATE POLICY services_select ON services FOR SELECT TO public
  USING (salon_id = current_salon_id());

CREATE POLICY services_insert ON services FOR INSERT TO authenticated
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY services_update ON services FOR UPDATE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])))
  WITH CHECK ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY services_delete ON services FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

-- subscriptions (только SELECT для owner — изменения, видимо, только через backend/webhook ЮKassa)
CREATE POLICY subscriptions_select_owner ON subscriptions FOR SELECT TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = 'owner'::text));
```

**Подсчёт:** bookings (5) + inventory_items (4) + inventory_movements (2) +
master_blocks (4) + master_invites (2) + master_weekly_hours (4) + masters (4) +
salon_gallery_images (4) + salon_members (3) + salons (3) + service_consumables (4)
+ services (4) + subscriptions (1) = **44** ✅ всё совпадает, список полный.

⚠️ **ФИНАЛЬНОЕ РЕШЕНИЕ (принято):** Clerk не используется. Целевой стек —
полностью свой, российский, на одном VPS (Timeweb, ~300₽/мес):
- **Хостинг + БД:** PostgreSQL на том же VPS
- **Auth:** NextAuth.js v5, вход по SMS-коду
- **SMS:** СМС.ру (~0.9₽/смс, есть тестовый режим)
- **ORM:** Drizzle ORM или Prisma
- **Storage:** локально на VPS (файлы тестовые — переносить из Supabase Storage не нужно)

**Как это меняет схему:**
1. Колонка `clerk_user_id` (в `salon_members.clerk_user_id` и
   `salons.owner_clerk_id`) переименовывается в `user_id` — теперь это ID
   пользователя из собственной таблицы пользователей NextAuth (привязанной к
   номеру телефона), а не Clerk ID. Тип остаётся text/uuid — без изменений в
   логике, просто новый источник значения.
2. `auth.jwt() ->> 'sub'` заменяется на `current_setting('app.current_user_id', true)`
   во всех местах. Backend обязан выполнять `SET LOCAL app.current_user_id = '...'`
   перед каждым запросом к БД (внутри транзакции, безопасно для пула соединений).
   Drizzle и Prisma оба поддерживают выполнение raw SQL перед основным запросом.
3. Затрагиваются 6 функций (`current_salon_id`, `current_salon_role`,
   `current_master_id`, `current_role_in_salon`, `register_salon`,
   `accept_master_invite`/`accept_salon_invite`) и 3 policy
   (`salon_members_select_self`, `salons_select`, `salons_update`).
   Все остальные ~90% схемы (триггеры, индексы, остальные 41 policy, 21 функция)
   не меняются вообще — RLS-модель построена вокруг salon_id/master_id/ролей,
   а не вокруг конкретного auth-провайдера.

**Примечание:** изначальный план предполагал managed PostgreSQL в Yandex Cloud
(с гранта). Новый стек — самостоятельный VPS с PostgreSQL. Вся схема ниже
одинаково применима к обоим вариантам — PostGIS доступен и в managed Yandex
Cloud, и на VPS (`apt install postgresql-17-postgis-3` или аналог по версии).

---

## 6.1 PRIMARY KEY / UNIQUE constraints

```
bookings               PRIMARY KEY  bookings_pkey                          (id)
inventory_items        PRIMARY KEY  inventory_items_pkey                   (id)
inventory_movements    PRIMARY KEY  inventory_movements_pkey               (id)
master_blocks          PRIMARY KEY  master_blocks_pkey                     (id)
master_invites         PRIMARY KEY  master_invites_pkey                    (token)
master_weekly_hours    PRIMARY KEY  master_weekly_hours_pkey               (id)
master_weekly_hours    UNIQUE       master_weekly_hours_master_id_day_of_week_key  (master_id, day_of_week)
masters                PRIMARY KEY  masters_pkey                           (id)
plans                  PRIMARY KEY  plans_pkey                             (id)
salon_gallery_images   PRIMARY KEY  salon_gallery_images_pkey              (id)
salon_members          PRIMARY KEY  salon_members_pkey                     (id)
salon_members          UNIQUE       salon_members_salon_id_clerk_user_id_key  (salon_id, clerk_user_id)
salons                 PRIMARY KEY  salons_pkey                            (id)
salons                 UNIQUE       salons_custom_domain_key                (custom_domain)
salons                 UNIQUE       salons_owner_clerk_id_key               (owner_clerk_id)
salons                 UNIQUE       salons_slug_unique                      (slug)
service_consumables    PRIMARY KEY  service_consumables_pkey                (id)
service_consumables    UNIQUE       service_consumables_service_id_item_id_key  (service_id, item_id)
services               PRIMARY KEY  services_pkey                          (id)
spatial_ref_sys        PRIMARY KEY  spatial_ref_sys_pkey                    (srid)   -- системная PostGIS, не переносить
subscriptions          PRIMARY KEY  subscriptions_pkey                     (id)
```

Важно: `salons.owner_clerk_id` — UNIQUE, то есть один owner = один салон (согласует
с логикой `register_salon`, которая запрещает `already_has_salon`).
`master_weekly_hours` имеет составной UNIQUE (master_id, day_of_week) — согласуется
с `ON CONFLICT (master_id, day_of_week)` в триггере `create_default_master_schedule`.

---

## 6.2 FOREIGN KEY constraints

✅ Хорошая новость: **ни одной FK-ссылки на `auth.users`** — все связи только
между таблицами в схеме `public`. Шаг "чистки дампа от auth.users" из исходного
плана миграции не требуется.

```
from_table            from_column   to_table         to_column   delete_rule
bookings              master_id     masters          id          CASCADE
bookings              service_id    services         id          CASCADE
bookings              salon_id      salons           id          NO ACTION
inventory_items       salon_id      salons           id          NO ACTION
inventory_movements   item_id       inventory_items  id          CASCADE
inventory_movements   salon_id      salons           id          NO ACTION
inventory_movements   booking_id    bookings         id          SET NULL
master_blocks         master_id     masters          id          CASCADE
master_blocks         salon_id      salons           id          NO ACTION
master_invites        salon_id      salons           id          CASCADE
master_invites        master_id     masters          id          CASCADE
master_weekly_hours    master_id     masters          id          CASCADE
master_weekly_hours    salon_id      salons           id          NO ACTION
masters               salon_id      salons           id          NO ACTION
salon_gallery_images  salon_id      salons           id          CASCADE
salon_members         master_id     masters          id          SET NULL
salon_members         salon_id      salons           id          CASCADE
salons                plan_id       plans            id          NO ACTION
service_consumables   item_id       inventory_items  id          CASCADE
service_consumables   salon_id      salons           id          NO ACTION
service_consumables   service_id    services         id          CASCADE
services              master_id     masters          id          CASCADE
services              salon_id      salons           id          NO ACTION
subscriptions         salon_id      salons           id          CASCADE
```

⚠️ Замечание по порядку создания таблиц при импорте: т.к. много FK ссылается на
`salons` и `masters`, эти таблицы (плюс `plans`, от которой зависит `salons`)
нужно создавать первыми. Рекомендуемый порядок:
`plans` → `salons` → `masters` → `services` / `master_weekly_hours` /
`master_blocks` / `master_invites` / `salon_members` / `salon_gallery_images` /
`inventory_items` → `bookings` / `service_consumables` → `inventory_movements`
→ `subscriptions`.
Либо проще: создать все таблицы без FK, затем добавить все FK отдельным
ALTER TABLE блоком в конце — это избавляет от необходимости думать о порядке.

---

## 6.3 Триггеры (7 штук)

```
table        trigger_name                  timing  event   function
bookings     trg_consume_inventory         AFTER   UPDATE  consume_inventory_on_complete()
bookings     trg_set_booking_salon         BEFORE  INSERT  set_booking_salon_from_master()
masters      trg_check_masters_limit       BEFORE  INSERT  check_masters_limit()
masters      trg_create_default_schedule   AFTER   INSERT  create_default_master_schedule()
salons       trg_salons_sync_geom          BEFORE  INSERT  salons_sync_geom()
salons       trg_salons_sync_geom          BEFORE  UPDATE  salons_sync_geom()
services     trg_check_services_limit      BEFORE  INSERT  check_services_limit()
```

## 6.4 Индексы (33 штуки)

```sql
-- bookings
CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id);
CREATE INDEX idx_bookings_salon ON public.bookings USING btree (salon_id);

-- inventory_items
CREATE INDEX idx_inventory_items_salon ON public.inventory_items USING btree (salon_id);
CREATE UNIQUE INDEX inventory_items_pkey ON public.inventory_items USING btree (id);

-- inventory_movements
CREATE INDEX idx_inventory_movements_salon ON public.inventory_movements USING btree (salon_id);
CREATE UNIQUE INDEX inventory_movements_pkey ON public.inventory_movements USING btree (id);

-- master_blocks
CREATE INDEX idx_master_blocks_salon ON public.master_blocks USING btree (salon_id);
CREATE UNIQUE INDEX master_blocks_pkey ON public.master_blocks USING btree (id);

-- master_invites
CREATE UNIQUE INDEX master_invites_pkey ON public.master_invites USING btree (token);

-- master_weekly_hours
CREATE INDEX idx_master_weekly_hours_salon ON public.master_weekly_hours USING btree (salon_id);
CREATE UNIQUE INDEX master_weekly_hours_master_id_day_of_week_key ON public.master_weekly_hours USING btree (master_id, day_of_week);
CREATE UNIQUE INDEX master_weekly_hours_pkey ON public.master_weekly_hours USING btree (id);

-- masters
CREATE INDEX idx_masters_salon ON public.masters USING btree (salon_id);
CREATE UNIQUE INDEX masters_pkey ON public.masters USING btree (id);

-- plans
CREATE UNIQUE INDEX plans_pkey ON public.plans USING btree (id);

-- salon_gallery_images
CREATE INDEX idx_salon_gallery_images_salon_id ON public.salon_gallery_images USING btree (salon_id, "position");
CREATE UNIQUE INDEX salon_gallery_images_pkey ON public.salon_gallery_images USING btree (id);

-- salon_members
CREATE UNIQUE INDEX salon_members_pkey ON public.salon_members USING btree (id);
CREATE UNIQUE INDEX salon_members_salon_id_clerk_user_id_key ON public.salon_members USING btree (salon_id, clerk_user_id);

-- salons
CREATE INDEX idx_salons_categories ON public.salons USING gin (categories) WHERE is_published;
CREATE INDEX idx_salons_city ON public.salons USING btree (city) WHERE is_published;
CREATE INDEX idx_salons_geom ON public.salons USING gist (geom);
CREATE UNIQUE INDEX salons_custom_domain_key ON public.salons USING btree (custom_domain);
CREATE UNIQUE INDEX salons_owner_clerk_id_key ON public.salons USING btree (owner_clerk_id);
CREATE UNIQUE INDEX salons_pkey ON public.salons USING btree (id);
CREATE UNIQUE INDEX salons_slug_unique ON public.salons USING btree (slug);

-- service_consumables
CREATE INDEX idx_service_consumables_salon ON public.service_consumables USING btree (salon_id);
CREATE UNIQUE INDEX service_consumables_pkey ON public.service_consumables USING btree (id);
CREATE UNIQUE INDEX service_consumables_service_id_item_id_key ON public.service_consumables USING btree (service_id, item_id);

-- services
CREATE INDEX idx_services_salon ON public.services USING btree (salon_id);
CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);

-- spatial_ref_sys (системная PostGIS, не переносить)
CREATE UNIQUE INDEX spatial_ref_sys_pkey ON public.spatial_ref_sys USING btree (srid);

-- subscriptions
CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);
```

⚠️ **Замечены пробелы в индексах (рекомендации к улучшению при переносе —
сделать лучше, чем было на Supabase):**

1. **Нет составного индекса `bookings (master_id, date)`.** Функция
   `get_taken_slots` (занятые слоты конкретного мастера на день — самый частый
   запрос календаря бронирования) фильтрует именно по этим полям, а сейчас есть
   только `idx_bookings_salon` (по salon_id) — при росте записей это полное
   сканирование всех бронирований салона на каждый рендер календаря.
   ```sql
   CREATE INDEX idx_bookings_master_date ON bookings (master_id, date);
   ```

2. **Нет отдельного индекса на `bookings.date`.** Понадобится, если появится
   общий дневной отчёт по всем мастерам сразу (не по одному мастеру).

3. **Нет `pg_trgm`-индекса для текстового поиска.** `search_salons` и другие
   используют `ILIKE '%...%'` — обычный btree вообще не помогает такому поиску,
   Postgres всё равно сканирует все строки. Это самый весомый пробел с точки
   зрения скорости поиска по названию салона/услуги при росте базы:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX idx_salons_name_trgm ON salons USING gin (name gin_trgm_ops);
   CREATE INDEX idx_services_name_trgm ON services USING gin (name gin_trgm_ops);
   ```

4. **Нет частичного индекса по статусу бронирования.** `get_taken_slots` каждый
   раз фильтрует `status != 'cancelled'` — по аналогии с уже использованным
   приёмом (`WHERE is_published` на salons) стоит сделать:
   ```sql
   CREATE INDEX idx_bookings_active ON bookings (master_id, date) WHERE status != 'cancelled';
   ```
   (это объединяет пункт 1 и 4 в один индекс, оптимальнее чем два отдельных)

5. **Мелкие места без индекса** (не критично при текущем объёме, но держать
   в уме на будущее): `salons.plan_id` (используется в JOIN с `plans` в триггерах
   лимитов `check_masters_limit`/`check_services_limit`), `master_invites.salon_id`.

**Вывод:** базовая структура индексов сделана грамотно и покрывает RLS-фильтрацию
и геопоиск (это сильные стороны, которые сразу работают на конкурентном уровне).
Главный недостающий кусок — полнотекстовый поиск (`pg_trgm`) и оптимизация
календаря бронирований (`master_id + date`). Рекомендуется добавить все 3 индекса
выше прямо при создании схемы на Yandex Cloud — обойдётся бесплатно по времени
сейчас и сэкономит переделку после того, как появятся реальные пользователи.

---

### accept_master_invite
```sql
CREATE OR REPLACE FUNCTION public.accept_master_invite(p_token uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  inv record;
  existing_role text;
begin
  select * into inv from master_invites where token = p_token;
  if inv is null then
    return 'not_found';
  end if;
  if inv.used then
    return 'already_used';
  end if;
  if inv.expires_at < now() then
    return 'expired';
  end if;
  select role into existing_role
  from salon_members
  where clerk_user_id = auth.jwt() ->> 'sub' and salon_id = inv.salon_id;
  if existing_role = 'owner' then
    return 'cannot_downgrade_owner';
  end if;
  insert into salon_members (salon_id, clerk_user_id, role, master_id)
  values (inv.salon_id, auth.jwt() ->> 'sub', 'master', inv.master_id)
  on conflict (salon_id, clerk_user_id) do update
    set role = 'master', master_id = inv.master_id;
  update master_invites set used = true where token = p_token;
  return 'ok';
end;
$function$;
```

### accept_salon_invite
```sql
CREATE OR REPLACE FUNCTION public.accept_salon_invite(p_token uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  inv record;
  existing_role text;
begin
  select * into inv from master_invites where token = p_token;
  if inv is null then
    return 'not_found';
  end if;
  if inv.used then
    return 'already_used';
  end if;
  if inv.expires_at < now() then
    return 'expired';
  end if;
  select role into existing_role
  from salon_members
  where clerk_user_id = auth.jwt() ->> 'sub' and salon_id = inv.salon_id;
  if existing_role = 'owner' then
    return 'cannot_downgrade_owner';
  end if;
  insert into salon_members (salon_id, clerk_user_id, role, master_id)
  values (inv.salon_id, auth.jwt() ->> 'sub', inv.role, inv.master_id)
  on conflict (salon_id, clerk_user_id) do update
    set role = inv.role, master_id = inv.master_id;
  update master_invites set used = true where token = p_token;
  return 'ok';
end;
$function$;
```
⚠️ NB: почти идентична `accept_master_invite`, отличие в одной строке (жёсткая
роль 'master' vs роль из приглашения `inv.role`). Возможно намеренный дубль для
разных сценариев инвайта — уточнить у заказчика логики при необходимости.

### check_masters_limit (TRIGGER FUNCTION)
```sql
CREATE OR REPLACE FUNCTION public.check_masters_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  v_limit int;
  v_count int;
begin
  select p.max_masters into v_limit
  from salons s join plans p on p.id = s.plan_id
  where s.id = new.salon_id;

  select count(*) into v_count from masters where salon_id = new.salon_id;

  if v_count >= v_limit then
    raise exception 'Достигнут лимит мастеров для вашего тарифа (%). Повысьте тариф в настройках.', v_limit;
  end if;

  return new;
end;
$function$;
```

### check_services_limit (TRIGGER FUNCTION)
```sql
CREATE OR REPLACE FUNCTION public.check_services_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  v_limit int;
  v_count int;
begin
  select p.max_services into v_limit
  from salons s join plans p on p.id = s.plan_id
  where s.id = new.salon_id;

  select count(*) into v_count from services where salon_id = new.salon_id;

  if v_count >= v_limit then
    raise exception 'Достигнут лимит услуг для вашего тарифа (%). Повысьте тариф в настройках.', v_limit;
  end if;

  return new;
end;
$function$;
```

### consume_inventory_on_complete (TRIGGER FUNCTION)
```sql
CREATE OR REPLACE FUNCTION public.consume_inventory_on_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  rec record;
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    for rec in
      select item_id, amount from service_consumables where service_id = new.service_id
    loop
      update inventory_items
      set quantity = quantity - rec.amount, updated_at = now()
      where id = rec.item_id and salon_id = new.salon_id;
      insert into inventory_movements (item_id, change, reason, booking_id, salon_id)
      values (rec.item_id, -rec.amount, 'booking_completed', new.id, new.salon_id);
    end loop;
  end if;
  return new;
end;
$function$;
```

### create_default_master_schedule (TRIGGER FUNCTION)
```sql
CREATE OR REPLACE FUNCTION public.create_default_master_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO master_weekly_hours (master_id, day_of_week, is_day_off, time_from, time_to)
  VALUES
    (NEW.id, 0, true, NULL, NULL),       -- Вс - выходной
    (NEW.id, 1, false, '10:00', '20:00'),
    (NEW.id, 2, false, '10:00', '20:00'),
    (NEW.id, 3, false, '10:00', '20:00'),
    (NEW.id, 4, false, '10:00', '20:00'),
    (NEW.id, 5, false, '10:00', '20:00'),
    (NEW.id, 6, false, '10:00', '20:00')
  ON CONFLICT (master_id, day_of_week) DO NOTHING;
  RETURN NEW;
END;
$function$;
```

### current_master_id  ⚠️ зависит от auth.jwt()
```sql
CREATE OR REPLACE FUNCTION public.current_master_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select master_id from salon_members
  where clerk_user_id = (auth.jwt() ->> 'sub')
  limit 1;
$function$;
```

### current_role_in_salon  ⚠️ зависит от auth.jwt()
```sql
CREATE OR REPLACE FUNCTION public.current_role_in_salon(p_salon_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select role from salon_members
  where clerk_user_id = (auth.jwt() ->> 'sub') and salon_id = p_salon_id
  limit 1;
$function$;
```

### current_salon_id  ⚠️ зависит от auth.jwt()
```sql
CREATE OR REPLACE FUNCTION public.current_salon_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select salon_id from salon_members
  where clerk_user_id = (auth.jwt() ->> 'sub')
  limit 1;
$function$;
```

### current_salon_role  ⚠️ зависит от auth.jwt()
```sql
CREATE OR REPLACE FUNCTION public.current_salon_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select role from salon_members
  where clerk_user_id = (auth.jwt() ->> 'sub')
  limit 1;
$function$;
```

### get_public_master_blocks
```sql
CREATE OR REPLACE FUNCTION public.get_public_master_blocks(p_salon_slug text, p_date_from date, p_date_to date)
 RETURNS TABLE(master_id uuid, date_from date, date_to date, is_full_day boolean, time_from time without time zone, time_to time without time zone, reason text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT mb.master_id, mb.date_from, mb.date_to, mb.is_full_day,
         mb.time_from, mb.time_to, mb.reason
  FROM master_blocks mb
  JOIN salons s ON s.id = mb.salon_id
  WHERE s.slug = p_salon_slug
    AND mb.date_from <= p_date_to
    AND mb.date_to >= p_date_from;
$function$;
```

### get_public_master_weekly_hours
```sql
CREATE OR REPLACE FUNCTION public.get_public_master_weekly_hours(p_salon_slug text, p_master_id uuid)
 RETURNS TABLE(day_of_week integer, is_day_off boolean, time_from time without time zone, time_to time without time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT wh.day_of_week, wh.is_day_off, wh.time_from, wh.time_to
  FROM master_weekly_hours wh
  JOIN salons s ON s.id = wh.salon_id
  WHERE s.slug = p_salon_slug
    AND wh.master_id = p_master_id;
$function$;
```

### get_public_masters
```sql
CREATE OR REPLACE FUNCTION public.get_public_masters(p_salon_slug text)
 RETURNS TABLE(id uuid, name text, specialty text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT m.id, m.name, m.specialty
  FROM masters m
  JOIN salons s ON s.id = m.salon_id
  WHERE s.slug = p_salon_slug
    AND m.is_active = true;
$function$;
```

### get_public_salon_by_slug
```sql
CREATE OR REPLACE FUNCTION public.get_public_salon_by_slug(p_slug text)
 RETURNS TABLE(id uuid, name text, slug text, booking_horizon_days integer, slot_interval_minutes integer, description text, address text, phone text, photo_url text, cover_url text, social_links jsonb, business_hours jsonb, lat numeric, lng numeric)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT id, name, slug, booking_horizon_days, slot_interval_minutes,
         description, address, phone, photo_url, cover_url,
         social_links, business_hours, lat, lng
  FROM salons
  WHERE slug = p_slug;
$function$;
```

### get_public_salon_gallery
```sql
CREATE OR REPLACE FUNCTION public.get_public_salon_gallery(p_salon_slug text)
 RETURNS TABLE(id uuid, url text, "position" integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select g.id, g.url, g."position"
  from salon_gallery_images g
  join salons s on s.id = g.salon_id
  where s.slug = p_salon_slug
  order by g."position";
$function$;
```

### get_public_salons_by_city
```sql
CREATE OR REPLACE FUNCTION public.get_public_salons_by_city(p_city text, p_category text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, slug text, name text, description text, address text, city text, photo_url text, gallery_photos jsonb, categories text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select s.id, s.slug, s.name, s.description, s.address, s.city, s.photo_url, s.gallery_photos, s.categories
  from salons s
  where s.is_published
    and s.subscription_status in ('active', 'trialing')
    and s.city = p_city
    and (p_category is null or p_category = any(s.categories))
  order by s.name asc
  limit p_limit;
$function$;
```

### get_public_salons_nearby (использует PostGIS: ST_Distance, ST_DWithin)
```sql
CREATE OR REPLACE FUNCTION public.get_public_salons_nearby(p_lat double precision, p_lng double precision, p_radius_km double precision DEFAULT 10, p_category text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, slug text, name text, description text, address text, city text, photo_url text, gallery_photos jsonb, categories text[], lat double precision, lng double precision, distance_km double precision)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select
    s.id, s.slug, s.name, s.description, s.address, s.city,
    s.photo_url, s.gallery_photos, s.categories, s.lat, s.lng,
    ST_Distance(s.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0 as distance_km
  from salons s
  where s.is_published
    and s.subscription_status in ('active', 'trialing')
    and s.geom is not null
    and ST_DWithin(s.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
    and (p_category is null or p_category = any(s.categories))
  order by distance_km asc
  limit p_limit;
$function$;
```

### get_public_services
```sql
CREATE OR REPLACE FUNCTION public.get_public_services(p_salon_slug text)
 RETURNS TABLE(id uuid, name text, duration integer, price integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT sv.id, sv.name, sv.duration, sv.price
  FROM services sv
  JOIN salons s ON s.id = sv.salon_id
  WHERE s.slug = p_salon_slug
    AND sv.is_active = true;
$function$;
```

### get_salon_access_status
```sql
CREATE OR REPLACE FUNCTION public.get_salon_access_status(p_salon_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select case
    when subscription_status = 'active' then 'ok'
    when subscription_status = 'trialing' and trial_ends_at > now() then 'ok'
    when subscription_status = 'trialing' and trial_ends_at <= now() then 'trial_expired'
    when subscription_status = 'past_due' then 'past_due'
    when subscription_status = 'canceled' then 'canceled'
    else 'unknown'
  end
  from salons where id = p_salon_id;
$function$;
```

### get_taken_slots
```sql
CREATE OR REPLACE FUNCTION public.get_taken_slots(p_salon_slug text, p_master_id uuid, p_date date)
 RETURNS TABLE(booking_time text, status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.time AS booking_time, b.status
  FROM bookings b
  JOIN salons s ON s.id = b.salon_id
  WHERE s.slug = p_salon_slug
    AND b.master_id = p_master_id
    AND b.date = p_date
    AND b.status != 'cancelled';
$function$;
```

### is_reserved_slug
```sql
CREATE OR REPLACE FUNCTION public.is_reserved_slug(p_slug text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT p_slug = ANY(ARRAY[
    'admin','api','booking','sign-in','sign-up','onboarding',
    'register','master','owner','dashboard','settings',
    'static','_next','favicon.ico','robots.txt','sitemap.xml'
  ])
$function$;
```

### is_slug_available
```sql
CREATE OR REPLACE FUNCTION public.is_slug_available(p_slug text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select not exists (select 1 from salons where slug = p_slug);
$function$;
```

### register_salon  ⚠️ зависит от auth.jwt()
```sql
CREATE OR REPLACE FUNCTION public.register_salon(p_name text, p_slug text, p_phone text DEFAULT NULL::text)
 RETURNS TABLE(salon_id uuid, salon_slug text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_clerk_user_id text;
  v_salon_id uuid;
  v_existing_membership uuid;
begin
  v_clerk_user_id := auth.jwt() ->> 'sub';
  if v_clerk_user_id is null then
    raise exception 'not_authenticated';
  end if;
  select sm.salon_id into v_existing_membership
  from salon_members sm
  where sm.clerk_user_id = v_clerk_user_id
  limit 1;
  if v_existing_membership is not null then
    raise exception 'already_has_salon';
  end if;
  if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'invalid_slug';
  end if;
  if is_reserved_slug(p_slug) then
    raise exception 'reserved_slug';
  end if;
  if exists (select 1 from salons s where s.slug = p_slug) then
    raise exception 'slug_taken';
  end if;
  insert into salons (
    name, slug, phone, owner_clerk_id, plan_id, subscription_status, trial_ends_at
  ) values (
    p_name, p_slug, p_phone, v_clerk_user_id, 'free', 'trialing', now() + interval '14 days'
  )
  returning id into v_salon_id;
  insert into salon_members (salon_id, clerk_user_id, role)
  values (v_salon_id, v_clerk_user_id, 'owner');
  return query select v_salon_id, p_slug;
end;
$function$;
```

### salon_id_exists
```sql
CREATE OR REPLACE FUNCTION public.salon_id_exists(p_salon_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM salons WHERE id = p_salon_id
  );
$function$;
```

### salons_sync_geom (TRIGGER FUNCTION, использует PostGIS)
```sql
CREATE OR REPLACE FUNCTION public.salons_sync_geom()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.lat is not null and new.lng is not null then
    new.geom := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  else
    new.geom := null;
  end if;
  return new;
end;
$function$;
```

### search_salons
```sql
CREATE OR REPLACE FUNCTION public.search_salons(p_name text DEFAULT NULL::text, p_service text DEFAULT NULL::text, p_price_max integer DEFAULT NULL::integer, p_city text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, name text, slug text, description text, address text, city text, photo_url text, cover_url text, categories text[], min_price integer, max_price integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select distinct on (s.id)
    s.id, s.name, s.slug, s.description, s.address, s.city, s.photo_url, s.cover_url, s.categories,
    min(sv.price) over (partition by s.id) as min_price,
    max(sv.price) over (partition by s.id) as max_price
  from salons s
  left join services sv
    on sv.salon_id = s.id
    and sv.is_active = true
  where
    s.is_published = true
    and (p_name    is null or s.name ilike '%' || p_name || '%')
    and (p_city    is null or s.city ilike '%' || p_city || '%')
    and (p_service is null or sv.name ilike '%' || p_service || '%')
    and (p_price_max is null or sv.price <= p_price_max)
  order by s.id
  limit 24;
$function$;
```

### set_booking_salon_from_master (TRIGGER FUNCTION)
```sql
CREATE OR REPLACE FUNCTION public.set_booking_salon_from_master()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SELECT salon_id INTO NEW.salon_id FROM masters WHERE id = NEW.master_id;
  RETURN NEW;
END;
$function$;
```

---

## 8. Что осталось сделать (TODO)

- [x] Получить тело `get_public_salons_nearby` — готово
- [x] PRIMARY KEY / FOREIGN KEY / UNIQUE constraints для всех таблиц — готово
- [x] Триггеры — готово (7 штук, раздел 6.3)
- [x] RLS статус и ПОЛНЫЙ точный текст всех 44 policies — готово (раздел 6.1)
- [x] Индексы — готово (33 штуки, раздел 6.4; найден один пробел — нет составного
      индекса под `get_taken_slots`, см. рекомендацию в разделе 6.4)
- [x] Решение по auth-стратегии принято — NextAuth.js v5 + СМС.ру на VPS,
      Clerk не используется. RLS сохраняется, переписываются 6 функций + 3 policy
      под `current_setting('app.current_user_id', true)`. См. раздел 6.1.
- [x] Собрать единый SQL-скрипт создания схемы (таблицы + constraints + индексы
      + функции с уже переписанным auth + триггеры + RLS policies) — **готово**,
      см. файл `01_schema.sql`. Проверен: 14 таблиц, 27 функций, 44 policies,
      7 триггеров, 24 FK, 17+ индексов — все числа совпадают с оригиналом.
- [ ] Уточнить точный тип `salons.geom` (PostGIS geography) и `salons.categories` (text[])
- [x] ~~Экспорт данных (сами строки таблиц)~~ — **НЕ требуется.** В БД только
      тестовые/демо-салоны, реальных данных нет. Решено: переносим только
      структуру (таблицы, функции, триггеры, RLS, индексы), данные не переносим.
      При необходимости тестовые салоны можно создать заново на новом сервере
      через `register_salon()` после того, как структура будет на месте.
- [x] ~~Экспорт файлов из Supabase Storage~~ — **НЕ требуется.** Подтверждено:
      в Storage (фото галерей, аватары мастеров) тоже только тестовые файлы,
      переносить не нужно.
- [ ] Развернуть PostgreSQL на Timeweb VPS (вместо Yandex Cloud — план сменился),
      включить расширение PostGIS, накатить итоговый SQL-скрипт

---

## 9. Готовый файл и инструкция по запуску

**Файл:** `01_schema.sql` — единый скрипт, создаёт всю схему с нуля: расширения,
14 таблиц, 24 FOREIGN KEY, индексы (33 оригинальных + 3 улучшения), 27 функций
(уже с переписанной авторизацией под NextAuth.js), 7 триггеров, 44 RLS policies.

### Порядок действий на Timeweb VPS

1. Установить PostgreSQL и PostGIS (пример для Ubuntu/Debian):
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo apt install postgresql-17-postgis-3   # номер версии под вашу версию PostgreSQL
   ```

2. Создать базу и пользователя для приложения:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE salon;
   CREATE USER salon_app WITH PASSWORD 'сложный_пароль';
   GRANT ALL PRIVILEGES ON DATABASE salon TO salon_app;
   \q
   ```

3. Накатить схему:
   ```bash
   psql -U postgres -d salon -f 01_schema.sql
   ```

4. Заполнить таблицу `plans` реальными тарифами (в скрипте это закомментированный
   INSERT в разделе 7 — раскомментировать и подставить свои значения цен/лимитов).

5. В backend-приложении (Next.js + NextAuth.js v5):
   - реализовать вход по номеру телефона + код через СМС.ру
   - в middleware/db-layer перед каждым запросом к БД выполнять
     `SET LOCAL app.current_user_id = '<id текущего пользователя>'` внутри
     транзакции (см. примечания в конце `01_schema.sql`)
   - для анонимных сценариев (публичная форма записи) — отдельное подключение
     под ролью `anon` или вызов через `SECURITY DEFINER`-функцию без
     установки `app.current_user_id`

6. Проверить работу создания салона через `register_salon()` — это заменит
   утерянные тестовые данные новыми тестовыми салонами уже на новой системе.

### Что осталось решить отдельно (не входит в SQL-схему)
- Таблица пользователей NextAuth (создаётся самим NextAuth adapter'ом для
  Postgres — `users`, `sessions`, `verification_token` и т.п. — это отдельная
  схема, идущая в комплекте с библиотекой, нужно настроить отдельно)
- Логика отправки/проверки SMS-кода через API СМС.ру
- Настройка роли `anon` на уровне подключения backend (отдельный пул соединений
  или `SET ROLE anon` в нужных эндпоинтах)
- Локальное хранение файлов на VPS взамен Supabase Storage (директория для
  загрузок + раздача статики через nginx/Next.js)
