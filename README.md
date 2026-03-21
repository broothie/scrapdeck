# Scrapdeck

Workspace layout:

- `apps/web` - current web app
- `packages/core` - shared types, seed data, and state
- `packages/ui` - shared Tamagui config and UI components

## Supabase Auth

The web app expects Supabase auth env vars in `apps/web/.env.local`:

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The current auth flow uses passwordless email magic links through Supabase.
After the first sign-in, the app asks the user to choose a username and stores it in Supabase auth metadata.

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
