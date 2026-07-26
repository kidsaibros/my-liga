-- Profil sahifasi + admin sozlamalari uchun: app_settings (singleton), user_favorites,
-- avatars storage bucket, va profiles'ga bildirishnoma preference ustunlari.

-- ── app_settings (singleton — bitta qator, id doim shu fixed UUID) ──────────
create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  telegram_support_url text,
  phone_support text,
  app_name text,
  system_status text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, telegram_support_url, phone_support, app_name, system_status)
values ('00000000-0000-0000-0000-000000000001', 'https://t.me/myliga_support', '+998901234567', 'MY LIGA', 'Faol')
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

create policy "read_authenticated" on public.app_settings for select to authenticated using (true);
create policy "admin_write" on public.app_settings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── user_favorites (foydalanuvchi sevimli jamoalari) ─────────────────────────
create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, team_id)
);
create index user_favorites_user_idx on public.user_favorites(user_id);

alter table public.user_favorites enable row level security;

create policy "select_own" on public.user_favorites for select to authenticated
  using (auth.uid() = user_id);
create policy "insert_own" on public.user_favorites for insert to authenticated
  with check (auth.uid() = user_id);
create policy "delete_own" on public.user_favorites for delete to authenticated
  using (auth.uid() = user_id);

-- ── profiles: bildirishnoma preference'lari (hozircha faqat saqlanadi, real push yo'q) ──
alter table public.profiles add column if not exists push_enabled boolean not null default true;
alter table public.profiles add column if not exists email_enabled boolean not null default true;

-- ── storage: avatars bucket (public read, faqat o'z papkasiga yozish) ───────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_own_insert" on storage.objects;
create policy "avatars_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_own_delete" on storage.objects;
create policy "avatars_own_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
