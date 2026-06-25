-- =====================================================================
-- Salon — миграция Supabase → Timeweb VPS (PostgreSQL + NextAuth.js)
-- Файл 1 из 1: полная схема (расширения, таблицы, constraints, индексы,
--              функции, триггеры, RLS policies)
--
-- Авторизация переписана: Clerk (auth.jwt()) → NextAuth.js v5
-- (current_setting('app.current_user_id', true))
--
-- ВАЖНО: backend ДОЛЖЕН выполнять перед каждым запросом внутри транзакции:
--   SET LOCAL app.current_user_id = '<id_пользователя_из_сессии_NextAuth>';
-- иначе current_salon_id()/current_salon_role()/etc. вернут NULL и все
-- RLS-проверки будут отклонять доступ.
-- =====================================================================


-- =====================================================================
-- 0. РАСШИРЕНИЯ
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- для gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "postgis";    -- геопоиск (ST_Distance, ST_DWithin, geography)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- полнотекстовый поиск ILIKE (рекомендация к улучшению)


-- =====================================================================
-- 1. ТАБЛИЦЫ
-- =====================================================================
-- Порядок: сначала без FK-зависимостей (plans), затем salons, затем то,
-- что ссылается на salons/masters. FK добавляются отдельно в разделе 3,
-- поэтому порядок здесь не критичен, но сохранён логичным.

CREATE TABLE plans (
  id                 text    PRIMARY KEY,
  name               text    NOT NULL,
  price_rub          integer NOT NULL,
  max_masters        integer NOT NULL,
  max_services       integer NOT NULL,
  max_gallery_photos integer NOT NULL DEFAULT 10,
  custom_branding    boolean NOT NULL DEFAULT false,
  custom_domain      boolean NOT NULL DEFAULT false,
  white_label        boolean NOT NULL DEFAULT false,
  sort_order         integer NOT NULL DEFAULT 0
);

CREATE TABLE salons (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        text NOT NULL,
  -- было owner_clerk_id — переименовано под NextAuth (ID пользователя, не Clerk ID)
  owner_user_id               text NOT NULL,
  booking_horizon_days        integer NOT NULL DEFAULT 30,
  slot_interval_minutes       integer NOT NULL DEFAULT 30,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now(),
  slug                        text NOT NULL,
  description                 text,
  address                      text,
  phone                        text,
  photo_url                    text,
  plan_id                      text NOT NULL DEFAULT 'free',
  subscription_status          text NOT NULL DEFAULT 'trialing',
  trial_ends_at                 timestamptz,
  current_period_end            timestamptz,
  yookassa_payment_method_id     text,
  yookassa_customer_id            text,
  city                              text,
  lat                                double precision,
  lng                                double precision,
  gallery_photos                     jsonb NOT NULL DEFAULT '[]'::jsonb,
  categories                          text[] NOT NULL DEFAULT '{}'::text[],
  is_published                         boolean NOT NULL DEFAULT false,
  theme_overrides                      jsonb NOT NULL DEFAULT '{}'::jsonb,
  custom_domain                        text,
  geom                                 geography(Point, 4326),
  cover_url                            text,
  business_hours                       jsonb,
  social_links                         jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT salons_custom_domain_key UNIQUE (custom_domain),
  CONSTRAINT salons_owner_user_id_key UNIQUE (owner_user_id),
  CONSTRAINT salons_slug_unique UNIQUE (slug)
);

CREATE TABLE masters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  specialty   text,
  photo       text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  salon_id    uuid NOT NULL
);

CREATE TABLE services (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  duration    integer NOT NULL,
  price       integer NOT NULL,
  description text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  master_id   uuid,
  salon_id    uuid NOT NULL
);

CREATE TABLE bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  "time"        time NOT NULL,
  client_name   text NOT NULL,
  client_phone  text NOT NULL,
  client_comment text,
  status        text DEFAULT 'PENDING',
  service_id    uuid,
  master_id     uuid,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  salon_id      uuid NOT NULL
);

CREATE TABLE inventory_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  unit                text NOT NULL DEFAULT 'шт.',
  quantity            numeric NOT NULL DEFAULT 0,
  low_stock_threshold numeric NOT NULL DEFAULT 5,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  salon_id            uuid NOT NULL
);

CREATE TABLE inventory_movements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid NOT NULL,
  change     numeric NOT NULL,
  reason     text NOT NULL DEFAULT 'manual',
  booking_id uuid,
  created_at timestamptz DEFAULT now(),
  salon_id   uuid NOT NULL
);

CREATE TABLE service_consumables (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL,
  item_id    uuid NOT NULL,
  amount     numeric NOT NULL DEFAULT 1,
  salon_id   uuid NOT NULL,
  CONSTRAINT service_consumables_service_id_item_id_key UNIQUE (service_id, item_id)
);

CREATE TABLE master_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   uuid NOT NULL,
  date_from   date NOT NULL,
  date_to     date NOT NULL,
  is_full_day boolean NOT NULL DEFAULT true,
  time_from   time,
  time_to     time,
  reason      text,
  created_at  timestamptz DEFAULT now(),
  salon_id    uuid NOT NULL
);

CREATE TABLE master_weekly_hours (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   uuid NOT NULL,
  day_of_week integer NOT NULL,
  is_day_off  boolean NOT NULL DEFAULT false,
  time_from   time,
  time_to     time,
  salon_id    uuid NOT NULL,
  CONSTRAINT master_weekly_hours_master_id_day_of_week_key UNIQUE (master_id, day_of_week)
);

CREATE TABLE master_invites (
  token      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id   uuid NOT NULL,
  master_id  uuid,
  used       boolean NOT NULL DEFAULT false,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  role       text NOT NULL DEFAULT 'master'
);

CREATE TABLE salon_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id    uuid NOT NULL,
  -- было clerk_user_id — переименовано под NextAuth (ID пользователя, не Clerk ID)
  user_id     text NOT NULL,
  role        text NOT NULL,
  master_id   uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salon_members_salon_id_user_id_key UNIQUE (salon_id, user_id)
);

CREATE TABLE salon_gallery_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id   uuid NOT NULL,
  url        text NOT NULL,
  "position" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id            uuid NOT NULL,
  plan_id             text NOT NULL,
  status              text NOT NULL,
  yookassa_payment_id text,
  amount_kopecks      integer,
  period_start        timestamptz,
  period_end          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);


-- =====================================================================
-- 2. FOREIGN KEY CONSTRAINTS
-- =====================================================================
-- Подтверждено: ни одна FK не ссылается на auth.users (Supabase-специфика) —
-- все связи только между таблицами в этой схеме.

ALTER TABLE bookings              ADD CONSTRAINT bookings_master_id_fkey      FOREIGN KEY (master_id)  REFERENCES masters(id)          ON DELETE CASCADE;
ALTER TABLE bookings              ADD CONSTRAINT bookings_service_id_fkey     FOREIGN KEY (service_id) REFERENCES services(id)         ON DELETE CASCADE;
ALTER TABLE bookings              ADD CONSTRAINT bookings_salon_id_fkey       FOREIGN KEY (salon_id)   REFERENCES salons(id);

ALTER TABLE inventory_items       ADD CONSTRAINT inventory_items_salon_id_fkey       FOREIGN KEY (salon_id) REFERENCES salons(id);

ALTER TABLE inventory_movements   ADD CONSTRAINT inventory_movements_item_id_fkey    FOREIGN KEY (item_id)    REFERENCES inventory_items(id) ON DELETE CASCADE;
ALTER TABLE inventory_movements   ADD CONSTRAINT inventory_movements_salon_id_fkey   FOREIGN KEY (salon_id)   REFERENCES salons(id);
ALTER TABLE inventory_movements   ADD CONSTRAINT inventory_movements_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id)        ON DELETE SET NULL;

ALTER TABLE master_blocks         ADD CONSTRAINT master_blocks_master_id_fkey FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE;
ALTER TABLE master_blocks         ADD CONSTRAINT master_blocks_salon_id_fkey  FOREIGN KEY (salon_id)  REFERENCES salons(id);

ALTER TABLE master_invites        ADD CONSTRAINT master_invites_salon_id_fkey  FOREIGN KEY (salon_id)  REFERENCES salons(id)  ON DELETE CASCADE;
ALTER TABLE master_invites        ADD CONSTRAINT master_invites_master_id_fkey FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE;

ALTER TABLE master_weekly_hours   ADD CONSTRAINT master_weekly_hours_master_id_fkey FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE;
ALTER TABLE master_weekly_hours   ADD CONSTRAINT master_weekly_hours_salon_id_fkey  FOREIGN KEY (salon_id)  REFERENCES salons(id);

ALTER TABLE masters               ADD CONSTRAINT masters_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES salons(id);

ALTER TABLE salon_gallery_images  ADD CONSTRAINT salon_gallery_images_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE;

ALTER TABLE salon_members         ADD CONSTRAINT salon_members_master_id_fkey FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE SET NULL;
ALTER TABLE salon_members         ADD CONSTRAINT salon_members_salon_id_fkey  FOREIGN KEY (salon_id)  REFERENCES salons(id)  ON DELETE CASCADE;

ALTER TABLE salons                ADD CONSTRAINT salons_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);

ALTER TABLE service_consumables   ADD CONSTRAINT service_consumables_item_id_fkey    FOREIGN KEY (item_id)    REFERENCES inventory_items(id) ON DELETE CASCADE;
ALTER TABLE service_consumables   ADD CONSTRAINT service_consumables_salon_id_fkey   FOREIGN KEY (salon_id)   REFERENCES salons(id);
ALTER TABLE service_consumables   ADD CONSTRAINT service_consumables_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id)        ON DELETE CASCADE;

ALTER TABLE services              ADD CONSTRAINT services_master_id_fkey FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE;
ALTER TABLE services              ADD CONSTRAINT services_salon_id_fkey  FOREIGN KEY (salon_id)  REFERENCES salons(id);

ALTER TABLE subscriptions         ADD CONSTRAINT subscriptions_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE;


-- =====================================================================
-- 3. ИНДЕКСЫ
-- =====================================================================
-- Оригинальные 33 индекса с Supabase + 3 рекомендованных улучшения
-- (отмечены NEW). PK/UNIQUE индексы уже созданы неявно через constraints
-- выше — здесь только дополнительные.

CREATE INDEX idx_bookings_salon                  ON bookings (salon_id);
CREATE INDEX idx_inventory_items_salon           ON inventory_items (salon_id);
CREATE INDEX idx_inventory_movements_salon       ON inventory_movements (salon_id);
CREATE INDEX idx_master_blocks_salon             ON master_blocks (salon_id);
CREATE INDEX idx_master_weekly_hours_salon       ON master_weekly_hours (salon_id);
CREATE INDEX idx_masters_salon                   ON masters (salon_id);
CREATE INDEX idx_salon_gallery_images_salon_id   ON salon_gallery_images (salon_id, "position");
CREATE INDEX idx_salons_categories               ON salons USING gin (categories) WHERE is_published;
CREATE INDEX idx_salons_city                     ON salons (city) WHERE is_published;
CREATE INDEX idx_salons_geom                     ON salons USING gist (geom);
CREATE INDEX idx_service_consumables_salon       ON service_consumables (salon_id);
CREATE INDEX idx_services_salon                  ON services (salon_id);

-- NEW: рекомендация к улучшению — составной индекс для get_taken_slots()
-- (объединяет пункты 1 и 4 из анализа: master_id+date, плюс частичный фильтр
-- по статусу — самый частый запрос календаря бронирования)
CREATE INDEX idx_bookings_active ON bookings (master_id, date) WHERE status != 'cancelled';

-- NEW: рекомендация к улучшению — полнотекстовый поиск (search_salons и др.
-- используют ILIKE '%...%', обычный btree этому не помогает)
CREATE INDEX idx_salons_name_trgm   ON salons   USING gin (name gin_trgm_ops);
CREATE INDEX idx_services_name_trgm ON services USING gin (name gin_trgm_ops);

-- NEW: мелкие пробелы, отмеченные в анализе (не критично при малом объёме,
-- но недорого добавить сразу)
CREATE INDEX idx_salons_plan_id        ON salons (plan_id);
CREATE INDEX idx_master_invites_salon  ON master_invites (salon_id);


-- =====================================================================
-- 4. ФУНКЦИИ
-- =====================================================================
-- 4.1 — Идентификационные функции (ПЕРЕПИСАНЫ под NextAuth.js)
-- =====================================================================

CREATE OR REPLACE FUNCTION current_salon_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select salon_id from salon_members
  where user_id = current_setting('app.current_user_id', true)
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION current_salon_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select role from salon_members
  where user_id = current_setting('app.current_user_id', true)
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION current_master_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select master_id from salon_members
  where user_id = current_setting('app.current_user_id', true)
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION current_role_in_salon(p_salon_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select role from salon_members
  where user_id = current_setting('app.current_user_id', true) and salon_id = p_salon_id
  limit 1;
$function$;

-- =====================================================================
-- 4.2 — Функции с инвайтами и регистрацией (ПЕРЕПИСАНЫ под NextAuth.js)
-- =====================================================================

CREATE OR REPLACE FUNCTION accept_master_invite(p_token uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  inv record;
  existing_role text;
  v_user_id text;
begin
  v_user_id := current_setting('app.current_user_id', true);
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
  where user_id = v_user_id and salon_id = inv.salon_id;
  if existing_role = 'owner' then
    return 'cannot_downgrade_owner';
  end if;
  insert into salon_members (salon_id, user_id, role, master_id)
  values (inv.salon_id, v_user_id, 'master', inv.master_id)
  on conflict (salon_id, user_id) do update
    set role = 'master', master_id = inv.master_id;
  update master_invites set used = true where token = p_token;
  return 'ok';
end;
$function$;

CREATE OR REPLACE FUNCTION accept_salon_invite(p_token uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  inv record;
  existing_role text;
  v_user_id text;
begin
  v_user_id := current_setting('app.current_user_id', true);
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
  where user_id = v_user_id and salon_id = inv.salon_id;
  if existing_role = 'owner' then
    return 'cannot_downgrade_owner';
  end if;
  insert into salon_members (salon_id, user_id, role, master_id)
  values (inv.salon_id, v_user_id, inv.role, inv.master_id)
  on conflict (salon_id, user_id) do update
    set role = inv.role, master_id = inv.master_id;
  update master_invites set used = true where token = p_token;
  return 'ok';
end;
$function$;

CREATE OR REPLACE FUNCTION register_salon(p_name text, p_slug text, p_phone text DEFAULT NULL::text)
 RETURNS TABLE(salon_id uuid, salon_slug text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_user_id text;
  v_salon_id uuid;
  v_existing_membership uuid;
begin
  v_user_id := current_setting('app.current_user_id', true);
  if v_user_id is null or v_user_id = '' then
    raise exception 'not_authenticated';
  end if;
  select sm.salon_id into v_existing_membership
  from salon_members sm
  where sm.user_id = v_user_id
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
    name, slug, phone, owner_user_id, plan_id, subscription_status, trial_ends_at
  ) values (
    p_name, p_slug, p_phone, v_user_id, 'free', 'trialing', now() + interval '14 days'
  )
  returning id into v_salon_id;
  insert into salon_members (salon_id, user_id, role)
  values (v_salon_id, v_user_id, 'owner');
  return query select v_salon_id, p_slug;
end;
$function$;

-- =====================================================================
-- 4.3 — Триггерные функции (без изменений)
-- =====================================================================

CREATE OR REPLACE FUNCTION check_masters_limit()
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

CREATE OR REPLACE FUNCTION check_services_limit()
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

CREATE OR REPLACE FUNCTION consume_inventory_on_complete()
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

CREATE OR REPLACE FUNCTION create_default_master_schedule()
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

CREATE OR REPLACE FUNCTION salons_sync_geom()
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

CREATE OR REPLACE FUNCTION set_booking_salon_from_master()
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

-- =====================================================================
-- 4.4 — Публичные функции для витрины (без изменений)
-- =====================================================================

CREATE OR REPLACE FUNCTION is_reserved_slug(p_slug text)
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

CREATE OR REPLACE FUNCTION is_slug_available(p_slug text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select not exists (select 1 from salons where slug = p_slug);
$function$;

CREATE OR REPLACE FUNCTION salon_id_exists(p_salon_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM salons WHERE id = p_salon_id
  );
$function$;

CREATE OR REPLACE FUNCTION get_salon_access_status(p_salon_id uuid)
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

CREATE OR REPLACE FUNCTION get_public_master_blocks(p_salon_slug text, p_date_from date, p_date_to date)
 RETURNS TABLE(master_id uuid, date_from date, date_to date, is_full_day boolean, time_from time, time_to time, reason text)
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

CREATE OR REPLACE FUNCTION get_public_master_weekly_hours(p_salon_slug text, p_master_id uuid)
 RETURNS TABLE(day_of_week integer, is_day_off boolean, time_from time, time_to time)
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

CREATE OR REPLACE FUNCTION get_public_masters(p_salon_slug text)
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

CREATE OR REPLACE FUNCTION get_public_salon_by_slug(p_slug text)
 RETURNS TABLE(id uuid, name text, slug text, booking_horizon_days integer, slot_interval_minutes integer, description text, address text, phone text, photo_url text, cover_url text, social_links jsonb, business_hours jsonb, lat double precision, lng double precision)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT id, name, slug, booking_horizon_days, slot_interval_minutes,
         description, address, phone, photo_url, cover_url,
         social_links, business_hours, lat, lng
  FROM salons
  WHERE slug = p_slug;
$function$;

CREATE OR REPLACE FUNCTION get_public_salon_gallery(p_salon_slug text)
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

CREATE OR REPLACE FUNCTION get_public_salons_by_city(p_city text, p_category text DEFAULT NULL::text, p_limit integer DEFAULT 50)
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

CREATE OR REPLACE FUNCTION get_public_salons_nearby(p_lat double precision, p_lng double precision, p_radius_km double precision DEFAULT 10, p_category text DEFAULT NULL::text, p_limit integer DEFAULT 50)
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

CREATE OR REPLACE FUNCTION get_public_services(p_salon_slug text)
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

CREATE OR REPLACE FUNCTION get_taken_slots(p_salon_slug text, p_master_id uuid, p_date date)
 RETURNS TABLE(booking_time text, status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b."time"::text AS booking_time, b.status
  FROM bookings b
  JOIN salons s ON s.id = b.salon_id
  WHERE s.slug = p_salon_slug
    AND b.master_id = p_master_id
    AND b.date = p_date
    AND b.status != 'cancelled';
$function$;

CREATE OR REPLACE FUNCTION search_salons(p_name text DEFAULT NULL::text, p_service text DEFAULT NULL::text, p_price_max integer DEFAULT NULL::integer, p_city text DEFAULT NULL::text)
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


-- =====================================================================
-- 5. ТРИГГЕРЫ (без изменений — 7 штук)
-- =====================================================================

CREATE TRIGGER trg_consume_inventory
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION consume_inventory_on_complete();

CREATE TRIGGER trg_set_booking_salon
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_booking_salon_from_master();

CREATE TRIGGER trg_check_masters_limit
  BEFORE INSERT ON masters
  FOR EACH ROW EXECUTE FUNCTION check_masters_limit();

CREATE TRIGGER trg_create_default_schedule
  AFTER INSERT ON masters
  FOR EACH ROW EXECUTE FUNCTION create_default_master_schedule();

CREATE TRIGGER trg_salons_sync_geom_insert
  BEFORE INSERT ON salons
  FOR EACH ROW EXECUTE FUNCTION salons_sync_geom();

CREATE TRIGGER trg_salons_sync_geom_update
  BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION salons_sync_geom();

CREATE TRIGGER trg_check_services_limit
  BEFORE INSERT ON services
  FOR EACH ROW EXECUTE FUNCTION check_services_limit();


-- =====================================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_blocks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_invites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_weekly_hours  ENABLE ROW LEVEL SECURITY;
ALTER TABLE masters              ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans                ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_consumables  ENABLE ROW LEVEL SECURITY;
ALTER TABLE services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;

-- NB: в PostgreSQL роли 'anon'/'authenticated'/'public' не существуют по
-- умолчанию (это специфика Supabase). 'public' — псевдо-роль PostgreSQL,
-- означающая "все", она работает как есть. Роли 'anon' и 'authenticated'
-- нужно создать, либо (что проще для собственного backend) объединить
-- их в одну роль приложения, например 'app_user', через которую backend
-- будет подключаться к БД. Ниже создаются обе роли для совместимости
-- с исходным набором policies без необходимости их переписывать.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

-- backend-пользователь, под которым реально подключается приложение,
-- должен уметь "становиться" anon/authenticated в зависимости от того,
-- залогинен ли текущий запрос. Проще: backend всегда подключается под
-- ролью authenticated (раз NextAuth сам решает, кто залогинен — анонимные
-- сценарии, такие как bookings_public_insert, можно обслуживать отдельным
-- маршрутом/функцией с SECURITY DEFINER, а не реальной ролью БД anon).
-- См. примечание в конце файла.

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

-- inventory_movements
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

-- master_invites
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

-- salon_members (ПЕРЕПИСАНО: clerk_user_id/auth.jwt() → user_id/current_setting)
CREATE POLICY salon_members_select_self ON salon_members FOR SELECT TO authenticated
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY salon_members_select_salon ON salon_members FOR SELECT TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = ANY (ARRAY['owner'::text, 'manager'::text])));

CREATE POLICY salon_members_delete ON salon_members FOR DELETE TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = 'owner'::text));

-- salons (ПЕРЕПИСАНО: owner_clerk_id/auth.jwt() → owner_user_id/current_setting)
CREATE POLICY salons_public_select ON salons FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY salons_select ON salons FOR SELECT TO public
  USING (owner_user_id = current_setting('app.current_user_id', true));

CREATE POLICY salons_update ON salons FOR UPDATE TO public
  USING (owner_user_id = current_setting('app.current_user_id', true));

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

-- subscriptions
CREATE POLICY subscriptions_select_owner ON subscriptions FOR SELECT TO authenticated
  USING ((salon_id = current_salon_id()) AND (current_salon_role() = 'owner'::text));


-- =====================================================================
-- 7. НАЧАЛЬНЫЕ ДАННЫЕ (тарифные планы — структурные данные, не тестовые)
-- =====================================================================
-- В оригинальной БД были тестовые салоны, которые мы решили не переносить.
-- Но таблица plans — это справочник тарифов, а не пользовательские данные;
-- без неё register_salon() не сможет создать ни одного салона (FK на plans).
-- ЗАПОЛНИТЕ реальными значениями цен/лимитов вашего тарифного плана:

-- INSERT INTO plans (id, name, price_rub, max_masters, max_services, max_gallery_photos, custom_branding, custom_domain, white_label, sort_order) VALUES
--   ('free', 'Бесплатный', 0, 1, 5, 10, false, false, false, 0),
--   ('pro',  'Профи',      990, 5, 50, 30, true, false, false, 1);


-- =====================================================================
-- ПРИМЕЧАНИЯ ДЛЯ BACKEND-РАЗРАБОТЧИКА
-- =====================================================================
-- 1. Перед каждым запросом внутри транзакции выполняйте:
--      SET LOCAL app.current_user_id = '<id из сессии NextAuth>';
--    Пример для node-postgres / Drizzle (псевдокод):
--      await db.transaction(async (tx) => {
--        await tx.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
--        ... остальные запросы внутри той же транзакции ...
--      });
--
-- 2. Анонимные сценарии (публичная витрина салона, форма онлайн-записи без
--    логина) должны подключаться под ролью 'anon' либо просто не устанавливать
--    app.current_user_id вообще — тогда current_setting(..., true) вернёт NULL,
--    что корректно обрабатывается всеми переписанными функциями (просто не
--    найдёт совпадений и вернёт пусто/false, как и раньше с anon в Supabase).
--    Для самого bookings_public_insert (запись от анонимного клиента с улицы)
--    backend должен явно подключаться как роль 'anon' (через SET ROLE anon
--    в начале транзакции) или вызывать соответствующий endpoint через
--    отдельного пользователя БД с правами роли anon.
--
-- 3. PostGIS на VPS не идёт "из коробки" как в managed-облаке — нужно
--    установить системный пакет перед запуском этого скрипта, например
--    для Ubuntu/Debian:
--      sudo apt install postgresql-17-postgis-3
--    (номер версии должен совпадать с установленным PostgreSQL).
-- =====================================================================
