# Requirements (Mobile + Supabase)

Brewia is a personal coffee diary mobile app. This document reflects the current state after the Expo + Supabase rewrite (PR #119).

## Product Overview

### Vision

A "coffee voyage diary" that accumulates the story of each bean you encounter — origin, roast, how you brewed it, and how it tasted.

### Target Users

- Home baristas who practice pour-over and manual brewing
- Specialty coffee enthusiasts who regularly try new beans
- Users who want to track the relationship between brew parameters and taste

## Features

### Authentication

- Google OAuth sign-in / sign-out via Supabase Auth
- Session persisted in AsyncStorage on device
- All tabs require authentication; unauthenticated users are redirected to the login screen
- All user data is fully isolated by `user_id` via RLS on the Supabase side

### Bean Management

| Feature |
|---|
| Create, edit, delete coffee beans |
| Fields: name, roaster, country, region, farm, variety, process, roast level, price (JPY), notes |
| Country from a fixed list (19 countries + Blended) |
| Roast level from 8 levels (Light through Italian) |
| Bean deletion cascades to associated brews (via DB FK) |

### Brew Logging

| Feature |
|---|
| Create, edit, delete brew sessions |
| Fields: bean, bean weight, water weight, temperature, grind, pour steps, aroma/acidity/sweetness/body/overall (0–5), flavor tags, notes |
| Pour steps stored as `BrewStep[]` JSON array |
| Flavor tagging via `brew_flavor` join table |
| On brew create/update: existing brew_flavor rows deleted, then new ones inserted |

### Brew Presets

| Feature |
|---|
| Create, edit, delete named preset templates |
| Fields: name, description, brew ratio, pour steps |
| Table renamed from `brew_preset` to `preset` (migration 0001) |

### Flavors

- Flavor master is shared across all users (read-only from the app)
- Multiple flavors can be tagged to a single brew
- Flavor picker is a modal multi-select in the brew form

### Dashboard

- Counts of beans, brews, and presets displayed on the home tab

## Non-Goals (PR #119)

- Real-time brew timer (simplified step-entry form only)
- Photo-based bean field extraction (removed; was Next.js + Anthropic Claude)
- PWA / Service Worker (Expo handles native distribution)
- Bean color / roast estimation from photo
- Existing Turso data migration

## Non-Functional Requirements

### Security

- DB row isolation via Supabase RLS (`user_id = auth.uid()`)
- `flavor` table is world-readable (no user-owned flavors)
- JWT verification handled by Supabase; client cannot forge `auth.uid()`

### Data Integrity

- Bean deletion cascades to brew rows via `ON DELETE CASCADE` FK
- Brew flavor associations are atomically replaced on each brew update
- All columns are NOT NULL; empty input stored as empty string or 0

### Validation

- All form fields validated client-side with Zod before submission
- Country and roast level restricted to fixed enum lists
- Scores validated as integers 0–5
