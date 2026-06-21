ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_id_user_id_unique UNIQUE (id, user_id),
  ADD CONSTRAINT accounts_type_valid
    CHECK (type IN ('dompet', 'bank', 'ewallet', 'tabungan')),
  ADD CONSTRAINT accounts_currency_format
    CHECK (currency ~ '^[A-Z]{3}$');

ALTER TABLE public.categories
  ADD CONSTRAINT categories_id_user_id_unique UNIQUE (id, user_id);

ALTER TABLE public.categories
  DROP CONSTRAINT categories_parent_id_fkey;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_parent_owner_fkey
  FOREIGN KEY (parent_id, user_id)
  REFERENCES public.categories(id, user_id)
  ON DELETE SET NULL (parent_id);

ALTER TABLE public.transactions
  DROP CONSTRAINT transactions_account_id_fkey,
  DROP CONSTRAINT transactions_category_id_fkey;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_account_owner_fkey
    FOREIGN KEY (account_id, user_id)
    REFERENCES public.accounts(id, user_id)
    ON DELETE SET NULL (account_id),
  ADD CONSTRAINT transactions_category_owner_fkey
    FOREIGN KEY (category_id, user_id)
    REFERENCES public.categories(id, user_id)
    ON DELETE SET NULL (category_id),
  ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT transactions_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT transactions_type_valid CHECK (type IN ('debit', 'credit')),
  ADD CONSTRAINT transactions_status_valid CHECK (status IN ('pending', 'cleared'));

ALTER TABLE public.budgets
  DROP CONSTRAINT budgets_category_id_fkey;

ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_category_owner_fkey
    FOREIGN KEY (category_id, user_id)
    REFERENCES public.categories(id, user_id)
    ON DELETE SET NULL (category_id),
  ADD CONSTRAINT budgets_limit_positive CHECK (limit_amount > 0),
  ADD CONSTRAINT budgets_period_valid CHECK (period IN ('bulanan', 'mingguan')),
  ADD CONSTRAINT budgets_date_order
    CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);

ALTER TABLE public.goals
  ADD CONSTRAINT goals_target_positive CHECK (target_amount > 0),
  ADD CONSTRAINT goals_current_nonnegative CHECK (current_amount >= 0);

ALTER TABLE public.recurring_rules
  DROP CONSTRAINT recurring_rules_account_id_fkey,
  DROP CONSTRAINT recurring_rules_category_id_fkey;

ALTER TABLE public.recurring_rules
  ADD CONSTRAINT recurring_rules_account_owner_fkey
    FOREIGN KEY (account_id, user_id)
    REFERENCES public.accounts(id, user_id)
    ON DELETE SET NULL (account_id),
  ADD CONSTRAINT recurring_rules_category_owner_fkey
    FOREIGN KEY (category_id, user_id)
    REFERENCES public.categories(id, user_id)
    ON DELETE SET NULL (category_id),
  ADD CONSTRAINT recurring_rules_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT recurring_rules_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT recurring_rules_confidence_range
    CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1);
