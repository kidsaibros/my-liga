-- ─────────────────────────────────────────────────────────────────────────────
--  0026 — Jonli o'yin daqiqasini avtomatlashtirish
--
--  O'yin "live" (jonli) bo'lganda vaqtni belgilaymiz. Bosh sahifa/o'yin sahifasi
--  shu vaqtdan boshlab daqiqani o'zi sanaydi (klient tomonda tiketadi). Admin
--  o'yinni "finished" qilsa — daqiqa to'xtaydi. "scheduled"ga qaytsa — tozalanadi.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.matches add column if not exists live_started_at timestamptz;

create or replace function public.set_live_started_at()
returns trigger
language plpgsql
as $$
begin
  -- Yangi "jonli" holatga o'tdi va vaqt hali belgilanmagan — hozirgi vaqtni yozamiz.
  if new.status = 'live' and (old.status is distinct from 'live') and new.live_started_at is null then
    new.live_started_at := now();
  end if;
  -- "Rejalashtirilgan"ga qaytsa — soatni nolga tiklaymiz.
  if new.status = 'scheduled' then
    new.live_started_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_live_started_at on public.matches;
create trigger trg_set_live_started_at
  before update on public.matches
  for each row
  execute function public.set_live_started_at();

-- Hozir jonli bo'lgan o'yinlar uchun soatni hozirdan boshlaymiz (bir martalik).
update public.matches set live_started_at = now() where status = 'live' and live_started_at is null;
