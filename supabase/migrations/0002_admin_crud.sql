-- Admin panel: yangiliklar jadvali + turnirlar/jamoalar/yangiliklarga to'liq CRUD ruxsatlari
-- Eslatma: loyihada hali auth yo'q (profiles ham auth'siz demo), shuning uchun
-- boshqa jadvallardagi "public read" naqshiga mos holda public insert/update/delete beriladi.
-- Keyinchalik admin auth qo'shilganda bu policy'larni auth.uid()'ga bog'lash tavsiya etiladi.
--
-- Eslatma 2: har bir jadval uchun bitta "for all" policy ishlatiladi (alohida
-- select/insert/update/delete policy'lari o'rniga) — amalda ko'p marta
-- yaratish/o'chirish tsiklidan keyin granular policy'lar noaniq sabab bilan
-- ishlamay qolgan holat kuzatildi, "for all" esa ishonchli ishladi.
-- Bu skript qayta-qayta ishga tushirilsa ham xato bermaydi (idempotent).

-- ── news (yangiliklar) ───────────────────────────────────
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  cover_gradient text not null default 'linear-gradient(140deg,#2FD871,#128A48)',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists news_published_idx on public.news(published_at desc);

alter table public.news enable row level security;

drop policy if exists "public read" on public.news;
drop policy if exists "public insert" on public.news;
drop policy if exists "public update" on public.news;
drop policy if exists "public delete" on public.news;
drop policy if exists "news_public_all" on public.news;
create policy "news_public_all" on public.news for all using (true) with check (true);

-- ── teams: admin CRUD ────────────────────────────────────
drop policy if exists "public read" on public.teams;
drop policy if exists "public insert" on public.teams;
drop policy if exists "public update" on public.teams;
drop policy if exists "public delete" on public.teams;
drop policy if exists "teams_public_all" on public.teams;
create policy "teams_public_all" on public.teams for all using (true) with check (true);

-- ── tournaments: admin CRUD ──────────────────────────────
drop policy if exists "public read" on public.tournaments;
drop policy if exists "public insert" on public.tournaments;
drop policy if exists "public insert tournaments" on public.tournaments;
drop policy if exists "public update" on public.tournaments;
drop policy if exists "public delete" on public.tournaments;
drop policy if exists "tournaments_public_all" on public.tournaments;
create policy "tournaments_public_all" on public.tournaments for all using (true) with check (true);
