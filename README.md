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

The current auth flow uses Google OAuth through Supabase.
After the first sign-in, the app asks the user to choose a username and stores it in Supabase auth metadata.

### Google OAuth Setup

1. In Google Cloud OAuth client settings:
   - Add origins: `http://localhost:5173`, `https://plumboard.xyz`
   - Add redirect URIs:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - `http://127.0.0.1:54321/auth/v1/callback`
2. In Supabase Dashboard, enable Google provider and add your Google client ID and secret.
3. In Supabase Auth URL configuration, make sure:
   - Site URL includes `https://plumboard.xyz`
   - Redirect URL allow list includes `http://localhost:5173`

For local Supabase CLI (`supabase start`) add this to `supabase/.env`:

```sh
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=...
```

## Board Data

Board and note data now live in Supabase too.

Apply the SQL migration in `supabase/migrations/20260320183000_create_boards_and_notes.sql`
to create the `boards` and `notes` tables plus RLS policies.

## Link Preview Function

Link notes can fetch Open Graph metadata through a Supabase Edge Function:

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
- [ ] Standardize board terminology across UI copy and data model naming
- [x] Edit board descriptions
- [x] Delete boards
- [x] Edit existing text notes
- [ ] Fix text notes UX to feel more natural
- [x] Add rich text support to notes
- [ ] Remove "Edit" from notes context menu
- [ ] Edit existing link notes
- [ ] Edit existing image notes
- [x] Delete notes
- [x] Upload real images with Supabase Storage
- [x] Replace placeholder image notes with uploaded images
- [ ] Rename "images" to "files" across UI and data labels
- [x] Fetch real link metadata and social preview images
- [ ] Fix link note text clipping/cutoff (links unreadable)
- [ ] Fix file note details spacing (filename has too much bottom padding)
- [x] Persist deletions to Supabase
- [ ] Fix board trash icon
- [ ] Fix board list layout/UX in the sidebar
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
- [ ] Make board title/description editing feel more natural
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

### Env Profile Switching

Use one command to switch web auth keys between local and prod:

```sh
npm run env:local   # copy apps/web/.env.local.local -> apps/web/.env.local
npm run env:prod    # copy apps/web/.env.local.prod  -> apps/web/.env.local
npm run env:which   # print active VITE_SUPABASE_URL
```

You can also switch and start the app in one command:

```sh
npm run dev:local
npm run dev:prod
```

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
   - Default is `/` (works for custom/root domains like `plumboard.xyz`).
   - Set `/<repo-name>/` if you deploy under a project subpath.
   - Use `/` if you deploy from a user/org root domain or a custom domain root.
4. In Supabase Auth URL config, add your Pages origin and callback URL.
   - Example: `https://<user>.github.io/<repo>/`
