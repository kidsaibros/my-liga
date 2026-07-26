-- Turnir tafsilotlari sahifasining qolgan 4 ta tabini yopish uchun sxema qo'shimchalari:
--   1. tournaments.regulations — «Reglament» tabidagi matn (Super Admin tahrirlaydi).
--   2. Hot-query indekslari — «O'yinlar»/«Natijalar» tablari matches jadvalini
--      (tournament_id, status, kickoff_at) bo'yicha so'raydi, «To'purarlar» esa
--      player_stats'ni team_id bo'yicha filtrlaydi. 0001'dagi matches_tournament_idx
--      va matches_status_idx alohida-alohida bo'lgani uchun composite indeks qo'shamiz.
--   3. player_stats'ga anon/authenticated uchun aniq GRANT (0010/0012 default
--      privileges'ga qo'shimcha ishonch qatlami).

-- ── 1. Reglament matni ──────────────────────────────────────────────────────
alter table public.tournaments add column if not exists regulations text;

comment on column public.tournaments.regulations is
  'Turnir reglamenti — erkin matn, har qator alohida band sifatida ko''rsatiladi.';

-- ── 2. Indekslar ────────────────────────────────────────────────────────────
-- «O'yinlar» tabi: status in ('scheduled','live') + kickoff_at asc
-- «Natijalar» tabi: status = 'finished' + kickoff_at desc
create index if not exists matches_tournament_status_kickoff_idx
  on public.matches (tournament_id, status, kickoff_at);

-- «To'purarlar» tabi: turnirdagi jamoalar bo'yicha player_stats filtri
create index if not exists player_stats_team_idx
  on public.player_stats (team_id);

-- Statistika sahifasi va «To'purarlar» tabi gol/pas bo'yicha saralaydi
create index if not exists player_stats_goals_idx
  on public.player_stats (goals desc);
create index if not exists player_stats_assists_idx
  on public.player_stats (assists desc);

-- Turnirlar ro'yxati starts_on bo'yicha saralanadi
create index if not exists tournaments_starts_on_idx
  on public.tournaments (starts_on desc);

-- Bosh sahifa: yaqin o'yinlar (status='scheduled' + kickoff_at asc)
create index if not exists matches_status_kickoff_idx
  on public.matches (status, kickoff_at);

-- ── 3. Grantlar ─────────────────────────────────────────────────────────────
grant select on public.player_stats to anon, authenticated;
grant insert, update, delete on public.player_stats to authenticated;

-- ── 4. Namuna reglament (faqat bo'sh bo'lganlarga, bir martalik) ────────────
update public.tournaments
set regulations = concat_ws(
  E'\n',
  'O''yin davomiyligi: 2 x 30 daqiqa, tanaffus 10 daqiqa.',
  'Jamoa tarkibi: maydonda 8 o''yinchi (shu jumladan darvozabon), zaxirada 5 o''yinchi.',
  'Almashtirishlar soni cheklanmagan, almashtirilgan o''yinchi qayta kirishi mumkin.',
  'Sariq kartochka: keyingi o''yinda 1 uchrashuvga chetlatish 3 ta sariqdan so''ng.',
  'Qizil kartochka: joriy o''yin tugatiladi va kamida 1 uchrashuvga chetlatiladi.',
  'Guruh bosqichida g''alaba 3 ochko, durang 1 ochko, mag''lubiyat 0 ochko.',
  'Ochkolar teng bo''lganda: shaxsiy uchrashuv natijasi → gol farqi → urilgan gollar.',
  'Har bir jamoa o''yin boshlanishidan 20 daqiqa oldin ro''yxatdan o''tishi shart.',
  'Kechikish 15 daqiqadan oshsa, jamoaga 0:3 texnik mag''lubiyat beriladi.',
  'Ro''yxatda bo''lmagan o''yinchini maydonga chiqarish — texnik mag''lubiyat.'
)
where regulations is null;
