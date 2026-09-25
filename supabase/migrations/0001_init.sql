-- Flat Match schema
-- All tables are accessed server-side only, via the Supabase service role key.
-- RLS is enabled everywhere; only `listings` gets a public read policy since it
-- holds no personal data. groups/members/responses have no client-facing
-- policies at all, so anon/authenticated roles get zero access even if the
-- anon key ever leaked into the browser.

create extension if not exists "pgcrypto";

create table groups (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  member_count int not null default 3,
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, name)
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade unique,
  hard_constraints jsonb not null,
  preferences jsonb not null,
  created_at timestamptz not null default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_url text unique not null,
  title text not null,
  locality text not null,
  rent int not null,
  bhk int not null,
  bathrooms int not null,
  floor int not null,
  has_lift boolean not null default false,
  parking boolean not null default false,
  pet_friendly boolean not null default false,
  furnished text not null default 'unfurnished', -- 'furnished' | 'semi' | 'unfurnished'
  amenities text[] not null default '{}',
  scraped_at timestamptz not null default now()
);

create index listings_locality_idx on listings(locality);
create index members_group_id_idx on members(group_id);

alter table groups enable row level security;
alter table members enable row level security;
alter table responses enable row level security;
alter table listings enable row level security;

-- Listings are non-sensitive demo data; allow anonymous read access for
-- direct display, but all writes still go through server routes with the
-- service role key.
create policy "listings are publicly readable"
  on listings for select
  using (true);
