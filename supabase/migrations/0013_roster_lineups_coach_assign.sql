-- Super Admin -> Murabbiy to'g'ridan-to'g'ri tayinlash, murabbiy Roster/Taktika boshqaruvi.
-- Arxitektura: profiles.role/team_id RLS uchun YAGONA haqiqat manbai bo'lib qoladi
-- (is_admin()/is_team_coach() shularga tayanadi). teams.coach_id esa faqat qulay
-- teskari-havola (admin UI'da "kim murabbiy" ko'rsatish uchun) — assignCoach/revokeCoach
-- ikkalasini bir vaqtda yangilaydi.

-- ── profiles.email (admin UI'da ro'yxat/qidiruv uchun, auth.users'dan sinxron) ──
alter table public.profiles add column if not exists email text;

-- ── teams.coach_id (qulay teskari-havola; RLS profiles.team_id'ga tayanadi) ──
alter table public.teams add column if not exists coach_id uuid references auth.users(id) on delete set null;

-- ── players (roster — murabbiy boshqaradigan tarkib, player_stats'dan farqli) ──
create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  number int not null check (number between 0 and 99),
  name text not null,
  position text not null check (position in ('GK', 'DEF', 'MID', 'FWD')),
  is_starter boolean not null default false,
  created_at timestamptz not null default now(),
  unique (team_id, number)
);
create index players_team_idx on public.players(team_id);

alter table public.players enable row level security;

create policy "read_all" on public.players for select using (true);
create policy "admin_write" on public.players for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "coach_write" on public.players for all to authenticated
  using (public.is_team_coach(team_id))
  with check (public.is_team_coach(team_id));

-- ── lineups (jamoa uchun bitta joriy taktik sxema — ro'yxat-asosli, drag-and-drop'siz) ──
create table public.lineups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.teams(id) on delete cascade,
  formation text not null default '4-3-3',
  captain_player_id uuid references public.players(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.lineups enable row level security;

create policy "read_all" on public.lineups for select using (true);
create policy "admin_write" on public.lineups for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "coach_write" on public.lineups for all to authenticated
  using (public.is_team_coach(team_id))
  with check (public.is_team_coach(team_id));

-- ── jadval darajasidagi GRANT: 0010/0012'dagi "alter default privileges" yangi
--    jadvallarga ham tarqalishi kerak, lekin ishonch uchun aniq (explicit) beramiz ──
grant select on public.players, public.lineups to anon, authenticated;
grant insert, update, delete on public.players, public.lineups to authenticated;
