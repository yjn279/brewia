# Development Guide

Brewia implementation guidelines for Expo + Supabase mobile.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Expo SDK 54, React Native 0.81 |
| Navigation | Expo Router (file-based, typed routes) |
| Language | TypeScript (strict) |
| Forms | react-hook-form + Zod |
| Database client | @supabase/supabase-js |
| Schema definition | Drizzle ORM (pg-core, schema-only — no runtime DB connection) |
| Auth | Supabase Auth (Google OAuth) |
| Tests | jest-expo, @testing-library/react-native |

## Layer Architecture

```
Screens (Expo Router)
  └─ src/features/<resource>/api.ts     (Supabase JS queries)
       └─ @supabase/supabase-js
            └─ Supabase Postgres + RLS
```

There is no server-side code. All data access goes directly from the mobile client to Supabase via the JS client, protected by Row Level Security on the database side.

### Screen Layer (`app/**/`)

- Expo Router file-based screens
- `app/_layout.tsx` — root layout, handles session guard (redirect to login if no session)
- `app/(auth)/` — unauthenticated screens (login)
- `app/(tabs)/` — authenticated screens behind Bottom Tab navigator
- Each screen is responsible for fetching its own data via `useEffect` + feature API

### Feature Module Layer (`src/features/<resource>/`)

Each resource has two files:

- `api.ts` — thin Supabase JS wrappers (`listBeans`, `getBean`, `createBean`, etc.)
- `schema.ts` — Zod schema for form validation (`upsertBeanSchema`)

The API functions are plain `async` functions — no hooks, no React context.

### Component Layer (`src/components/`)

- Pure presentational React Native components
- `BeanCard`, `BrewCard`, `PresetCard` — list item cards
- `form/TextField`, `NumberField`, `SelectField`, `StepListField`, `RatingField` — reusable form fields
- `FlavorPicker` — modal-based flavor multi-select
- `ScreenContainer` — `SafeAreaView` + optional `ScrollView` wrapper

### Schema / Migration Layer (`drizzle/`)

Drizzle is used **only** for schema definition and migration file generation. The mobile app does NOT use the Drizzle `db` handle at runtime — it uses `@supabase/supabase-js` directly.

## Naming Conventions

- Files: `camelCase.ts` for utilities, `PascalCase.tsx` for components
- DB columns: `snake_case` (Postgres convention)
- TypeScript types: `PascalCase` interfaces in `src/types/domain.ts`
- Zod schemas: `upsert<Resource>Schema`, types inferred as `Upsert<Resource>Dto`

## Input Validation

All user input is validated with Zod schemas before submission:

1. Define schema in `src/features/<resource>/schema.ts`
2. Pass schema to `useForm({ resolver: zodResolver(schema) })`
3. Display field-level errors via `errors.<field>?.message` in form components

## Form Pattern

```tsx
const { control, handleSubmit, formState: { errors } } = useForm<Dto>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
})

// In JSX:
<Controller
  control={control}
  name="fieldName"
  render={({ field: { value, onChange, onBlur } }) => (
    <TextField value={value} onChangeText={onChange} onBlur={onBlur} error={errors.fieldName?.message} />
  )}
/>
```

## Error Handling

- Form validation errors: shown inline via `TextField`/`NumberField` `error` prop
- API errors: caught in `onSubmit`, shown via `Alert.alert('Error', message)`
- Auth errors: shown via `Alert.alert` in `login.tsx`

## Testing

- Framework: `jest` + `jest-expo` preset
- UI tests: `@testing-library/react-native`
- All Supabase client calls are mocked in `jest.setup.ts`
- Smoke test: `src/components/BeanCard.test.tsx`

Run tests:
```shell
pnpm test
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (exposed to app) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (exposed to app) |
| `EXPO_PUBLIC_E2E_USER_ID` | E2E session bypass UUID — **non-production only** |
| `SUPABASE_DB_URL` | Postgres connection string for drizzle-kit only (never shipped to app) |

Variables prefixed with `EXPO_PUBLIC_` are bundled into the app. The `SUPABASE_DB_URL` is only used by local `drizzle-kit` commands.

`EXPO_PUBLIC_E2E_USER_ID` activates a session bypass in `useSession()` when set in non-production builds. See the [Auth Architecture](./auth-architecture.md#test-mode-e2e-session-bypass) docs for details.

## Web Development & Verification

### Running on Web

```shell
pnpm exec expo start --web
```

This uses `react-native-web` to render the app in a browser. Requires no additional setup beyond `pnpm install`.

### E2E session bypass

Google OAuth cannot run headlessly. For browser testing, start Expo with `EXPO_PUBLIC_E2E_USER_ID`:

```shell
EXPO_PUBLIC_E2E_USER_ID=00000000-0000-0000-0000-000000000001 pnpm exec expo start --web
```

The app skips OAuth and shows the `(tabs)` layout directly.

### Running the verify-web smoke test

```shell
# First time only — install browser binary:
pnpm exec playwright install chromium

# Run the smoke (Metro + headless Chromium + zero-error assertion):
pnpm verify:web
```

`pnpm verify:web` runs `scripts/verify-web.mjs` which:
1. Finds a free TCP port.
2. Spawns `expo start --web` with `EXPO_PUBLIC_E2E_USER_ID` in env.
3. Waits until `/status` returns `packager-status:running`.
4. Launches headless Chromium via Playwright.
5. Navigates to `/`, `/beans`, `/brews`, `/presets`, `/beans/new`.
6. Asserts zero `error`-level console messages on each page.
7. Exits 0 on success, 1 with a printed error summary on failure.

### Applying Supabase migrations

Run these SQL files in order via the [Supabase SQL Editor](https://supabase.com/dashboard/project/afpqxkhioltnkcrqifnr/sql/new):

1. `drizzle/0000_init.sql`
2. `drizzle/0001_rename_brew_preset_to_preset.sql`
