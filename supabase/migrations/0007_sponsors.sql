-- Homiylar (sponsors) — Bosh sahifadagi banner-karusel va admin "Homiylar" bo'limi uchun.
-- news jadvalining RLS naqshiga mos: hammaga o'qish, faqat is_admin()ga yozish.

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  link_url text,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index sponsors_sort_idx on public.sponsors(sort_order, created_at);

alter table public.sponsors enable row level security;

create policy "read_all" on public.sponsors for select using (true);
create policy "admin_write" on public.sponsors for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
