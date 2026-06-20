import assert from "node:assert/strict"
import test from "node:test"

import {
  isClerkConfigured,
  isSupabaseConfigured,
  shouldUseDemoData,
} from "../src/lib/server-config.ts"
import { LiveDataUnavailableError, loadLiveData } from "../src/lib/live-data.ts"

const configuredEnvironment = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
  CLERK_SECRET_KEY: "sk_test_example",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-example",
}

test("configuration is live only when Clerk and Supabase are complete", () => {
  assert.equal(isClerkConfigured(configuredEnvironment), true)
  assert.equal(isSupabaseConfigured(configuredEnvironment), true)
  assert.equal(shouldUseDemoData(configuredEnvironment), false)

  assert.equal(shouldUseDemoData({ ...configuredEnvironment, CLERK_SECRET_KEY: undefined }), true)
  assert.equal(
    shouldUseDemoData({
      ...configuredEnvironment,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    }),
    true
  )
})

test("live loader fails closed and preserves the original cause", async () => {
  const cause = new Error("database unavailable")
  const logged = []

  await assert.rejects(
    loadLiveData(
      async () => {
        throw cause
      },
      (...args) => logged.push(args)
    ),
    (error) => {
      assert.ok(error instanceof LiveDataUnavailableError)
      assert.equal(error.message, "Gagal memuat data finansial live.")
      assert.equal(error.cause, cause)
      return true
    }
  )

  assert.equal(logged.length, 1)
})

test("live loader returns successful live data unchanged", async () => {
  const dataset = { mode: "live", balance: 125_000 }

  assert.deepEqual(await loadLiveData(async () => dataset), dataset)
})
