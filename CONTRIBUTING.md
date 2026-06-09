# Contributing to Saku AI

Thanks for helping improve Saku AI. This guide keeps changes aligned with the product goal: a compact, safe, and usable student finance app.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Prepare `.env.local` for Clerk, Supabase, and the AI provider you use.

3. Run the app:

   ```bash
   npm run dev
   ```

## Development Principles

- Prioritize the core product: transactions, dashboard, accounts, budgets, goals, and chat powered by summarized data.
- Do not show buttons or pages unless the flow works end-to-end.
- Validate data on the server for every mutation endpoint.
- Protect privacy: send aggregated summaries to AI, not unnecessary raw data.
- Use existing components and patterns before adding new abstractions.
- Keep demo mode working so the app remains usable without full configuration.

## Pre-Commit Checklist

- The UI does not expose unfinished placeholder features.
- User data remains protected by authentication and ownership checks.
- The local build succeeds:

  ```bash
  npm run build
  ```

- If data logic changes, add or update tests when available.
- Documentation is updated when feature scope changes.

## Database Migrations

Add schema changes in `supabase/migrations/`. For tables that store user data:

- Add a `user_id` column.
- Enable Row Level Security.
- Make sure policies only allow access to the data owner.
- Add indexes on frequently filtered columns, especially `user_id` and date fields.

## Pull Request

Briefly explain:

- What changed.
- Why the change is needed.
- What needs manual testing.
- Screenshots for UI changes.
