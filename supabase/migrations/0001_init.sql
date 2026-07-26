-- My Liga — boshlang'ich sxema (turnirlar, o'yinlar, statistika, profillar, live chat)
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
