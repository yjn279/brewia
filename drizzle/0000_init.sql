-- Brewia initial schema for Supabase / Postgres
-- Apply via Supabase SQL Editor: Settings > SQL Editor > New query

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- flavor (master, not user-owned)
-- ---------------------------------------------------------------------------
create table if not exists flavor (
  id          text        primary key,
  name        text        not null,
  category    text        not null,
  subcategory text        not null,
  created     timestamptz not null default now(),
  updated     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- bean
-- ---------------------------------------------------------------------------
create table if not exists bean (
  id         text        primary key,
  user_id    text        not null references auth.users(id) on delete cascade,
  name       text        not null,
  country    text        not null,
  region     text        not null default '',
  farm       text        not null default '',
  process    text        not null default '',
  variety    text        not null default '',
  roast      text        not null,
  roaster    text        not null default '',
  price_jpy  integer     not null default 0,
  notes      text        not null default '',
  created    timestamptz not null default now(),
  updated    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- brew
-- ---------------------------------------------------------------------------
create table if not exists brew (
  id           text        primary key,
  user_id      text        not null references auth.users(id) on delete cascade,
  bean_id      text        not null references bean(id) on delete cascade,
  bean_weight  real        not null,
  bean_grind   real        not null default 0,
  water_weight real        not null,
  water_temp   real        not null default 0,
  steps        text        not null,  -- JSON BrewStep[]
  aroma        integer     not null,
  acidity      integer     not null,
  sweetness    integer     not null,
  body         integer     not null,
  overall      integer     not null,
  notes        text        not null default '',
  created      timestamptz not null default now(),
  updated      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- brew_flavor (join)
-- ---------------------------------------------------------------------------
create table if not exists brew_flavor (
  id        text        primary key,
  brew_id   text        not null references brew(id) on delete cascade,
  flavor_id text        not null references flavor(id) on delete cascade,
  created   timestamptz not null default now(),
  updated   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- brew_preset (will be renamed to `preset` in migration 0001)
-- ---------------------------------------------------------------------------
create table if not exists brew_preset (
  id          text        primary key,
  user_id     text        not null references auth.users(id) on delete cascade,
  name        text        not null,
  description text        not null default '',
  brew_ratio  real        not null default 0,
  steps       text        not null,  -- JSON BrewStep[]
  created     timestamptz not null default now(),
  updated     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table bean         enable row level security;
alter table brew         enable row level security;
alter table flavor       enable row level security;
alter table brew_flavor  enable row level security;
alter table brew_preset  enable row level security;

-- bean policies
create policy "bean_select"
  on bean for select using (user_id = auth.uid()::text);
create policy "bean_insert"
  on bean for insert with check (user_id = auth.uid()::text);
create policy "bean_update"
  on bean for update using (user_id = auth.uid()::text)
             with check (user_id = auth.uid()::text);
create policy "bean_delete"
  on bean for delete using (user_id = auth.uid()::text);

-- brew policies
create policy "brew_select"
  on brew for select using (user_id = auth.uid()::text);
create policy "brew_insert"
  on brew for insert with check (user_id = auth.uid()::text);
create policy "brew_update"
  on brew for update using (user_id = auth.uid()::text)
             with check (user_id = auth.uid()::text);
create policy "brew_delete"
  on brew for delete using (user_id = auth.uid()::text);

-- flavor policies (master – all users can read, no writes from app)
create policy "flavor_select"
  on flavor for select using (true);

-- brew_flavor policies
create policy "brew_flavor_select"
  on brew_flavor for select
  using (exists (
    select 1 from brew b
    where b.id = brew_flavor.brew_id and b.user_id = auth.uid()::text
  ));
create policy "brew_flavor_insert"
  on brew_flavor for insert
  with check (exists (
    select 1 from brew b
    where b.id = brew_flavor.brew_id and b.user_id = auth.uid()::text
  ));
create policy "brew_flavor_delete"
  on brew_flavor for delete
  using (exists (
    select 1 from brew b
    where b.id = brew_flavor.brew_id and b.user_id = auth.uid()::text
  ));

-- brew_preset policies
create policy "brew_preset_select"
  on brew_preset for select using (user_id = auth.uid()::text);
create policy "brew_preset_insert"
  on brew_preset for insert with check (user_id = auth.uid()::text);
create policy "brew_preset_update"
  on brew_preset for update using (user_id = auth.uid()::text)
                  with check (user_id = auth.uid()::text);
create policy "brew_preset_delete"
  on brew_preset for delete using (user_id = auth.uid()::text);
