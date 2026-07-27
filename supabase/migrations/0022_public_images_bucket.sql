-- Umumiy rasm bucket'i — homiy logotiplari va o'yinchi fotosuratlari uchun.
--
-- NEGA YANGI BUCKET: mavjud `team-logos` bucket'ini qayta ishlatib bo'lmaydi,
-- chunki `uploadTeamLogo` (coach-team.ts) papkadagi BARCHA faylni o'chirib,
-- bitta logotip qoldiradi — o'yinchi suratlari u yerga tushsa, o'chib ketardi.
-- `avatars` esa foydalanuvchining shaxsiy rasmi uchun. Shuning uchun aralashmasin
-- deb alohida `public-images` bucket ochamiz.
--
-- Yozish qoidasi boshqa bucket'lar bilan bir xil: foydalanuvchi faqat O'Z
-- papkasiga (auth.uid()) yoza oladi. Fayl yo'li: `{uid}/{kategoriya}-{vaqt}.{ext}`.

insert into storage.buckets (id, name, public)
values ('public-images', 'public-images', true)
on conflict (id) do nothing;

-- Ochiq o'qish — rasmlar hamma joyda (bosh sahifa, admin, statistika) ko'rinadi
drop policy if exists "public_images_read" on storage.objects;
create policy "public_images_read" on storage.objects for select
  using (bucket_id = 'public-images');

-- Yozish/o'zgartirish/o'chirish — faqat kirgan foydalanuvchi, faqat o'z papkasiga
drop policy if exists "public_images_own_insert" on storage.objects;
create policy "public_images_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "public_images_own_update" on storage.objects;
create policy "public_images_own_update" on storage.objects for update to authenticated
  using (bucket_id = 'public-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'public-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "public_images_own_delete" on storage.objects;
create policy "public_images_own_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'public-images' and (storage.foldername(name))[1] = auth.uid()::text);
