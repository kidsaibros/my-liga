-- Rollarni kengaytirish: 'admin' -> 'super_admin', va yangi 'coach' roli.
-- Sabab: BottomNav'da uch xil rol uchun turli darajadagi boshqaruv kerak —
-- super_admin (to'liq CRUD), coach (faqat o'z jamoasi/o'yinchilari), user (huquqsiz).
-- is_admin() funksiyasi barcha admin_write policy'larida ishlatilgani uchun,
-- uning tanasini 'super_admin'ga o'zgartirish yetarli — mavjud policy'larni qayta yozish shart emas.

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
