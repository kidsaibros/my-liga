-- ─────────────────────────────────────────────────────────────────────────────
--  0025 — Ligalar arxitekturasi
--
--  Model: LIGA = turnirning bir turi (format = 'liga'). Kubok = 'kubok'.
--  Super admin liga yaratadi, unga jamoalarni a'zo qiladi (tournament_teams),
--  keyin o'yin (matches) belgilaydi. Jadval o'yin natijalaridan avtomat.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Turnir turi: liga yoki kubok.
alter table public.tournaments
  add column if not exists format text not null default 'liga'
  check (format in ('liga', 'kubok'));

-- 2) Liga a'zolari — qaysi jamoa qaysi ligada (ko'p-ko'pga bog'lanish).
create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tournament_id, team_id)
);

create index if not exists tournament_teams_tournament_idx on public.tournament_teams(tournament_id);
create index if not exists tournament_teams_team_idx on public.tournament_teams(team_id);

alter table public.tournament_teams enable row level security;

-- Hamma o'qiy oladi (liga a'zolarini ko'rsatish uchun), faqat admin yozadi.
drop policy if exists "read_all" on public.tournament_teams;
create policy "read_all" on public.tournament_teams for select using (true);

drop policy if exists "admin_write" on public.tournament_teams;
create policy "admin_write" on public.tournament_teams for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.tournament_teams to anon, authenticated;
grant insert, delete on public.tournament_teams to authenticated;
