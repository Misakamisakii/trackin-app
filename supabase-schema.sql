-- Run this entire file in your Supabase SQL Editor

-- 1. Create the projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text not null,
  category text,
  genre text,
  introduction text,
  cover_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create the tracks table
create table public.tracks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text,
  artist text,
  lyricist text,
  composer text,
  sample_source text,
  bpm integer,
  genre text,
  status text,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Set up Storage for covers
insert into storage.buckets (id, name, public) values ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Allow public access to covers (Storage RLS)
create policy "Public Access" on storage.objects for all using ( bucket_id = 'covers' );

-- 5. For a local MVP, we will disable Row Level Security (RLS) on the tables
-- This allows our frontend to freely insert/update/delete without needing authentication.
-- In a real production app, you should enable RLS and add proper auth policies!
alter table public.projects disable row level security;
alter table public.tracks disable row level security;
