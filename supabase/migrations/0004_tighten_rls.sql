-- RLS qattiqlashtirish: 0001/0002'dagi vaqtinchalik ochiq policy'larni olib tashlab,
-- o'rniga "hammaga o'qish, faqat adminga yozish" naqshini qo'yamiz. Admin tekshiruvi
-- 0003'da qo'shilgan public.is_admin() (SECURITY DEFINER) orqali, rekursiyasiz amalga oshadi.
-- chat_messages uchun esa yozish auth.uid() = user_id shartiga bog'lanadi (o'z xabarini yozish).
--
-- Eslatma: profiles jadvali bu bosqichda tegilmaydi (0001'dagi "public read" policy'si
-- o'zgarishsiz qoladi) — bu keyingi bosqich uchun qoldirilgan.

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
