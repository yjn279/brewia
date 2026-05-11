# Development Guide

Brewia implementation guidelines for Expo + Supabase mobile.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Expo SDK 52, React Native 0.76 |
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
| `SUPABASE_DB_URL` | Postgres connection string for drizzle-kit only (never shipped to app) |

Variables prefixed with `EXPO_PUBLIC_` are bundled into the app. The `SUPABASE_DB_URL` is only used by local `drizzle-kit` commands.
