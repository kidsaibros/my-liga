-- Murabbiy o'z jamoasini yaratishi + Super Admin tasdiqlash oqimi.
-- Eslatma (moslashtirish): loyihada "role_invites"/"team_members"/"tournament_teams"
-- jadvallari yo'q — o'rniga players (roster) va standings (turnir-jamoa bog'lanishi)
-- allaqachon shu vazifani bajaradi. created_by/coach_id auth.users(id)'ga bog'lanadi
-- (profiles(id) emas) — chunki RLS auth.uid() bilan to'g'ridan-to'g'ri solishtiradi,
-- profiles.id esa boshqa qiymat (buni profiles.user_id bilan adashtirmaslik kerak).
-- teams.logo_url allaqachon 0008 migratsiyasida qo'shilgan — qayta qo'shilmaydi.

-- ── teams: status + created_by ──────────────────────────────────────────────
alter table public.teams add column if not exists status text not null default 'pending';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'teams_status_check') then
    alter table public.teams add constraint teams_status_check check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;
alter table public.teams add column if not exists created_by uuid references auth.users(id) on delete set null;

-- MUHIM: yangi ustun DEFAULT 'pending' bilan qo'shilgani uchun barcha ESKI qatorlar
-- ham hozircha 'pending' bo'lib turibdi — ularni ochiq (public) ko'rinishda saqlab
-- qolish uchun 'approved'ga o'tkazamiz. Bu bir martalik backfill.
update public.teams set status = 'approved' where status = 'pending';

-- ── is_coach(): joriy foydalanuvchi murabbiy ekanligini tekshirish ──────────
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'coach'
  );
$$;
grant execute on function public.is_coach() to authenticated, anon;

-- ── teams RLS: qayta ko'rib chiqiladi (public faqat approved'ni ko'radi) ────
drop policy if exists "read_all" on public.teams;
drop policy if exists "admin_write" on public.teams;
drop policy if exists "select_approved_or_own" on public.teams;
drop policy if exists "coach_insert_own" on public.teams;
drop policy if exists "coach_update_own" on public.teams;

create policy "select_approved_or_own" on public.teams for select
  using (
    status = 'approved'
    or created_by = auth.uid()
    or coach_id = auth.uid()
    or public.is_admin()
  );

create policy "admin_write" on public.teams for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "coach_insert_own" on public.teams for insert to authenticated
  with check (created_by = auth.uid() and public.is_coach());

create policy "coach_update_own" on public.teams for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ── status ustunini murabbiy o'zi o'zgartira olmasligi (faqat admin/service_role) ──
create or replace function public.prevent_team_status_self_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and auth.role() <> 'service_role'
     and not public.is_admin() then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_team_status_self_approval on public.teams;
create trigger trg_prevent_team_status_self_approval
  before update on public.teams
  for each row execute function public.prevent_team_status_self_approval();

-- ── coach_invites: hali jamoasi yo'q bo'lgan bo'lg'usi murabbiyni email orqali
--    'coach' roliga taklif qilish (team_id keyinroq, coach o'zi jamoa yaratganda to'ladi) ──
create table public.coach_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.coach_invites enable row level security;
create policy "admin_all" on public.coach_invites for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.coach_invites to authenticated;

-- ── notifications: Super Admin'ga yangi jamoa haqida xabar ─────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_role text check (recipient_role in ('super_admin', 'admin')),
  recipient_id uuid references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_recipient_role_idx on public.notifications(recipient_role, read);

alter table public.notifications enable row level security;

create policy "select_own" on public.notifications for select to authenticated
  using (recipient_id = auth.uid() or (recipient_role = 'super_admin' and public.is_admin()));
create policy "update_own" on public.notifications for update to authenticated
  using (recipient_id = auth.uid() or (recipient_role = 'super_admin' and public.is_admin()))
  with check (recipient_id = auth.uid() or (recipient_role = 'super_admin' and public.is_admin()));

grant select, update on public.notifications to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ── trigger: yangi 'pending' jamoa yaratilganda Super Admin'ga xabar yozish ─
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

-- ── team-logos storage bucket (public read, faqat o'z papkasiga yozish) ────
insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do nothing;

drop policy if exists "team_logos_public_read" on storage.objects;
create policy "team_logos_public_read" on storage.objects for select
  using (bucket_id = 'team-logos');

drop policy if exists "team_logos_own_insert" on storage.objects;
create policy "team_logos_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'team-logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "team_logos_own_update" on storage.objects;
create policy "team_logos_own_update" on storage.objects for update to authenticated
  using (bucket_id = 'team-logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'team-logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "team_logos_own_delete" on storage.objects;
create policy "team_logos_own_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'team-logos' and (storage.foldername(name))[1] = auth.uid()::text);
