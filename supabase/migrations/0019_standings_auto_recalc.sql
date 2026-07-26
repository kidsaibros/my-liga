-- Turnir jadvalini (standings) yakunlangan o'yinlardan avtomatik hisoblash.
--
-- Shu paytgacha `standings` qatorlari faqat jamoa turnirga biriktirilganda nol
-- qiymat bilan yaratilardi va ularni HECH NARSA yangilamasdi — ya'ni hisob
-- kiritilsa ham «Jadval» tabidagi ochkolar o'zgarmasdi. Bu migratsiya shu
-- bo'shliqni yopadi.
--
-- ⚠️ MUHIM — MAVJUD MA'LUMOT HAQIDA:
-- Bu migratsiya mavjud qatorlarni DARHOL o'zgartirmaydi (ataylab: 0001'dagi
-- seed jadvali "6 o'yin o'ynaldi" deb tursa-da, bazada yakunlangan o'yin yo'q,
-- shuning uchun avtomatik qayta hisoblash uni nolga tushirib yuborardi).
-- Qayta hisoblash har bir turnir uchun O'SHA turnirdagi birinchi o'yin
-- qo'shilgan/o'zgartirilgan/o'chirilgan paytda ishga tushadi. Ya'ni haqiqiy
-- natijalarni kirita boshlaganingizda jadval real ma'lumotga o'tadi.
--
-- Agar hoziroq hammasini qayta hisoblamoqchi bo'lsangiz, faylning oxiridagi
-- izohli blokni ishga tushiring.

-- ── Ochko tizimi ────────────────────────────────────────────────────────────
-- G'alaba 3, durang 1, mag'lubiyat 0. O'rin: ochko → gol farqi → urilgan gol.
-- Saralash guruh ichida amalga oshadi (standings.group_name).

create or replace function public.recalc_standings(p_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1) O'yinda qatnashgan, lekin jadvalda hali yo'q jamoalarni qo'shamiz.
  --    (admin uchrashuvni jamoani turnirga biriktirmasdan yaratgan bo'lsa)
  insert into public.standings (tournament_id, team_id, group_name, pos)
  select p_tournament_id, t.team_id, coalesce(t.group_name, 'A'), 0
  from (
    select home_team_id as team_id, group_name from public.matches
      where tournament_id = p_tournament_id
    union
    select away_team_id, group_name from public.matches
      where tournament_id = p_tournament_id
  ) t
  where not exists (
    select 1 from public.standings s
    where s.tournament_id = p_tournament_id and s.team_id = t.team_id
  )
  on conflict (tournament_id, team_id) do nothing;

  -- 2) Yakunlangan o'yinlardan har bir jamoaning ko'rsatkichlarini hisoblaymiz.
  --    O'yini yo'q jamoalar ham nolga tushirilishi kerak — shuning uchun
  --    standings'dan LEFT JOIN qilamiz.
  with per_team as (
    select team_id,
           count(*)                                  as played,
           count(*) filter (where gf > ga)           as won,
           count(*) filter (where gf = ga)           as drawn,
           count(*) filter (where gf < ga)           as lost,
           sum(gf)                                   as goals_for,
           sum(ga)                                   as goals_against
    from (
      select home_team_id as team_id, home_score as gf, away_score as ga
        from public.matches
       where tournament_id = p_tournament_id and status = 'finished'
      union all
      select away_team_id, away_score, home_score
        from public.matches
       where tournament_id = p_tournament_id and status = 'finished'
    ) m
    group by team_id
  ),
  computed as (
    select s.id,
           coalesce(p.played, 0)                             as played,
           coalesce(p.won, 0)                                as won,
           coalesce(p.drawn, 0)                              as drawn,
           coalesce(p.lost, 0)                               as lost,
           coalesce(p.goals_for, 0)                          as goals_for,
           coalesce(p.goals_against, 0)                      as goals_against,
           coalesce(p.won, 0) * 3 + coalesce(p.drawn, 0)     as points
    from public.standings s
    left join per_team p on p.team_id = s.team_id
    where s.tournament_id = p_tournament_id
  )
  update public.standings s
     set played        = c.played,
         won           = c.won,
         drawn         = c.drawn,
         lost          = c.lost,
         goals_for     = c.goals_for,
         goals_against = c.goals_against,
         points        = c.points
    from computed c
   where c.id = s.id;

  -- 3) O'rinlarni guruh ichida qayta raqamlaymiz.
  with ranked as (
    select id,
           row_number() over (
             partition by group_name
             order by points desc,
                      (goals_for - goals_against) desc,
                      goals_for desc,
                      id
           ) as rn
    from public.standings
    where tournament_id = p_tournament_id
  )
  update public.standings s
     set pos = r.rn
    from ranked r
   where r.id = s.id;
end;
$$;

-- Server Action'lardan chaqirish uchun (jamoa turnirga biriktirilganda)
grant execute on function public.recalc_standings(uuid) to authenticated;

-- ── Trigger: matches o'zgarganda jadvalni yangilash ─────────────────────────
create or replace function public.matches_recalc_standings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_standings(old.tournament_id);
    return old;
  end if;

  perform public.recalc_standings(new.tournament_id);

  -- Uchrashuv boshqa turnirga ko'chirilgan bo'lsa, eskisini ham yangilaymiz.
  if tg_op = 'UPDATE' and new.tournament_id is distinct from old.tournament_id then
    perform public.recalc_standings(old.tournament_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_matches_recalc_standings on public.matches;
create trigger trg_matches_recalc_standings
  after insert or update or delete on public.matches
  for each row execute function public.matches_recalc_standings();

-- ── Ixtiyoriy: hoziroq barcha turnirlarni qayta hisoblash ───────────────────
-- Diqqat: bu 0001'dagi namunaviy jadvalni (6 o'yin, 15 ochko va h.k.) nolga
-- tushiradi, chunki bazada yakunlangan o'yin yo'q. Buni qaytarib bo'lmaydi.
-- Tayyor bo'lsangiz, quyidagi ikki qatordan izohni olib tashlab ishga tushiring:
--
-- select public.recalc_standings(id) from public.tournaments;
