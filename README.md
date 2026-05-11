# Brewia

Brewia is a React Native + Expo mobile app backed by Supabase. It serves as a "coffee voyage diary" — tracking your beans, brew sessions, tasting scores, and reusable brew presets.

> **Breaking change (PR #119):** The previous Next.js + Auth.js + Turso (SQLite) stack has been replaced entirely. Existing Turso data is not migrated. Follow the Supabase setup steps below to get started fresh.

## Stack

| Layer | Technology |
|---|---|
| Mobile runtime | Expo SDK 52 / React Native 0.76 |
| Navigation | Expo Router (file-based) |
| Auth | Supabase Auth (Google OAuth + deep link) |
| Database | Supabase Postgres (via Supabase JS client) |
| Schema management | Drizzle ORM (schema definition + hand-written migrations) |
| Forms | react-hook-form + Zod |
| Tests | jest-expo + @testing-library/react-native |

## Getting Started

### 1. Clone and install

```shell
git clone <repo>
cd brewia
pnpm install
```

### 2. Set up environment variables

```shell
cp .env.example .env
```

Edit `.env` with your Supabase project credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

### 3. Provision Supabase (first time only)

#### a. Apply database migrations

In your Supabase project's **SQL Editor**, run the following files in order:

1. `drizzle/0000_init.sql` — creates all tables with RLS policies
2. `drizzle/0001_rename_brew_preset_to_preset.sql` — renames `brew_preset` to `preset`

#### b. Configure Google OAuth

1. In the Supabase dashboard go to **Authentication > Providers > Google**. Enable it and enter your Google OAuth client credentials.
2. Add the following to **Authorized Redirect URLs** in Supabase Auth settings:
   ```
   brewia://auth/callback
   ```
3. In the Google Cloud Console, add the following to **Authorized redirect URIs** for your OAuth client:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

### 4. Start the app

```shell
pnpm start
```

Scan the QR code with **Expo Go** on your device (iOS or Android).

## Development Scripts

| Command | Description |
|---|---|
| `pnpm start` | Start the Expo dev server |
| `pnpm ios` | Open on iOS simulator |
| `pnpm android` | Open on Android emulator |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run jest tests |
| `pnpm db:generate` | Run drizzle-kit generate (requires `SUPABASE_DB_URL`) |
| `pnpm db:studio` | Open Drizzle Studio |

## Project Structure

```
app/                  Expo Router screens
  _layout.tsx         Root layout (session guard)
  (auth)/             Unauthenticated screens
    login.tsx         Google sign-in screen
  (tabs)/             Bottom tab navigation
    index.tsx         Dashboard
    beans/            Bean CRUD screens
    brews/            Brew CRUD screens
    presets/          Preset CRUD screens

src/
  components/         Reusable React Native components
    form/             Form field components
  features/           Feature modules (api + schema)
    beans/
    brews/
    flavors/
    presets/
  lib/                Utilities (supabase client, auth, env)
  types/              Shared TypeScript types

drizzle/              Supabase schema management
  schema/index.ts     Drizzle table definitions (pg-core)
  0000_init.sql       Initial schema + RLS policies
  0001_rename_brew_preset_to_preset.sql
  meta/               Drizzle migration journal
```

## Documentation

- [Development Guide](./docs/development-guide.md)
- [Auth Architecture](./docs/auth-architecture.md)
- [Data Structures](./docs/data-structures.md)
- [Screen Spec](./docs/screen-spec.md)
- [Requirements](./docs/requirements.md)
