/**
 * Migratsiyalarni TOZA bazada boshidan oxirigacha sinab ko'radi.
 *
 * Nega kerak: migratsiyalar Supabase Dashboard'ga qo'lda joylashtirilgani uchun
 * bittasi o'rtada xato bilan to'xtasa, buni faqat ilova buzilganda sezamiz
 * (`coach_invites` shunday yo'qolib qolgan edi). Bu skript xuddi shu zanjirni
 * mahalliy PGlite (WASM PostgreSQL) da ishga tushirib, xatoni oldindan topadi.
 *
 * Ishga tushirish:
 *   npm run db:test
 *
 * Eslatma: PGlite'da Supabase'ning `auth`/`storage` sxemalari yo'q, shuning
 * uchun quyida ularning minimal "qo'g'irchoq" (stub) versiyasi yaratiladi.
 * Maqsad — SQL sintaksisi va obyektlar bog'liqligini tekshirish, Supabase
 * xatti-harakatini to'liq takrorlash emas.
 */

import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "migrations");

/** Supabase muhitining minimal taqlidi. */
const SUPABASE_STUB = `
create extension if not exists pgcrypto;

-- Supabase rollari
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

-- auth sxemasi
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select 'authenticated'::text $$;

-- storage sxemasi
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text not null, public boolean not null default false
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text not null,
  owner uuid
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[]
  language sql immutable as $$ select string_to_array(name, '/') $$;

-- Realtime publikatsiyasi
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;
`;

const db = await PGlite.create({ extensions: { pgcrypto } });

console.log("Supabase muhiti tayyorlanmoqda...");
await db.exec(SUPABASE_STUB);

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let failed = 0;

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  try {
    await db.exec(sql);
    console.log(`  ✅ ${file}`);
  } catch (err) {
    failed++;
    console.log(`  ❌ ${file}`);
    console.log(`     ${String(err.message).split("\n")[0]}`);
    if (err.hint) console.log(`     maslahat: ${err.hint}`);
    // To'xtatmaymiz: keyingilarida yana nima buzilishini ham ko'ramiz.
  }
}

// ── Yakuniy sxema tekshiruvi ────────────────────────────────────────────────
const verifySql = readFileSync(join(here, "verify_schema.sql"), "utf8");
console.log("\nSxema tekshiruvi (verify_schema.sql):");
try {
  const res = await db.query(verifySql);
  const missing = res.rows.filter((r) => String(r.holat).includes("YO"));
  if (missing.length === 0) {
    console.log(`  ✅ kutilgan ${res.rows.length} ta obyektning hammasi joyida`);
  } else {
    failed++;
    console.log(`  ❌ ${missing.length} ta obyekt yo'q:`);
    for (const m of missing) console.log(`     ${m.migration} ${m.turi} ${m.obyekt}`);
  }
} catch (err) {
  failed++;
  console.log(`  ❌ verify_schema.sql ishlamadi: ${String(err.message).split("\n")[0]}`);
}

// ── Funksional test: standings avtomatik hisoblanishi (0019) ────────────────
// Sintaksis to'g'ri bo'lishi yetarli emas — ochkolar va o'rinlar HAQIQATAN
// to'g'ri hisoblanayotganini tekshiramiz.
console.log("\nFunksional test — jadval avtomatik hisoblanishi:");

function expect(label, actual, want) {
  const ok = String(actual) === String(want);
  if (!ok) {
    failed++;
    console.log(`  ❌ ${label}: kutilgan ${want}, chiqdi ${actual}`);
  }
  return ok;
}

try {
  await db.exec(`
    insert into public.teams (slug, name, init, crest_gradient) values
      ('t-a', 'Alfa', 'AL', 'x'), ('t-b', 'Beta', 'BE', 'x'), ('t-c', 'Gamma', 'GA', 'x');

    insert into public.tournaments (slug, name, dates_label, starts_on, ends_on, status)
      values ('t-test', 'Test kubogi', 'test', '2026-01-01', '2026-02-01', 'faol');

    -- Uchta jamoani jadvalga biriktiramiz
    insert into public.standings (tournament_id, team_id, group_name, pos)
    select t.id, tm.id, 'A', 0 from public.tournaments t, public.teams tm
    where t.slug = 't-test' and tm.slug in ('t-a','t-b','t-c');

    -- Yakunlangan uchrashuvlar: A 3:1 B, B 2:0 C, A 1:1 C
    insert into public.matches (tournament_id, home_team_id, away_team_id, home_score, away_score, status, kickoff_at)
    select t.id, h.id, a.id, v.hs, v.as_, 'finished', '2026-01-10'::timestamptz
    from (values ('t-a','t-b',3,1), ('t-b','t-c',2,0), ('t-a','t-c',1,1)) as v(home, away, hs, as_)
    join public.teams h on h.slug = v.home
    join public.teams a on a.slug = v.away
    cross join public.tournaments t
    where t.slug = 't-test';
  `);

  const rows = (
    await db.query(`
      select tm.slug, s.played, s.won, s.drawn, s.lost, s.goals_for, s.goals_against, s.points, s.pos
      from public.standings s
      join public.teams tm on tm.id = s.team_id
      join public.tournaments t on t.id = s.tournament_id
      where t.slug = 't-test'
      order by s.pos
    `)
  ).rows;

  const by = Object.fromEntries(rows.map((r) => [r.slug, r]));

  // Alfa: 1 g'alaba + 1 durang = 4 ochko, 4:2 gol → 1-o'rin
  expect("Alfa ochko", by["t-a"]?.points, 4);
  expect("Alfa o'yin", by["t-a"]?.played, 2);
  expect("Alfa gollar", `${by["t-a"]?.goals_for}:${by["t-a"]?.goals_against}`, "4:2");
  expect("Alfa o'rin", by["t-a"]?.pos, 1);

  // Beta: 1 g'alaba + 1 mag'lubiyat = 3 ochko → 2-o'rin
  expect("Beta ochko", by["t-b"]?.points, 3);
  expect("Beta o'rin", by["t-b"]?.pos, 2);

  // Gamma: 1 durang = 1 ochko → 3-o'rin
  expect("Gamma ochko", by["t-c"]?.points, 1);
  expect("Gamma mag'lubiyat", by["t-c"]?.lost, 1);
  expect("Gamma o'rin", by["t-c"]?.pos, 3);

  // O'yin o'chirilganda jadval qayta hisoblanishi kerak
  await db.exec(`
    delete from public.matches m using public.teams h, public.teams a
    where m.home_team_id = h.id and m.away_team_id = a.id
      and h.slug = 't-a' and a.slug = 't-b';
  `);
  const afterDelete = (
    await db.query(`
      select s.points from public.standings s
      join public.teams tm on tm.id = s.team_id where tm.slug = 't-a'
    `)
  ).rows[0];
  // A endi faqat durang: 1 ochko
  expect("o'yin o'chirilgach Alfa ochkosi", afterDelete?.points, 1);

  if (failed === 0) console.log("  ✅ ochkolar, gollar va o'rinlar to'g'ri hisoblandi");
} catch (err) {
  failed++;
  console.log(`  ❌ funksional test ishlamadi: ${String(err.message).split("\n")[0]}`);
}

await db.close();

console.log(failed === 0 ? "\nHammasi joyida." : `\n${failed} ta muammo topildi.`);
process.exit(failed === 0 ? 0 : 1);
