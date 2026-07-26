-- Roster o'yinchilariga fotosurat (ixtiyoriy URL, mavjud yozuvlarga ta'sir qilmaydi).
alter table public.players add column if not exists photo_url text;
