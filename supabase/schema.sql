-- SnapJigsaw Supabase schema
-- Run this once in your Supabase project's SQL editor (Dashboard > SQL Editor > New query).

-- ---------------------------------------------------------------------------
-- 1. Table: polaroids
-- ---------------------------------------------------------------------------
create table if not exists public.polaroids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text not null,        -- path within the 'polaroids' storage bucket
  caption text not null default '',
  frame_style text not null default 'classic',
  taken_at text not null,          -- display date string, matches the app's existing format
  share_slug text unique,          -- null = not shared; set = publicly viewable via this slug
  created_at timestamptz not null default now()
);

create index if not exists polaroids_user_id_idx on public.polaroids (user_id);
create index if not exists polaroids_share_slug_idx on public.polaroids (share_slug);

alter table public.polaroids enable row level security;

-- Owners can fully manage their own rows.
create policy "Users can view their own polaroids"
  on public.polaroids for select
  using (auth.uid() = user_id);

create policy "Users can insert their own polaroids"
  on public.polaroids for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own polaroids"
  on public.polaroids for update
  using (auth.uid() = user_id);

create policy "Users can delete their own polaroids"
  on public.polaroids for delete
  using (auth.uid() = user_id);

-- Anyone (including logged-out visitors) can read a row IF it has been
-- explicitly shared, and ONLY that row — this is what powers public share links
-- without exposing the rest of a user's wall.
create policy "Anyone can view a polaroid that has been shared"
  on public.polaroids for select
  using (share_slug is not null);

-- ---------------------------------------------------------------------------
-- 2. Storage bucket: polaroids
-- ---------------------------------------------------------------------------
-- Public bucket: images are only ever meaningful when linked from a row's
-- image_path, and the row itself is what's access-controlled above. Path
-- convention: {user_id}/{polaroid_id}.jpg
insert into storage.buckets (id, name, public)
values ('polaroids', 'polaroids', true)
on conflict (id) do nothing;

create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'polaroids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own files"
  on storage.objects for update
  using (
    bucket_id = 'polaroids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'polaroids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view polaroid images"
  on storage.objects for select
  using (bucket_id = 'polaroids');
