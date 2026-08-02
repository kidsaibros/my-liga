-- ─────────────────────────────────────────────────────────────────────────────
--  0027 — O'yin hisobini real vaqtda uzatish
--
--  `matches` (va `match_events`) jadvalini Supabase Realtime publikatsiyasiga
--  qo'shamiz. Shunda bosh sahifa va o'yin sahifasi hisob o'zgarishiga obuna
--  bo'lib, admin gol qo'shganda tomoshabinlarda hisob refresh'siz yangilanadi
--  (chat kabi).
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'match_events'
  ) then
    alter publication supabase_realtime add table public.match_events;
  end if;
end $$;
