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
