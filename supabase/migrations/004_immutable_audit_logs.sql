DROP POLICY IF EXISTS "Users manage own audit logs" ON public.audit_logs;

CREATE POLICY "Users read own audit logs" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = public.requesting_app_user_id());

REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;

CREATE OR REPLACE FUNCTION public.write_immutable_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  row_data jsonb;
  owner_id uuid;
  audited_row_id uuid;
BEGIN
  row_data := CASE
    WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
    ELSE to_jsonb(NEW)
  END;

  audited_row_id := NULLIF(row_data ->> 'id', '')::uuid;

  IF row_data ? 'user_id' THEN
    owner_id := NULLIF(row_data ->> 'user_id', '')::uuid;
  ELSIF TG_TABLE_NAME = 'app_users' THEN
    owner_id := audited_row_id;
  ELSE
    owner_id := public.requesting_app_user_id();
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    row_id,
    action,
    payload
  ) VALUES (
    owner_id,
    TG_TABLE_NAME,
    audited_row_id,
    TG_OP,
    jsonb_build_object('source', 'database_trigger')
  );

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.write_immutable_audit_log() FROM PUBLIC, authenticated;

DO $$
DECLARE
  audited_table text;
BEGIN
  FOREACH audited_table IN ARRAY ARRAY[
    'app_users',
    'accounts',
    'categories',
    'transactions',
    'budgets',
    'goals',
    'recurring_rules',
    'ai_conversations',
    'ai_messages',
    'imports'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS immutable_audit_log ON public.%I',
      audited_table
    );
    EXECUTE format(
      'CREATE TRIGGER immutable_audit_log
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.write_immutable_audit_log()',
      audited_table
    );
  END LOOP;
END;
$$;
