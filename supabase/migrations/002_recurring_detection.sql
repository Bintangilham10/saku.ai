ALTER TABLE public.recurring_rules
  ADD COLUMN IF NOT EXISTS detected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confidence numeric(3,2),
  ADD COLUMN IF NOT EXISTS source_key text;

CREATE INDEX IF NOT EXISTS idx_recurring_rules_source_key
  ON public.recurring_rules(user_id, source_key)
  WHERE source_key IS NOT NULL;
