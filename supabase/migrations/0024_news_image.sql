-- 0024 — Yangilikka rasm qo'shish.
-- cover_gradient (fon) qoladi — rasm bo'lmasa zaxira sifatida ishlatiladi.
alter table public.news add column if not exists image_url text;
