import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { PGlite } from "@electric-sql/pglite"

const USER_A = "00000000-0000-4000-8000-000000000001"
const USER_B = "00000000-0000-4000-8000-000000000002"
const ACCOUNT_A = "10000000-0000-4000-8000-000000000001"
const ACCOUNT_B = "10000000-0000-4000-8000-000000000002"
const CATEGORY_A = "20000000-0000-4000-8000-000000000001"
const CATEGORY_B = "20000000-0000-4000-8000-000000000002"
const AUDITED_TRANSACTION = "30000000-0000-4000-8000-000000000001"

async function readMigration(name) {
  const sql = await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8")

  // PGlite runs real Postgres but does not bundle these Supabase extensions.
  return sql.replace(/^CREATE EXTENSION IF NOT EXISTS "?(?:pgcrypto|pg_trgm)"?;\r?\n/gm, "")
}

async function setIdentity(db, clerkId) {
  const claims = JSON.stringify({ sub: clerkId }).replaceAll("'", "''")

  await db.exec(`
    RESET ROLE;
    SELECT set_config('request.jwt.claims', '${claims}', false);
    SET ROLE authenticated;
  `)
}

async function expectConstraint(db, sql, code, constraint) {
  await assert.rejects(db.exec(sql), (error) => {
    assert.equal(error.code, code)
    assert.equal(error.constraint, constraint)
    return true
  })
}

async function expectSqlState(db, sql, code) {
  await assert.rejects(db.exec(sql), (error) => {
    assert.equal(error.code, code)
    return true
  })
}

async function createDatabase() {
  const db = new PGlite()

  await db.exec(`
    CREATE SCHEMA auth;

    CREATE FUNCTION auth.jwt()
    RETURNS jsonb
    LANGUAGE sql
    STABLE
    AS $$
      SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claims', true), ''),
        '{}'
      )::jsonb;
    $$;

    CREATE FUNCTION auth.uid()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $$ SELECT NULL::uuid; $$;

    CREATE ROLE authenticated NOLOGIN;
  `)

  for (const migration of [
    "001_example_tables_with_rls.sql",
    "002_recurring_detection.sql",
    "003_tenant_financial_integrity.sql",
  ]) {
    await db.exec(await readMigration(migration))
  }

  await db.exec(`
    GRANT USAGE ON SCHEMA public, auth TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public, auth TO authenticated;
  `)

  await db.exec(await readMigration("004_immutable_audit_logs.sql"))

  return db
}

async function seedTwoUsers(db) {
  await setIdentity(db, "clerk_user_a")
  await db.exec(`
    INSERT INTO public.app_users (id, clerk_id) VALUES ('${USER_A}', 'clerk_user_a');
    INSERT INTO public.accounts (id, user_id, name, type)
      VALUES ('${ACCOUNT_A}', '${USER_A}', 'Wallet A', 'dompet');
    INSERT INTO public.categories (id, user_id, name)
      VALUES ('${CATEGORY_A}', '${USER_A}', 'Category A');
  `)

  await setIdentity(db, "clerk_user_b")
  await db.exec(`
    INSERT INTO public.app_users (id, clerk_id) VALUES ('${USER_B}', 'clerk_user_b');
    INSERT INTO public.accounts (id, user_id, name, type)
      VALUES ('${ACCOUNT_B}', '${USER_B}', 'Wallet B', 'dompet');
    INSERT INTO public.categories (id, user_id, name)
      VALUES ('${CATEGORY_B}', '${USER_B}', 'Category B');
  `)
}

test("RLS and composite foreign keys isolate two Clerk identities", async (t) => {
  const db = await createDatabase()

  try {
    await seedTwoUsers(db)
    await setIdentity(db, "clerk_user_a")

    await t.test("user A cannot read user B rows", async () => {
      const result = await db.query(
        `SELECT id FROM public.accounts WHERE id = '${ACCOUNT_B}'`
      )

      assert.deepEqual(result.rows, [])
    })

    await t.test("user A can create a transaction with owned references", async () => {
      await db.exec(`
        INSERT INTO public.transactions (
          user_id, account_id, category_id, amount, type, date
        ) VALUES (
          '${USER_A}', '${ACCOUNT_A}', '${CATEGORY_A}', 25000, 'debit', CURRENT_DATE
        );
      `)
    })

    await t.test("user A cannot reference user B account or category", async () => {
      await expectConstraint(
        db,
        `INSERT INTO public.transactions (
          user_id, account_id, category_id, amount, type, date
        ) VALUES (
          '${USER_A}', '${ACCOUNT_B}', '${CATEGORY_A}', 25000, 'debit', CURRENT_DATE
        );`,
        "23503",
        "transactions_account_owner_fkey"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.transactions (
          user_id, account_id, category_id, amount, type, date
        ) VALUES (
          '${USER_A}', '${ACCOUNT_A}', '${CATEGORY_B}', 25000, 'debit', CURRENT_DATE
        );`,
        "23503",
        "transactions_category_owner_fkey"
      )
    })

    await t.test("all tenant-scoped relationships reject user B resources", async () => {
      await expectConstraint(
        db,
        `INSERT INTO public.categories (user_id, name, parent_id)
         VALUES ('${USER_A}', 'Invalid child', '${CATEGORY_B}');`,
        "23503",
        "categories_parent_owner_fkey"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.budgets (user_id, category_id, limit_amount)
         VALUES ('${USER_A}', '${CATEGORY_B}', 100000);`,
        "23503",
        "budgets_category_owner_fkey"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.recurring_rules (
          user_id, account_id, category_id, amount
        ) VALUES ('${USER_A}', '${ACCOUNT_B}', '${CATEGORY_A}', 50000);`,
        "23503",
        "recurring_rules_account_owner_fkey"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.recurring_rules (
          user_id, account_id, category_id, amount
        ) VALUES ('${USER_A}', '${ACCOUNT_A}', '${CATEGORY_B}', 50000);`,
        "23503",
        "recurring_rules_category_owner_fkey"
      )
    })

    await t.test("financial CHECK constraints reject invalid records", async () => {
      await expectConstraint(
        db,
        `INSERT INTO public.transactions (user_id, amount, type, date)
         VALUES ('${USER_A}', 0, 'debit', CURRENT_DATE);`,
        "23514",
        "transactions_amount_positive"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.transactions (user_id, amount, currency, type, date)
         VALUES ('${USER_A}', 1000, 'idr', 'debit', CURRENT_DATE);`,
        "23514",
        "transactions_currency_format"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.transactions (user_id, amount, type, date)
         VALUES ('${USER_A}', 1000, 'transfer', CURRENT_DATE);`,
        "23514",
        "transactions_type_valid"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.transactions (user_id, amount, type, status, date)
         VALUES ('${USER_A}', 1000, 'debit', 'unknown', CURRENT_DATE);`,
        "23514",
        "transactions_status_valid"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.budgets (user_id, category_id, limit_amount)
         VALUES ('${USER_A}', '${CATEGORY_A}', -1);`,
        "23514",
        "budgets_limit_positive"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.budgets (user_id, category_id, period, limit_amount)
         VALUES ('${USER_A}', '${CATEGORY_A}', 'harian', 100000);`,
        "23514",
        "budgets_period_valid"
      )

      await expectConstraint(
        db,
        `INSERT INTO public.budgets (
          user_id, category_id, limit_amount, start_date, end_date
        ) VALUES (
          '${USER_A}', '${CATEGORY_A}', 100000, CURRENT_DATE, CURRENT_DATE - 1
        );`,
        "23514",
        "budgets_date_order"
      )
    })

    await t.test("audit logs are trigger-written, private, and immutable", async () => {
      await db.exec(`
        INSERT INTO public.transactions (
          id, user_id, account_id, category_id, amount, type, date
        ) VALUES (
          '${AUDITED_TRANSACTION}', '${USER_A}', '${ACCOUNT_A}', '${CATEGORY_A}',
          75000, 'debit', CURRENT_DATE
        );
      `)

      const ownAudit = await db.query(`
        SELECT table_name, row_id, action, payload
        FROM public.audit_logs
        WHERE row_id = '${AUDITED_TRANSACTION}'
      `)

      assert.deepEqual(ownAudit.rows, [
        {
          table_name: "transactions",
          row_id: AUDITED_TRANSACTION,
          action: "INSERT",
          payload: { source: "database_trigger" },
        },
      ])

      await expectSqlState(
        db,
        `INSERT INTO public.audit_logs (user_id, table_name, action)
         VALUES ('${USER_A}', 'transactions', 'FORGED');`,
        "42501"
      )
      await expectSqlState(
        db,
        `UPDATE public.audit_logs SET action = 'FORGED'
         WHERE row_id = '${AUDITED_TRANSACTION}';`,
        "42501"
      )
      await expectSqlState(
        db,
        `DELETE FROM public.audit_logs WHERE row_id = '${AUDITED_TRANSACTION}';`,
        "42501"
      )

      await setIdentity(db, "clerk_user_b")
      const otherUserAudit = await db.query(`
        SELECT id FROM public.audit_logs WHERE row_id = '${AUDITED_TRANSACTION}'
      `)
      assert.deepEqual(otherUserAudit.rows, [])

      await db.exec("RESET ROLE;")
      const functionSecurity = await db.query(`
        SELECT
          prosecdef,
          proconfig,
          has_function_privilege(
            'authenticated',
            'public.write_immutable_audit_log()',
            'EXECUTE'
          ) AS authenticated_can_execute
        FROM pg_proc
        WHERE oid = 'public.write_immutable_audit_log()'::regprocedure
      `)

      assert.equal(functionSecurity.rows[0].prosecdef, true)
      assert.equal(functionSecurity.rows[0].authenticated_can_execute, false)
      assert.ok(
        functionSecurity.rows[0].proconfig.includes("search_path=pg_catalog, public")
      )

      await setIdentity(db, "clerk_user_a")
    })
  } finally {
    await db.exec("RESET ROLE;")
    await db.close()
  }
})
