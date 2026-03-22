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

## Todo

- [x] Rename boards
- [x] Edit board descriptions
- [x] Delete boards
- [x] Edit existing note scraps
- [ ] Edit existing link scraps
- [ ] Edit existing image scraps
- [x] Delete scraps
- [x] Upload real images with Supabase Storage
- [x] Replace placeholder image scraps with uploaded images
- [ ] Fetch real link metadata and social preview images
- [x] Persist deletions to Supabase
- [ ] Add shared boards / multi-user collaboration
- [ ] Add realtime sync
- [ ] Handle multi-session conflicts cleanly
- [ ] Show richer save/loading/error state in the UI
- [ ] Improve empty-state onboarding
- [ ] Add mobile interaction polish
- [x] Dial down the minimap and zoom-controls shadow
- [x] Make zoom-controls colors adapt to light/dark theme
- [x] Add tests
- [ ] Reduce bundle size with code-splitting/perf cleanup
- [ ] Move usernames from auth metadata into a profiles table if we need uniqueness/discovery/richer profiles
- [ ] Replace whole-board debounced upserts with more granular persistence if needed

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
