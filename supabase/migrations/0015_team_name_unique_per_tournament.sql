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
