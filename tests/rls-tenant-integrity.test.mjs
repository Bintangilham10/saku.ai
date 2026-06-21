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
  } finally {
    await db.exec("RESET ROLE;")
    await db.close()
  }
})
