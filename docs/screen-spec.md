# Screen Spec (Mobile)

Minimum screen specification for the Brewia mobile app (Expo Router).

## Tab Navigation

The main navigation is a Bottom Tab bar with 4 tabs:

| Tab | Route | Description |
|---|---|---|
| Home | `/(tabs)/` | Dashboard: counts of beans / brews / presets |
| Beans | `/(tabs)/beans/` | Bean list |
| Brews | `/(tabs)/brews/` | Brew list |
| Presets | `/(tabs)/presets/` | Preset list |

## Screen Map

| Route | Description | Auth |
|---|---|---|
| `/(auth)/login` | Google sign-in button | Public |
| `/(tabs)/` | Dashboard with counts | Required |
| `/(tabs)/beans/` | Bean list (FlatList + BeanCard) | Required |
| `/(tabs)/beans/new` | New bean form | Required |
| `/(tabs)/beans/[id]` | Bean detail + edit/delete buttons | Required |
| `/(tabs)/beans/[id]/edit` | Edit bean form | Required |
| `/(tabs)/brews/` | Brew list (FlatList + BrewCard) | Required |
| `/(tabs)/brews/new` | New brew form | Required |
| `/(tabs)/brews/[id]` | Brew detail + flavor badges + scores | Required |
| `/(tabs)/brews/[id]/edit` | Edit brew form | Required |
| `/(tabs)/presets/` | Preset list (FlatList + PresetCard) | Required |
| `/(tabs)/presets/new` | New preset form | Required |
| `/(tabs)/presets/[id]` | Preset detail + step list | Required |
| `/(tabs)/presets/[id]/edit` | Edit preset form | Required |

## Auth Flow

1. App opens → `app/_layout.tsx` checks `useSession()`
2. While loading: blank screen (no flash)
3. If no session: redirect to `/(auth)/login`
4. If session exists: render tabs

## Common Patterns

- Lists: `FlatList` with card components; empty state text when no data
- Forms: `react-hook-form` + Zod validation; inline error messages per field
- Delete: `Alert.alert` confirmation before `deleteX(id)` call
- Navigation: `router.push()` to navigate forward, `router.back()` after save/cancel
- Select fields: custom `Modal`-based picker (no native Picker dependency on web)
