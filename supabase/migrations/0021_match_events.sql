-- Gol va uzatma hodisalari: kim, qaysi o'yinda, nechanchi daqiqada.
--
-- MUAMMO: `player_stats` turnirga bog'lanmagan — u faqat (o'yinchi, jamoa)
-- juftligini biladi. Bir jamoa ikki turnirda qatnashsa, gollari qo'shilib
-- ketadi va «To'purarlar» tabi noto'g'ri ko'rsatadi.
--
-- YECHIM: hodisani O'YINGA bog'laymiz. O'yin esa turnirga bog'langan, ya'ni
-- turnir bo'yicha to'purarlarni aniq hisoblash mumkin bo'ladi. Bundan tashqari
-- o'yin sahifasida "kim, nechanchi daqiqada gol urdi" ko'rsatiladi.
--
-- NEGA `players` ga FOREIGN KEY EMAS: `players` (roster) faqat murabbiy
-- to'ldirgan jamoalarda bor. Admin roster kiritilmagan jamoaning gol muallifini
-- ham yozib qo'ya olishi kerak, shuning uchun ism matn sifatida saqlanadi va
-- `player_id` ixtiyoriy havola bo'lib qoladi (bo'lsa — bog'lanadi).

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  -- Roster'dagi o'yinchiga ixtiyoriy havola (o'chirilsa hodisa saqlanib qoladi)
  player_id uuid references public.players(id) on delete set null,
  player_name text not null,
  type text not null check (type in ('goal', 'assist', 'own_goal', 'yellow', 'red')),
  minute int check (minute is null or (minute >= 0 and minute <= 130)),
  created_at timestamptz not null default now()
);

comment on table public.match_events is
  'O''yin ichidagi hodisalar (gol, uzatma, o''z darvozasiga gol, kartochkalar). To''purarlar shu jadvaldan turnir bo''yicha hisoblanadi.';

-- ── Indekslar ───────────────────────────────────────────────────────────────
create index if not exists match_events_match_idx on public.match_events(match_id);
create index if not exists match_events_team_idx on public.match_events(team_id);
-- «To'purarlar» so'rovi: tur bo'yicha filtr + ism bo'yicha guruhlash
create index if not exists match_events_type_idx on public.match_events(type);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.match_events enable row level security;

drop policy if exists "read_all" on public.match_events;
create policy "read_all" on public.match_events for select using (true);

drop policy if exists "admin_write" on public.match_events;
create policy "admin_write" on public.match_events for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.match_events to anon, authenticated;
grant insert, update, delete on public.match_events to authenticated;

-- ── Turnir bo'yicha to'purarlar ─────────────────────────────────────────────
-- O'z darvozasiga urilgan gol hisobga olinmaydi (o'yinchi foydasiga emas).
-- Faqat YAKUNLANGAN va JONLI o'yinlar sanaladi — rejalashtirilganda hodisa
-- bo'lmasligi kerak, lekin ehtiyot uchun filtr qo'yamiz.
create or replace function public.tournament_scorers(p_tournament_id uuid)
returns table (
  player_name text,
  team_id uuid,
  goals bigint,
  assists bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.player_name,
    e.team_id,
    count(*) filter (where e.type = 'goal')   as goals,
    count(*) filter (where e.type = 'assist') as assists
  from public.match_events e
  join public.matches m on m.id = e.match_id
  where m.tournament_id = p_tournament_id
    and m.status in ('finished', 'live')
    and e.type in ('goal', 'assist')
  group by e.player_name, e.team_id
  having count(*) filter (where e.type = 'goal') > 0
      or count(*) filter (where e.type = 'assist') > 0
  order by goals desc, assists desc, e.player_name;
$$;

grant execute on function public.tournament_scorers(uuid) to anon, authenticated;

-- ── Umumiy (barcha turnirlar) to'purarlar — /statistika sahifasi uchun ──────
create or replace function public.overall_scorers()
returns table (
  player_name text,
  team_id uuid,
  goals bigint,
  assists bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.player_name,
    e.team_id,
    count(*) filter (where e.type = 'goal')   as goals,
    count(*) filter (where e.type = 'assist') as assists
  from public.match_events e
  join public.matches m on m.id = e.match_id
  where m.status in ('finished', 'live')
    and e.type in ('goal', 'assist')
  group by e.player_name, e.team_id
  order by goals desc, assists desc, e.player_name;
$$;

grant execute on function public.overall_scorers() to anon, authenticated;

-- ── Eski `player_stats` ma'lumotini ko'chirish ──────────────────────────────
-- `player_stats` da turnir ham, o'yin ham yo'q — shuning uchun avtomatik
-- ko'chirib bo'lmaydi (qaysi golni qaysi o'yinga bog'lashni bilmaymiz).
-- Jadval o'chirilmaydi: eski ma'lumot saqlanib qoladi, lekin ilova endi
-- `match_events` dan foydalanadi. Tayyor bo'lsangiz, keyinroq
-- `drop table public.player_stats;` qilishingiz mumkin.
