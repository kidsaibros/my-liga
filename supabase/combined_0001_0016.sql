-- ============================================================
-- My Liga — 0001..0006 migratsiyalarining yaxlit birlashmasi
-- Supabase SQL Editor'da bir marta, ketma-ket ishga tushirish uchun.
-- Eslatma: 0001 dagi "create table" buyruqlari IF NOT EXISTS'siz —
-- shuning uchun bu skript faqat BO'SH (jadvallar hali yaratilmagan)
-- Supabase loyihasida ishga tushirilishi kerak. Agar 0001-0005 allaqachon
-- qo'llangan bo'lsa, faqat oxirgi bo'lim (0006) yetarli.
-- ============================================================


-- ============================================================
-- 0001_init.sql — boshlang'ich sxema (turnirlar, o'yinlar, statistika,
-- profillar, live chat) + seed ma'lumotlar
-- ============================================================

create extension if not exists pgcrypto;

-- ── teams ──────────────────────────────────────────────
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  init text not null,
  crest_gradient text not null,
  crest_border text not null default 'rgba(255,255,255,0.15)',
  crest_color text not null default '#fff',
  created_at timestamptz not null default now()
);

-- ── tournaments ────────────────────────────────────────
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  dates_label text not null,
  starts_on date not null,
  ends_on date not null,
  team_count int not null default 0,
  status text not null check (status in ('faol', 'yakunlangan', 'kelajakdagi')),
  created_at timestamptz not null default now()
);

-- ── standings (turnir + guruh reytingi) ─────────────────
create table public.standings (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  group_name text not null default 'A',
  pos int not null,
  played int not null default 0,
  won int not null default 0,
  drawn int not null default 0,
  lost int not null default 0,
  goals_for int not null default 0,
  goals_against int not null default 0,
  points int not null default 0,
  unique (tournament_id, team_id)
);
create index standings_tournament_idx on public.standings(tournament_id);

-- ── matches (o'yinlar jadvali) ──────────────────────────
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  group_name text,
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  home_score int not null default 0,
  away_score int not null default 0,
  status text not null check (status in ('scheduled', 'live', 'finished')),
  minute int,
  venue text,
  kickoff_at timestamptz not null,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index matches_tournament_idx on public.matches(tournament_id);
create index matches_status_idx on public.matches(status);

-- ── player_stats (gol/pas statistikasi) ─────────────────
create table public.player_stats (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  team_id uuid not null references public.teams(id),
  goals int not null default 0,
  assists int not null default 0,
  created_at timestamptz not null default now()
);

-- ── profiles (foydalanuvchi profili — auth'siz demo) ────
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  position text,
  matches_played int not null default 0,
  goals int not null default 0,
  assists int not null default 0,
  team_id uuid references public.teams(id),
  created_at timestamptz not null default now()
);

-- ── chat_messages (live chat) ────────────────────────────
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  author_name text not null,
  author_init text not null,
  avatar_gradient text not null,
  text text not null,
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);
create index chat_messages_match_idx on public.chat_messages(match_id);

-- ── Realtime: chat_messages'ga INSERT hodisalarini uzatish ─
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- ── Row Level Security ──────────────────────────────────
alter table public.teams enable row level security;
alter table public.tournaments enable row level security;
alter table public.standings enable row level security;
alter table public.matches enable row level security;
alter table public.player_stats enable row level security;
alter table public.profiles enable row level security;
alter table public.chat_messages enable row level security;

create policy "public read" on public.teams for select using (true);
create policy "public read" on public.tournaments for select using (true);
create policy "public read" on public.standings for select using (true);
create policy "public read" on public.matches for select using (true);
create policy "public read" on public.player_stats for select using (true);
create policy "public read" on public.profiles for select using (true);
create policy "public read" on public.chat_messages for select using (true);
create policy "public insert" on public.chat_messages for insert with check (true);

-- ── Seed: teams ──────────────────────────────────────────
insert into public.teams (slug, name, init, crest_gradient, crest_border, crest_color) values
  ('qibray-fc',     'Qibray FC',     'QF', 'linear-gradient(140deg,#1E7A42,#0B2E18)', 'rgba(47,216,113,0.45)', '#7CF0AC'),
  ('young-tigers',  'Young Tigers',  'YT', 'linear-gradient(140deg,#B4611C,#3A1F08)', 'rgba(240,150,60,0.45)', '#F5B36B'),
  ('green-party',   'Green Party',   'GP', 'linear-gradient(140deg,#5E9E2E,#1F3A0C)', 'rgba(150,220,80,0.4)',  '#BEEB84'),
  ('victory',       'Victory',       'VI', 'linear-gradient(140deg,#2E5E9E,#0C1F3A)', 'rgba(90,150,230,0.4)',  '#84B4EB'),
  ('dostlik',       'Do''stlik',     'DO', 'linear-gradient(140deg,#6E3EA8,#241040)', 'rgba(160,110,220,0.4)', '#C9AEEA'),
  ('olimpic',       'Olimpic',       'OL', 'linear-gradient(140deg,#A83E3E,#401010)', 'rgba(220,90,90,0.4)',   '#E8A0A0');

-- ── Seed: tournaments ────────────────────────────────────
insert into public.tournaments (slug, name, dates_label, starts_on, ends_on, team_count, status) values
  ('dxx-kubogi',            'DXX KUBOGI',                  '20 May – 10 Iyun 2024',      '2024-05-20', '2024-06-10', 16, 'faol'),
  ('hokim-kubogi',          'HOKIM KUBOGI',                '15 May – 5 Iyun 2024',       '2024-05-15', '2024-06-05', 24, 'faol'),
  ('yoshlar-agentligi',     'YOSHLAR AGENTLIGI KUBOGI',    '10 May – 30 May 2024',       '2024-05-10', '2024-05-30', 20, 'faol'),
  ('kelajak-yulduzlari',    'KELAJAK YULDUZLARI KUBOGI',   '5 May – 25 May 2024',        '2024-05-05', '2024-05-25', 18, 'faol'),
  ('navroz-kubogi',         'NAVRO''Z KUBOGI',             '18 Mart – 12 Aprel 2024',    '2024-03-18', '2024-04-12', 16, 'yakunlangan'),
  ('qishki-chempionat',     'QISHKI CHEMPIONAT',           '10 Yanvar – 28 Fevral 2024', '2024-01-10', '2024-02-28', 12, 'yakunlangan'),
  ('mustaqillik-kubogi',    'MUSTAQILLIK KUBOGI',          '20 Avgust – 15 Sentabr 2024','2024-08-20', '2024-09-15', 24, 'kelajakdagi'),
  ('kuzgi-super-liga',      'KUZGI SUPER LIGA',            '1 Oktabr – 20 Dekabr 2024',  '2024-10-01', '2024-12-20', 16, 'kelajakdagi');

-- ── Seed: standings (DXX KUBOGI · Guruh A) ──────────────
insert into public.standings (tournament_id, team_id, group_name, pos, played, won, drawn, lost, goals_for, goals_against, points)
select t.id, tm.id, 'A', v.pos, v.played, v.won, v.drawn, v.lost, v.goals_for, v.goals_against, v.points
from (values
  ('qibray-fc',    1, 6, 5, 0, 1, 18, 7,  15),
  ('young-tigers', 2, 6, 4, 1, 1, 16, 6,  13),
  ('green-party',  3, 6, 3, 1, 2, 12, 9,  10),
  ('victory',      4, 6, 2, 1, 3, 8,  10, 7),
  ('dostlik',      5, 6, 1, 1, 4, 6,  14, 4),
  ('olimpic',      6, 6, 0, 0, 6, 3,  17, 0)
) as v(team_slug, pos, played, won, drawn, lost, goals_for, goals_against, points)
join public.teams tm on tm.slug = v.team_slug
join public.tournaments t on t.slug = 'dxx-kubogi';

-- ── Seed: matches ────────────────────────────────────────
-- Featured/live o'yin (O'yin sahifasi)
insert into public.matches (tournament_id, group_name, home_team_id, away_team_id, home_score, away_score, status, minute, venue, kickoff_at, is_featured)
select t.id, 'A', h.id, a.id, 2, 1, 'live', 72, 'Qibray markaziy stadioni', '2024-05-25 18:00:00+00', true
from public.tournaments t, public.teams h, public.teams a
where t.slug = 'dxx-kubogi' and h.slug = 'qibray-fc' and a.slug = 'young-tigers';

-- Yaqin o'yinlar (Bosh sahifa)
insert into public.matches (tournament_id, group_name, home_team_id, away_team_id, status, venue, kickoff_at, is_featured)
select t.id, 'A', h.id, a.id, 'scheduled', 'Qibray markaziy stadioni', '2024-05-25 20:00:00+00', false
from public.tournaments t, public.teams h, public.teams a
where t.slug = 'dxx-kubogi' and h.slug = 'green-party' and a.slug = 'dostlik';

insert into public.matches (tournament_id, group_name, home_team_id, away_team_id, status, venue, kickoff_at, is_featured)
select t.id, 'A', h.id, a.id, 'scheduled', 'Qibray markaziy stadioni', '2024-05-26 18:00:00+00', false
from public.tournaments t, public.teams h, public.teams a
where t.slug = 'dxx-kubogi' and h.slug = 'victory' and a.slug = 'olimpic';

-- ── Seed: player_stats ───────────────────────────────────
insert into public.player_stats (player_name, team_id, goals, assists)
select v.player_name, tm.id, v.goals, v.assists
from (values
  ('Azibek Rahimov',        'qibray-fc',    12, 0),
  ('Sardor Aliyev',         'young-tigers', 9,  8),
  ('Doston Yo''ldoshev',    'qibray-fc',    7,  0),
  ('Islom Karimov',         'green-party',  6,  0),
  ('Aziz Samadov',          'victory',      5,  0),
  ('Asadbek Tursunov',      'victory',      0,  6),
  ('Javohir Nazarov',       'green-party',  0,  5),
  ('Shahzod Ergashev',      'dostlik',      0,  4),
  ('Akmal Xudoyberdiyev',   'qibray-fc',    0,  4)
) as v(player_name, team_slug, goals, assists)
join public.teams tm on tm.slug = v.team_slug;

-- ── Seed: profiles ────────────────────────────────────────
insert into public.profiles (full_name, position, matches_played, goals, assists, team_id)
select 'Javlonbek Rahimov', 'Hujumchi', 24, 12, 8, tm.id
from public.teams tm where tm.slug = 'qibray-fc';

-- ── Seed: chat_messages (featured o'yin uchun) ──────────
insert into public.chat_messages (match_id, author_name, author_init, avatar_gradient, text, is_bot, created_at)
select m.id, v.author_name, v.author_init, v.avatar_gradient, v.text, v.is_bot, v.created_at::timestamptz
from (values
  ('Javlon',       'J',  'linear-gradient(140deg,#1E7A42,#0B2E18)', 'Zo''r o''yin bo''ldi! 🔥',                                        false, '2024-05-25 17:45:00+00'),
  ('Umidbek',      'U',  'linear-gradient(140deg,#2E5E9E,#0C1F3A)', 'Qibray oldiringa! 💚',                                            false, '2024-05-25 17:46:00+00'),
  ('Sardor',       'S',  'linear-gradient(140deg,#B4611C,#3A1F08)', 'Ajoyib gol! 👏',                                                  false, '2024-05-25 17:47:00+00'),
  ('My Liga Bot',  'ML', 'linear-gradient(140deg,#2FD871,#128A48)', '⚽ Yangi gol! Qibray FC 2:1 Young Tigers — Azibek (72'')',        true,  '2024-05-25 17:48:00+00')
) as v(author_name, author_init, avatar_gradient, text, is_bot, created_at)
cross join public.matches m
where m.is_featured = true;


-- ============================================================
-- 0002_admin_crud.sql — yangiliklar jadvali + to'liq CRUD ruxsatlari
-- (Eslatma: bu bosqichda hali auth yo'q edi — keyinroq 0004'da qattiqlashadi)
-- ============================================================

-- ── news (yangiliklar) ───────────────────────────────────
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  cover_gradient text not null default 'linear-gradient(140deg,#2FD871,#128A48)',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists news_published_idx on public.news(published_at desc);

alter table public.news enable row level security;

drop policy if exists "public read" on public.news;
drop policy if exists "public insert" on public.news;
drop policy if exists "public update" on public.news;
drop policy if exists "public delete" on public.news;
drop policy if exists "news_public_all" on public.news;
create policy "news_public_all" on public.news for all using (true) with check (true);

-- ── teams: admin CRUD ────────────────────────────────────
drop policy if exists "public read" on public.teams;
drop policy if exists "public insert" on public.teams;
drop policy if exists "public update" on public.teams;
drop policy if exists "public delete" on public.teams;
drop policy if exists "teams_public_all" on public.teams;
create policy "teams_public_all" on public.teams for all using (true) with check (true);

-- ── tournaments: admin CRUD ──────────────────────────────
drop policy if exists "public read" on public.tournaments;
drop policy if exists "public insert" on public.tournaments;
drop policy if exists "public insert tournaments" on public.tournaments;
drop policy if exists "public update" on public.tournaments;
drop policy if exists "public delete" on public.tournaments;
drop policy if exists "tournaments_public_all" on public.tournaments;
create policy "tournaments_public_all" on public.tournaments for all using (true) with check (true);


-- ============================================================
-- 0003_auth_roles.sql — auth.users bilan bog'lash + is_admin() helper
-- ============================================================

-- ── profiles: user_id + role ─────────────────────────────
alter table public.profiles
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end $$;

-- ── chat_messages: user_id (xabar muallifini auth foydalanuvchisiga bog'lash) ──
alter table public.chat_messages
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- ── is_admin(): joriy foydalanuvchi admin ekanligini RLS policy'lar ichida
--    rekursiyasiz tekshirish uchun SECURITY DEFINER funksiya ──────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;


-- ============================================================
-- 0004_tighten_rls.sql — "hammaga o'qish, faqat adminga yozish"
-- ============================================================

-- ── teams ────────────────────────────────────────────────
drop policy if exists "public read" on public.teams;
drop policy if exists "public insert" on public.teams;
drop policy if exists "public update" on public.teams;
drop policy if exists "public delete" on public.teams;
drop policy if exists "teams_public_all" on public.teams;
drop policy if exists "read_all" on public.teams;
drop policy if exists "admin_write" on public.teams;

create policy "read_all" on public.teams for select using (true);
create policy "admin_write" on public.teams for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── tournaments ──────────────────────────────────────────
drop policy if exists "public read" on public.tournaments;
drop policy if exists "public insert" on public.tournaments;
drop policy if exists "public insert tournaments" on public.tournaments;
drop policy if exists "public update" on public.tournaments;
drop policy if exists "public delete" on public.tournaments;
drop policy if exists "tournaments_public_all" on public.tournaments;
drop policy if exists "read_all" on public.tournaments;
drop policy if exists "admin_write" on public.tournaments;

create policy "read_all" on public.tournaments for select using (true);
create policy "admin_write" on public.tournaments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── matches ──────────────────────────────────────────────
drop policy if exists "public read" on public.matches;
drop policy if exists "read_all" on public.matches;
drop policy if exists "admin_write" on public.matches;

create policy "read_all" on public.matches for select using (true);
create policy "admin_write" on public.matches for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── standings ────────────────────────────────────────────
drop policy if exists "public read" on public.standings;
drop policy if exists "read_all" on public.standings;
drop policy if exists "admin_write" on public.standings;

create policy "read_all" on public.standings for select using (true);
create policy "admin_write" on public.standings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── player_stats ─────────────────────────────────────────
drop policy if exists "public read" on public.player_stats;
drop policy if exists "read_all" on public.player_stats;
drop policy if exists "admin_write" on public.player_stats;

create policy "read_all" on public.player_stats for select using (true);
create policy "admin_write" on public.player_stats for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── news ─────────────────────────────────────────────────
drop policy if exists "news_public_all" on public.news;
drop policy if exists "read_all" on public.news;
drop policy if exists "admin_write" on public.news;

create policy "read_all" on public.news for select using (true);
create policy "admin_write" on public.news for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── chat_messages: hammaga o'qish, faqat o'z xabarini yozish ──
drop policy if exists "public read" on public.chat_messages;
drop policy if exists "public insert" on public.chat_messages;
drop policy if exists "read_all" on public.chat_messages;
drop policy if exists "insert_own" on public.chat_messages;

create policy "read_all" on public.chat_messages for select using (true);
create policy "insert_own" on public.chat_messages for insert to authenticated
  with check (auth.uid() = user_id);


-- ============================================================
-- 0005_profiles_rls.sql — profiles jadvali uchun RLS
-- ============================================================

drop policy if exists "public read" on public.profiles;
drop policy if exists "read_all" on public.profiles;
drop policy if exists "admin_write" on public.profiles;
drop policy if exists "update_own" on public.profiles;

create policy "read_all" on public.profiles for select using (true);

create policy "admin_write" on public.profiles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "update_own" on public.profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- 0006_roles_coach.sql — rollarni kengaytirish: super_admin + coach
-- ============================================================

update public.profiles set role = 'super_admin' where role = 'admin';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'coach', 'super_admin'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'super_admin'
  );
$$;

-- ── coach: faqat o'zi murabbiylik qiladigan jamoa o'yinchilarini (player_stats)
--    boshqarishi uchun — profiles.team_id orqali bog'lanadi ──────────────────
create or replace function public.is_team_coach(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'coach' and p.team_id = p_team_id
  );
$$;

grant execute on function public.is_team_coach(uuid) to authenticated, anon;

drop policy if exists "coach_write" on public.player_stats;
create policy "coach_write" on public.player_stats for all to authenticated
  using (public.is_team_coach(team_id))
  with check (public.is_team_coach(team_id));

-- ============================================================
-- 0007_sponsors.sql
-- ============================================================

-- Homiylar (sponsors) — Bosh sahifadagi banner-karusel va admin "Homiylar" bo'limi uchun.
-- news jadvalining RLS naqshiga mos: hammaga o'qish, faqat is_admin()ga yozish.

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  link_url text,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index sponsors_sort_idx on public.sponsors(sort_order, created_at);

alter table public.sponsors enable row level security;

create policy "read_all" on public.sponsors for select using (true);
create policy "admin_write" on public.sponsors for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 0008_logo_urls.sql
-- ============================================================

-- Turnir/jamoa gerbi uchun ixtiyoriy rasm URL — nullable, mavjud qatorlarga ta'sir qilmaydi.
-- Bo'sh bo'lsa, UI mavjud init/crest_gradient asosidagi harf-nishonga qaytadi.

alter table public.tournaments add column if not exists logo_url text;
alter table public.teams add column if not exists logo_url text;

-- ============================================================
-- 0009_roles_and_coaches.sql
-- ============================================================

-- Google OAuth + dinamik rol arxitekturasi:
--   - profiles.avatar_url — Google profil rasmi.
--   - profiles.user_id endi UNIQUE — /auth/callback'dagi upsert(onConflict:"user_id") shuning uchun kerak.
--   - teams.coach_email — Super Admin jamoa yaratganda/tahrirlaganda kiritadigan murabbiy Google emaili;
--     shu email egasi Google bilan kirganda avtomatik 'coach' rolini va shu team_id'ni oladi
--     (sinxronizatsiya /auth/callback'da, app-layer'da amalga oshadi — bu yerda faqat ustun).
--   - Xavfsizlik: 0005'dagi "update_own" policy'si foydalanuvchiga o'z profilining
--     HAR QANDAY ustunini (role/team_id ham) yangilashga ruxsat berardi — bu orqali oddiy
--     foydalanuvchi o'zini super_admin qilib olishi mumkin edi. Trigger bilan yopiladi:
--     role/team_id faqat admin (is_admin()) yoki service_role orqali o'zgarishi mumkin.

alter table public.profiles add column if not exists avatar_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_user_id_key'
  ) then
    alter table public.profiles add constraint profiles_user_id_key unique (user_id);
  end if;
end $$;

alter table public.teams add column if not exists coach_email text;
create index if not exists teams_coach_email_idx on public.teams (lower(coach_email));

-- ── role/team_id'ni o'z-o'zidan ko'tarishning oldini olish ──────────────
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.team_id is distinct from old.team_id)
     and auth.role() <> 'service_role'
     and not public.is_admin() then
    new.role := old.role;
    new.team_id := old.team_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_self_escalation on public.profiles;
create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- ============================================================
-- 0010_fix_schema_grants.sql
-- ============================================================

-- "permission denied for schema public" xatosini tuzatish.
-- Sabab: service_role (va postgres) uchun public sxemasi/jadvallariga standart
-- Supabase grant'lari yo'qolib qolgan (odatda restore/import yoki qo'lda REVOKE
-- natijasida yuzaga keladi). RLS bunga aloqasi yo'q — service_role RLS'ni chetlab
-- o'tadi, lekin GRANT darajasidagi ruxsat baribir kerak.
-- Bu skript Supabase'ning o'zi yangi loyiha yaratganda qo'yadigan standart
-- grant'larni qayta tiklaydi — xavfsiz, bir necha marta ishga tushirsa ham xato bermaydi.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all functions in schema public to postgres, service_role;

grant select on all tables in schema public to anon, authenticated;

alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant select on tables to anon, authenticated;

-- ============================================================
-- 0011_settings_favorites_storage.sql
-- ============================================================

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

-- ============================================================
-- 0012_fix_write_grants.sql
-- ============================================================

-- "permission denied for table tournaments" (va boshqa jadvallarda ham) — sabab:
-- 0010_fix_schema_grants.sql faqat SELECT huquqini anon/authenticated'ga berdi,
-- INSERT/UPDATE/DELETE esa faqat postgres/service_role'da qoldi. RLS policy'lar
-- (masalan admin_write) to'g'ri ishlayapti, lekin Postgres avval jadval darajasidagi
-- GRANT'ni tekshiradi — u yo'q bo'lsa RLS'gacha yetib bormay xato beradi.
-- Bu xavfsiz: RLS baribir yoqilgan, shuning uchun authenticated foydalanuvchi
-- faqat policy ruxsat bergan qatorlarni yoza oladi (masalan, faqat is_admin() bo'lsa).

grant insert, update, delete on all tables in schema public to authenticated;

alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;

-- ============================================================
-- 0013_roster_lineups_coach_assign.sql
-- ============================================================

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

-- ============================================================
-- 0014_player_photo.sql
-- ============================================================

-- Roster o'yinchilariga fotosurat (ixtiyoriy URL, mavjud yozuvlarga ta'sir qilmaydi).
alter table public.players add column if not exists photo_url text;

-- ============================================================
-- 0015_team_name_unique_per_tournament.sql
-- ============================================================

-- Jamoa nomi bir TURNIR ichida takrorlanmasin (standings orqali — teams jadvalida
-- league_id/tournament_id ustuni yo'q, chunki bitta jamoa bir nechta turnirda
-- qatnashishi mumkin — standings shu bog'lanishni ifodalaydi).
-- Tekshiruv ikki nuqtada ishlaydi:
--   1) standings'ga yangi qator qo'shilganda (jamoa turnirga biriktirilganda)
--   2) teams.name o'zgartirilganda (agar jamoa allaqachon biror turnirda bo'lsa)
-- Ikkalasi ham errcode = unique_violation (23505) bilan xato beradi — server
-- action shu kodni ushlab, tushunarli xabar qaytaradi.

create or replace function public.assert_team_name_unique_in_tournament()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conflict boolean;
begin
  if TG_TABLE_NAME = 'standings' then
    select exists (
      select 1
      from public.standings s
      join public.teams t on t.id = s.team_id
      where s.tournament_id = new.tournament_id
        and s.team_id <> new.team_id
        and lower(trim(t.name)) = lower(trim((select name from public.teams where id = new.team_id)))
    ) into v_conflict;

    if v_conflict then
      raise exception 'Bu turnirda shunday nomli jamoa allaqachon mavjud'
        using errcode = 'unique_violation';
    end if;

  elsif TG_TABLE_NAME = 'teams' then
    if new.name is distinct from old.name then
      select exists (
        select 1
        from public.standings s1
        join public.standings s2
          on s2.tournament_id = s1.tournament_id and s2.team_id <> s1.team_id
        join public.teams t2 on t2.id = s2.team_id
        where s1.team_id = new.id
          and lower(trim(t2.name)) = lower(trim(new.name))
      ) into v_conflict;

      if v_conflict then
        raise exception 'Bu turnirda shunday nomli jamoa allaqachon mavjud'
          using errcode = 'unique_violation';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_standings_team_name_unique on public.standings;
create trigger trg_standings_team_name_unique
  before insert or update on public.standings
  for each row execute function public.assert_team_name_unique_in_tournament();

drop trigger if exists trg_teams_name_unique_in_tournaments on public.teams;
create trigger trg_teams_name_unique_in_tournaments
  before update on public.teams
  for each row execute function public.assert_team_name_unique_in_tournament();

-- ============================================================
-- 0016_team_approval_workflow.sql
-- ============================================================

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
