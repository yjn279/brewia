# Brewia

Brewia is a React Native + Expo mobile app backed by Supabase. It serves as a "coffee voyage diary" — tracking your beans, brew sessions, tasting scores, and reusable brew presets.

> **Breaking change (PR #119):** The previous Next.js + Auth.js + Turso (SQLite) stack has been replaced entirely. Existing Turso data is not migrated. Follow the Supabase setup steps below to get started fresh.

## Stack

| Layer | Technology |
|---|---|
| Mobile runtime | Expo SDK 54 / React Native 0.81 |
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
| `pnpm verify:web` | Browser E2E smoke via Playwright |

## Run on Web

Brewia supports running in a desktop/mobile browser via `react-native-web`.

### Start natively (iOS / Android)

```shell
pnpm install
pnpm start
```

### Start in the browser

```shell
pnpm exec expo start --web
```

Then open `http://localhost:8081` (or the printed port) in Chrome/Safari.

### E2E test bypass (`EXPO_PUBLIC_E2E_USER_ID`)

Google OAuth cannot be automated in a headless browser. For local/CI browser testing, set `EXPO_PUBLIC_E2E_USER_ID` to a UUID before starting Expo:

```shell
EXPO_PUBLIC_E2E_USER_ID=00000000-0000-0000-0000-000000000001 pnpm exec expo start --web
```

When this env var is set **and** `NODE_ENV !== 'production'`, `useSession()` returns a synthetic session with `user.id` equal to the supplied UUID, skipping the Google OAuth redirect. The app navigates directly to the `(tabs)` layout.

> **Important:** Never set `EXPO_PUBLIC_E2E_USER_ID` in production builds. It is intentionally inactive when `NODE_ENV === 'production'` even if the variable is present.

## Apply Supabase Migrations

Run the following SQL files **in order** via the Supabase SQL Editor:

1. `drizzle/0000_init.sql` — creates all tables with RLS policies
2. `drizzle/0001_rename_brew_preset_to_preset.sql` — renames `brew_preset` to `preset`

Open the editor at:  
`https://supabase.com/dashboard/project/afpqxkhioltnkcrqifnr/sql/new`

Paste each file's content and click **Run**.

## Verify (automated)

Run static checks:

```shell
pnpm typecheck   # TypeScript
pnpm lint        # ESLint
pnpm test        # jest unit tests
```

Run the browser end-to-end smoke:

```shell
# Install Playwright Chromium the first time:
pnpm exec playwright install chromium

# Run the full smoke (starts Metro, navigates tabs, asserts zero console errors):
pnpm verify:web
```

`pnpm verify:web` spawns Metro with `EXPO_PUBLIC_E2E_USER_ID` set, opens headless Chromium, and navigates through Home / Beans / Brews / Presets. It exits 0 on success or 1 with a printed error summary on failure.

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
