-- Auth asosi: profiles/chat_messages'ni auth.users bilan bog'lash + admin rolini
-- xavfsiz (RLS rekursiyasiz) tekshirish uchun helper funksiya.
-- Eslatma: bu migratsiya faqat sxema darajasidagi tayyorgarlik. Mavjud RLS policy'lari
-- (0001/0002 dagi "public read"/"*_public_all") va UI hali bu ustunlarga bog'lanmagan —
-- bu keyingi bosqichda amalga oshiriladi.

-- ── profiles: user_id + role ─────────────────────────────
alter table public.profiles
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end $$;

-- ── chat_messages: user_id (xabar muallifini auth foydalanuvchisiga bog'lash) ──
alter table public.chat_messages
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- ── is_admin(): joriy foydalanuvchi admin ekanligini RLS policy'lar ichida
--    rekursiyasiz tekshirish uchun SECURITY DEFINER funksiya ──────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;
