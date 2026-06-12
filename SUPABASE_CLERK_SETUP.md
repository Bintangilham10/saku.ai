# Clerk + Supabase Setup

Saku AI uses Clerk as the identity provider and Supabase as the application database. All application data access happens on the server with the signed-in Clerk user's token.

## Prerequisites

- A Clerk application
- A Supabase project
- The project dependencies installed with `npm install`

## 1. Configure Clerk in Supabase

1. Open the Supabase Dashboard.
2. Go to **Authentication > Sign In / Providers** or **Authentication > Integrations**, depending on the current dashboard layout.
3. Add Clerk as a third-party authentication provider.
4. Follow the Clerk and Supabase instructions to make the Clerk session token available to Supabase.

The `sub` claim must contain the Clerk user ID because the database policies map that value to `app_users.clerk_id`.

## 2. Configure Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

Saku AI does not require a Supabase service-role key for normal application requests. Keeping that key out of the app configuration preserves Row Level Security as the primary data boundary.

## 3. Apply Database Migrations

Apply the SQL files in `supabase/migrations/` in numeric order.

The initial migration creates the application tables, helper functions, indexes, triggers, and Row Level Security policies. The recurring detection migration adds metadata used by the recurring insight feature.

## 4. Verify the Integration

1. Run `npm run dev`.
2. Sign in through Clerk.
3. Add a transaction.
4. Confirm that the transaction appears only for the signed-in user.
5. Review Supabase logs if a request is rejected by Row Level Security.

## Server-Side Usage

Use the authenticated server client:

```typescript
import { createSupabaseServerClient } from "@/lib/supabase";

const supabase = await createSupabaseServerClient();

if (!supabase) {
  throw new Error("Supabase is not configured.");
}

const { data, error } = await supabase
  .from("transactions")
  .select("*")
  .order("date", { ascending: false });
```

Do not create a browser-wide Supabase client with privileged credentials. Mutations should go through authenticated route handlers or server actions that validate input and ownership.

## Troubleshooting

### Requests return unauthorized

- Verify both Clerk environment variables.
- Confirm the user has an active Clerk session.
- Confirm the protected route is included in `src/middleware.ts`.

### Supabase returns an RLS error

- Confirm the Clerk token is accepted by Supabase.
- Inspect the token's `sub` claim.
- Confirm an `app_users` row exists with the matching `clerk_id`.
- Review the policies in `supabase/migrations/001_example_tables_with_rls.sql`.
