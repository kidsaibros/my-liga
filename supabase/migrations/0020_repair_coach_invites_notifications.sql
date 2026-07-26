-- TUZATUVCHI MIGRATSIYA
--
-- Muammo: admin panelidagi «Murabbiylar» bo'limida taklif yuborishga urinilganda
--   Could not find the table 'public.coach_invites' in the schema cache
-- xatosi chiqadi.
--
-- Sabab: `coach_invites` va `notifications` jadvallari 0016 migratsiyasining
-- OXIRIDA yaratiladi. Agar `combined_0001_0016.sql` skripti o'rtada xato bilan
-- to'xtagan bo'lsa, 0016'ning boshidagi qismlar (teams.status, is_coach(), RLS)
-- o'tib, oxiridagi jadvallar yaratilmay qolgan bo'ladi.
--
-- Bu fayl butunlay IDEMPOTENT: mavjud obyektlarga tegmaydi, faqat yo'qlarini
-- yaratadi. Xavfsiz qayta-qayta ishga tushirsa bo'ladi.
--
-- Oxirida PostgREST sxema keshi yangilanadi — agar jadval aslida bor bo'lib,
-- muammo faqat keshda bo'lsa, o'sha ham hal bo'ladi.

-- ── Old shart: is_admin() mavjudligi (0003'da yaratilgan) ───────────────────
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'is_admin' and pronamespace = 'public'::regnamespace) then
    raise exception '0003 migratsiyasi bajarilmagan: public.is_admin() funksiyasi yo''q. Avval 0003_auth_roles.sql ni ishga tushiring.';
  end if;
end $$;

-- ── coach_invites ───────────────────────────────────────────────────────────
-- Hali ro'yxatdan o'tmagan odamni email orqali 'coach' roliga taklif qilish.
-- U Google bilan kirganda /auth/callback shu jadvalni tekshirib rolni beradi.
create table if not exists public.coach_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.coach_invites enable row level security;

drop policy if exists "admin_all" on public.coach_invites;
create policy "admin_all" on public.coach_invites for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.coach_invites to authenticated;

-- ── notifications ───────────────────────────────────────────────────────────
-- Super Admin'ga yangi jamoa haqida xabar (admin paneldagi qo'ng'iroq belgisi).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_role text check (recipient_role in ('super_admin', 'admin')),
  recipient_id uuid references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_role_idx
  on public.notifications(recipient_role, read);

alter table public.notifications enable row level security;

drop policy if exists "select_own" on public.notifications;
create policy "select_own" on public.notifications for select to authenticated
  using (recipient_id = auth.uid() or (recipient_role = 'super_admin' and public.is_admin()));

drop policy if exists "update_own" on public.notifications;
create policy "update_own" on public.notifications for update to authenticated
  using (recipient_id = auth.uid() or (recipient_role = 'super_admin' and public.is_admin()))
  with check (recipient_id = auth.uid() or (recipient_role = 'super_admin' and public.is_admin()));

grant select, update on public.notifications to authenticated;

-- Realtime (qo'ng'iroq belgisi darhol yangilanishi uchun)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ── Yangi 'pending' jamoa yaratilganda Super Admin'ga xabar ─────────────────
create or replace function public.notify_team_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_name text;
begin
  select full_name into v_coach_name from public.profiles where user_id = new.created_by;

  insert into public.notifications (recipient_role, type, payload)
  values (
    'super_admin',
    'team_created',
    jsonb_build_object('team_id', new.id, 'team_name', new.name, 'coach_name', coalesce(v_coach_name, 'Noma''lum'))
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_team_created on public.teams;
create trigger trg_notify_team_created
  after insert on public.teams
  for each row when (new.status = 'pending')
  execute function public.notify_team_created();

-- ── PostgREST sxema keshini yangilash ───────────────────────────────────────
-- "Could not find the table ... in the schema cache" xatosi jadval BOR bo'lsa
-- ham chiqishi mumkin — PostgREST eski keshda ishlayotgan bo'lsa. Shu buyruq
-- uni qayta o'qishga majbur qiladi.
notify pgrst, 'reload schema';

-- ── Tekshiruv: hammasi joyidami? ────────────────────────────────────────────
do $$
declare
  v_missing text := '';
begin
  if to_regclass('public.coach_invites') is null then v_missing := v_missing || 'coach_invites '; end if;
  if to_regclass('public.notifications') is null then v_missing := v_missing || 'notifications '; end if;

  if v_missing <> '' then
    raise exception 'Quyidagi jadvallar hali ham yo''q: %', v_missing;
  else
    raise notice 'OK — coach_invites va notifications joyida.';
  end if;
end $$;
