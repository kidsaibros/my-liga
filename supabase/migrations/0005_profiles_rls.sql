-- profiles jadvali uchun RLS: 0004'da qoldirilgan bosqich.
-- O'qish hammaga ochiq (o'yinchilar profili public ma'lumot). Yozish esa:
--   - admin uchun to'liq (is_admin(), boshqa jadvallardagi "admin_write" naqshi bilan bir xil)
--   - oddiy foydalanuvchi uchun faqat o'zining profilini (auth.uid() = user_id) yangilashi mumkin.
-- Permissive policy'lar OR bilan qo'shiladi, shuning uchun UPDATE'da ikkalasidan
-- biri (admin YOKI profil egasi) to'g'ri kelsa yetarli.

drop policy if exists "public read" on public.profiles;
drop policy if exists "read_all" on public.profiles;
drop policy if exists "admin_write" on public.profiles;
drop policy if exists "update_own" on public.profiles;

create policy "read_all" on public.profiles for select using (true);

create policy "admin_write" on public.profiles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "update_own" on public.profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
