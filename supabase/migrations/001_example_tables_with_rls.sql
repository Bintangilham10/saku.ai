CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.requesting_clerk_id()
RETURNS text AS $$
  SELECT COALESCE(auth.jwt() ->> 'sub', auth.uid()::text);
$$ LANGUAGE sql STABLE;

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text UNIQUE NOT NULL,
  email text,
  display_name text,
  preferred_currency varchar(3) NOT NULL DEFAULT 'IDR',
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.requesting_app_user_id()
RETURNS uuid AS $$
  SELECT id
  FROM public.app_users
  WHERE clerk_id = public.requesting_clerk_id()
  LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'IDR',
  institution text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  auto_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  color varchar(7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'IDR',
  type text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  merchant text,
  description text,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'cleared',
  imported boolean NOT NULL DEFAULT false,
  external_id text,
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  period text NOT NULL DEFAULT 'bulanan',
  limit_amount numeric(14,2) NOT NULL,
  start_date date,
  end_date date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(14,2) NOT NULL,
  current_amount numeric(14,2) NOT NULL DEFAULT 0,
  target_date date,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recurring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'IDR',
  cron_expr text,
  next_occurrence timestamptz,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  title text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  status text NOT NULL DEFAULT 'uploaded',
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_users_clerk_id ON public.app_users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON public.transactions USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_user_id ON public.recurring_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_imports_user_id ON public.imports(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

DROP TRIGGER IF EXISTS update_app_users_updated_at ON public.app_users;
CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_rules_updated_at ON public.recurring_rules;
CREATE TRIGGER update_recurring_rules_updated_at
BEFORE UPDATE ON public.recurring_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own app_user" ON public.app_users;
CREATE POLICY "Users manage own app_user" ON public.app_users
  FOR ALL
  USING (clerk_id = public.requesting_clerk_id())
  WITH CHECK (clerk_id = public.requesting_clerk_id());

DROP POLICY IF EXISTS "Users manage own accounts" ON public.accounts;
CREATE POLICY "Users manage own accounts" ON public.accounts
  FOR ALL
  USING (user_id = public.requesting_app_user_id())
  WITH CHECK (user_id = public.requesting_app_user_id());

DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;
CREATE POLICY "Users manage own categories" ON public.categories
  FOR ALL
  USING (user_id = public.requesting_app_user_id())
  WITH CHECK (user_id = public.requesting_app_user_id());

DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;
CREATE POLICY "Users manage own transactions" ON public.transactions
  FOR ALL
  USING (user_id = public.requesting_app_user_id())
  WITH CHECK (user_id = public.requesting_app_user_id());

DROP POLICY IF EXISTS "Users manage own budgets" ON public.budgets;
CREATE POLICY "Users manage own budgets" ON public.budgets
  FOR ALL
  USING (user_id = public.requesting_app_user_id())
  WITH CHECK (user_id = public.requesting_app_user_id());

DROP POLICY IF EXISTS "Users manage own goals" ON public.goals;
CREATE POLICY "Users manage own goals" ON public.goals
  FOR ALL
  USING (user_id = public.requesting_app_user_id())
  WITH CHECK (user_id = public.requesting_app_user_id());

DROP POLICY IF EXISTS "Users manage own recurring rules" ON public.recurring_rules;
CREATE POLICY "Users manage own recurring rules" ON public.recurring_rules
  FOR ALL
  USING (user_id = public.requesting_app_user_id())
  WITH CHECK (user_id = public.requesting_app_user_id());

DROP POLICY IF EXISTS "Users manage own ai conversations" ON public.ai_conversations;
CREATE POLICY "Users manage own ai conversations" ON public.ai_conversations
  FOR ALL
  USING (user_id = public.requesting_app_user_id())
  WITH CHECK (user_id = public.requesting_app_user_id());

DROP POLICY IF EXISTS "Users manage own ai messages" ON public.ai_messages;
CREATE POLICY "Users manage own ai messages" ON public.ai_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_conversations conversation
      WHERE conversation.id = ai_messages.conversation_id
        AND conversation.user_id = public.requesting_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ai_conversations conversation
      WHERE conversation.id = ai_messages.conversation_id
        AND conversation.user_id = public.requesting_app_user_id()
    )
  );

DROP POLICY IF EXISTS "Users manage own imports" ON public.imports;
CREATE POLICY "Users manage own imports" ON public.imports
  FOR ALL
  USING (user_id = public.requesting_app_user_id())
  WITH CHECK (user_id = public.requesting_app_user_id());

DROP POLICY IF EXISTS "Users manage own audit logs" ON public.audit_logs;
CREATE POLICY "Users manage own audit logs" ON public.audit_logs
  FOR ALL
  USING (user_id = public.requesting_app_user_id())
  WITH CHECK (user_id = public.requesting_app_user_id());
