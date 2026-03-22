# Plumboard

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

## Link Preview Function

Link scraps can fetch Open Graph metadata through a Supabase Edge Function:

```sh
supabase functions deploy link-preview
```

`supabase/config.toml` sets `verify_jwt = false` for this function, so it can be invoked from the web client without a user JWT requirement.

For local function development:

```sh
supabase functions serve link-preview --no-verify-jwt
```

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
- [ ] Rename boards to decks across UI copy and data model naming
- [x] Edit board descriptions
- [x] Delete boards
- [x] Edit existing note scraps
- [ ] Fix notes scraps UX to feel more natural
- [x] Add rich text support to notes
- [ ] Remove "Edit" from notes context menu
- [ ] Edit existing link scraps
- [ ] Edit existing image scraps
- [x] Delete scraps
- [x] Upload real images with Supabase Storage
- [x] Replace placeholder image scraps with uploaded images
- [ ] Rename "images" to "files" across UI and data labels
- [x] Fetch real link metadata and social preview images
- [ ] Fix link scrap text clipping/cutoff (links unreadable)
- [ ] Fix file scrap details spacing (filename has too much bottom padding)
- [x] Persist deletions to Supabase
- [ ] Fix board/deck trash icon
- [ ] Fix deck list layout/UX in the sidebar
- [ ] Add shared boards / multi-user collaboration
- [ ] Add realtime sync
- [ ] Handle multi-session conflicts cleanly
- [ ] Show richer save/loading/error state in the UI
- [ ] Improve empty-state onboarding
- [ ] Add mobile interaction polish
- [ ] Allow right-click context menu on open canvas space
- [ ] Add lasso selection
- [x] Dial down the minimap and zoom-controls shadow
- [x] Make zoom-controls colors adapt to light/dark theme
- [ ] Make deck title/description editing feel more natural
- [x] Add tests
- [x] Refactor into smaller, more modular/testable files
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

## Deploy To GitHub Pages

This repo includes a workflow at `.github/workflows/deploy-pages.yml` that builds `apps/web`
and deploys to GitHub Pages on pushes to `main`.

Required one-time setup:

1. In GitHub repo settings, go to Pages and set **Source** to **GitHub Actions**.
2. Add these repository variables or secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. (Optional) Override the default Pages base path with `VITE_BASE_PATH`.
   - Default is `/<repo-name>/` for project pages.
   - Use `/` if you deploy from a user/org root domain or a custom domain root.
4. In Supabase Auth URL config, add your Pages origin and callback URL.
   - Example: `https://<user>.github.io/<repo>/`
