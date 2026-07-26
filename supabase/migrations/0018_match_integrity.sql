-- Admin panelidan uchrashuv kiritish imkoniyati qo'shilishi bilan bog'liq
-- ma'lumot yaxlitligi cheklovlari.
--
-- Eslatma: matches uchun RLS (0004: "admin_write" + is_admin()) va jadval
-- darajasidagi GRANT'lar (0012) allaqachon o'rnatilgan — bu yerda ular
-- takrorlanmaydi. Faqat DB darajasida noto'g'ri ma'lumotning oldi olinadi:
-- forma validatsiyasi (Zod) chetlab o'tilsa ham baza o'zini himoya qiladi.

-- ── 1. Jamoa o'zi bilan o'ynay olmaydi ──────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'matches_teams_differ_check') then
    alter table public.matches
      add constraint matches_teams_differ_check check (home_team_id <> away_team_id);
  end if;
end $$;

-- ── 2. Hisob manfiy bo'lmasligi kerak ───────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'matches_scores_non_negative_check') then
    alter table public.matches
      add constraint matches_scores_non_negative_check
      check (home_score >= 0 and away_score >= 0);
  end if;
end $$;

-- ── 3. Daqiqa faqat jonli o'yinda va 0..130 oralig'ida ──────────────────────
-- (qo'shimcha vaqt va tanaffuslarni hisobga olib yuqori chegara kengroq)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'matches_minute_range_check') then
    alter table public.matches
      add constraint matches_minute_range_check
      check (minute is null or (minute >= 0 and minute <= 130));
  end if;
end $$;

-- ── 4. Bitta turnirda ayni bir juftlik ayni bir vaqtda takrorlanmasin ───────
-- (aylanma turnirda bir juftlik bir necha marta o'ynashi mumkin, shuning uchun
--  kalitga kickoff_at ham kiritilgan — bu faqat aniq dublikatni to'sadi)
create unique index if not exists matches_no_exact_duplicate_idx
  on public.matches (tournament_id, home_team_id, away_team_id, kickoff_at);

-- ── 5. Bir vaqtda faqat bitta "featured" o'yin bo'lsin ──────────────────────
-- Bosh sahifadagi/"O'yin" sahifasidagi asosiy uchrashuv `is_featured = true`
-- bo'yicha `.single()` bilan o'qiladi — ikkitasi bo'lsa sahifa xato beradi.
create unique index if not exists matches_single_featured_idx
  on public.matches ((is_featured)) where is_featured;
