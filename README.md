# Scrapdeck

Workspace layout:

- `apps/web` - current web app
- `packages/core` - shared types, schema types, and state
- `packages/ui` - shared Tamagui config and UI components

## Supabase Auth

The web app expects Supabase auth env vars in `apps/web/.env.local`:

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The current auth flow uses passwordless email magic links through Supabase.
After the first sign-in, the app asks the user to choose a username and stores it in Supabase auth metadata.

## Board Data

Board and scrap data now live in Supabase too.

Apply the SQL migration in `supabase/migrations/20260320183000_create_boards_and_scraps.sql`
to create the `boards` and `scraps` tables plus RLS policies.

## Supabase Types

The typed Supabase client uses the generated schema type in `packages/core/src/database.types.ts`.

To regenerate it from the linked Supabase project after schema changes:

```sh
npx supabase link --project-ref <your-project-ref>
npm run db:types
```

If `supabase link` prompts for credentials, use your local Supabase access token and database password for that project.

## Local Run

If you use `mise`, trust the repo once:

```sh
mise trust
```

Then start the prototype with:

```sh
npm run dev
```

The app will be available at `http://localhost:4173`.

## Build

```sh
npm run build
```
