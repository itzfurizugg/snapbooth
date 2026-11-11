create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.sessions (
  id text primary key check (id ~ '^[A-Za-z0-9]{10}$'),
  file_path text not null unique,
  frame_id text not null check (frame_id in ('kilat', 'klasik', 'bioskop')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint sessions_expiry_after_creation check (expires_at > created_at)
);

create index if not exists sessions_expires_at_idx on public.sessions (expires_at);

alter table public.sessions enable row level security;

drop policy if exists "Read unexpired public sessions" on public.sessions;
create policy "Read unexpired public sessions"
  on public.sessions for select to anon, authenticated
  using (expires_at > now());

drop policy if exists "Create expiring public sessions" on public.sessions;
create policy "Create expiring public sessions"
  on public.sessions for insert to anon, authenticated
  with check (
    expires_at > now()
    and expires_at <= now() + interval '24 hours 5 minutes'
  );

grant select, insert on public.sessions to anon, authenticated;

grant usage on schema storage to anon, authenticated;
grant select on storage.objects to anon, authenticated;
grant insert on storage.objects to anon, authenticated;

drop policy if exists "Read strip images" on storage.objects;
create policy "Read strip images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'strips');

drop policy if exists "Upload strip images" on storage.objects;
create policy "Upload strip images"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'strips'
    and name ~ '^[A-Za-z0-9]{10}\.png$'
    and coalesce((metadata->>'size')::bigint, 0) <= 12582912
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('strips', 'strips', true, 12582912, array['image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Configure a Supabase Vault secret named project_url, then uncomment and schedule:
-- select cron.schedule(
--   'delete-expired-snapbooth-strips',
--   '*/15 * * * *',
--   $$
--     select net.http_post(
--       url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/cleanup-expired-strips',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cleanup_secret')
--       ),
--       body := '{}'::jsonb
--     );
--   $$
-- );
