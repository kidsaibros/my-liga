-- ─────────────────────────────────────────────────────────────────────────────
--  0023 — Web Push obunalari
--
--  Har bir foydalanuvchi qurilmasi (brauzer) bitta "push subscription" yozuvi.
--  Foydalanuvchi Sozlamalar'da push'ni yoqqanda bu yerga yoziladi, o'chirganda
--  o'chiriladi. Server (lib/push.ts) shu yozuvlarga web-push orqali xabar yuboradi.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- Har kim faqat o'z obunalarini ko'radi/yaratadi/yangilaydi/o'chiradi.
drop policy if exists "own_select" on public.push_subscriptions;
create policy "own_select" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "own_insert" on public.push_subscriptions;
create policy "own_insert" on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "own_update" on public.push_subscriptions;
create policy "own_update" on public.push_subscriptions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own_delete" on public.push_subscriptions;
create policy "own_delete" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- ── O'yin eslatmasi ──────────────────────────────────────────────────────────
-- Cron har necha daqiqada boshlanishiga yaqin o'yinlarni topib eslatma yuboradi.
-- Bir o'yin uchun ikki marta yubormaslik uchun belgilaymiz.
alter table public.matches add column if not exists reminder_sent boolean not null default false;
