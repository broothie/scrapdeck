# Scrapdeck

Workspace layout:

- `apps/web` - current web app
- `packages/core` - shared types, seed data, and state
- `packages/ui` - shared Tamagui config and UI components

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
