-- 新增版本管理功能的数据库结构

-- 1. 创建 track_versions 表
create table public.track_versions (
  id uuid default gen_random_uuid() primary key,
  track_id uuid references public.tracks(id) on delete cascade not null,
  name text not null,                    -- V1, V2, etc.
  audio_url text,                        -- 音频文件URL
  changes text not null default '',      -- 修改点描述
  is_latest boolean default true,        -- 是否最新版本
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 为每个track的最新版本创建索引
create index idx_track_versions_track_id on public.track_versions (track_id);
create index idx_track_versions_latest on public.track_versions (track_id, is_latest) where is_latest = true;

-- 3. 禁用RLS（开发阶段）
alter table public.track_versions disable row level security;

-- 4. 创建音频文件存储桶
insert into storage.buckets (id, name, public) values ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- 5. 允许公共访问音频文件
create policy "Public Access Audio" on storage.objects for all using ( bucket_id = 'audio-files' );