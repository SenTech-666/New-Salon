-- supabase/migrations/004_plan_constraints.sql

ALTER TABLE salons
  DROP CONSTRAINT IF EXISTS salons_plan_id_check;

ALTER TABLE salons
  ADD CONSTRAINT salons_plan_id_check
  CHECK (plan_id IN ('free', 'base', 'premium'));

ALTER TABLE salons
  DROP CONSTRAINT IF EXISTS salons_subscription_status_check;

ALTER TABLE salons
  ADD CONSTRAINT salons_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled'));

  -- в той же миграции или отдельным файлом 004b

CREATE TABLE IF NOT EXISTS subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  plan_id               text NOT NULL CHECK (plan_id IN ('free', 'base', 'premium')),
  status                text NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  yookassa_payment_id   text,
  amount_kopecks        integer,
  period_start          timestamptz,
  period_end            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Владелец видит только свои записи
CREATE POLICY "owner reads own subscriptions"
  ON subscriptions FOR SELECT
  USING (salon_id = current_salon_id());