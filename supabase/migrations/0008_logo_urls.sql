-- Turnir/jamoa gerbi uchun ixtiyoriy rasm URL — nullable, mavjud qatorlarga ta'sir qilmaydi.
-- Bo'sh bo'lsa, UI mavjud init/crest_gradient asosidagi harf-nishonga qaytadi.

alter table public.tournaments add column if not exists logo_url text;
alter table public.teams add column if not exists logo_url text;
