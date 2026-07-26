/**
 * Migratsiyalarni haqiqiy PostgreSQL'da (PGlite / WASM) sinab ko'radi.
 *
 * Nega kerak: migratsiyalar Supabase Dashboard'ga qo'lda joylashtirilgani uchun
 * bittasi tushib qolsa yoki xato bilan to'xtasa, buni faqat ilova buzilganda
 * sezamiz. Bu skript zanjirni mahalliy bazada ishga tushirib, xatoni oldindan
 * topadi.
 *
 * Ishga tushirish:
 *   npm run db:test
 *
 * Ikkita ssenariy tekshiriladi:
 *   1. TOZA BAZA — 0001 dan oxirigacha hammasi ketma-ket.
 *   2. YETIB OLISH — ba'zi migratsiyalar tushib qolgan baza (haqiqiy holat) va
 *      undan keyin yetishmayotganlarini qo'llash.
 *
 * Eslatma: PGlite'da Supabase'ning `auth`/`storage` sxemalari yo'q, shuning
 * uchun quyida ularning minimal "qo'g'irchoq" versiyasi yaratiladi. Maqsad —
 * SQL va obyektlar bog'liqligini tekshirish, Supabase'ni to'liq takrorlash emas.
 */

import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "migrations");

const ALL = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const sqlOf = (file) => readFileSync(join(migrationsDir, file), "utf8");
const num = (file) => file.slice(0, 4);

/** Supabase muhitining minimal taqlidi. */
const SUPABASE_STUB = `
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select 'authenticated'::text $$;

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

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;
`;

let problems = 0;

function fail(msg) {
  problems++;
  console.log(`  ❌ ${msg}`);
}

async function applyMigrations(db, files, { quiet = false } = {}) {
  for (const file of files) {
    try {
      await db.exec(sqlOf(file));
      if (!quiet) console.log(`  ✅ ${file}`);
    } catch (err) {
      fail(`${file} — ${String(err.message).split("\n")[0]}`);
    }
  }
}

async function checkSchema(db) {
  const verifySql = readFileSync(join(here, "verify_schema.sql"), "utf8");
  try {
    const res = await db.query(verifySql);
    const missing = res.rows.filter((r) => String(r.holat).includes("YO"));
    if (missing.length === 0) {
      console.log(`  ✅ sxema: kutilgan ${res.rows.length} ta obyektning hammasi joyida`);
    } else {
      fail(`sxema: ${missing.length} ta obyekt yo'q`);
      for (const m of missing) console.log(`       ${m.migration} ${m.turi} ${m.obyekt}`);
    }
  } catch (err) {
    fail(`verify_schema.sql ishlamadi — ${String(err.message).split("\n")[0]}`);
  }
}

/** Ochkolar/o'rinlar haqiqatan to'g'ri hisoblanayotganini tekshiradi (0019). */
async function checkStandingsLogic(db) {
  const expect = (label, actual, want) => {
    if (String(actual) !== String(want)) fail(`${label}: kutilgan ${want}, chiqdi ${actual}`);
  };

  try {
    await db.exec(`
      insert into public.teams (slug, name, init, crest_gradient) values
        ('t-a', 'Alfa', 'AL', 'x'), ('t-b', 'Beta', 'BE', 'x'), ('t-c', 'Gamma', 'GA', 'x');

      insert into public.tournaments (slug, name, dates_label, starts_on, ends_on, status)
        values ('t-test', 'Test kubogi', 'test', '2026-01-01', '2026-02-01', 'faol');

      insert into public.standings (tournament_id, team_id, group_name, pos)
      select t.id, tm.id, 'A', 0 from public.tournaments t, public.teams tm
      where t.slug = 't-test' and tm.slug in ('t-a','t-b','t-c');

      -- Alfa 3:1 Beta, Beta 2:0 Gamma, Alfa 1:1 Gamma
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
      `)
    ).rows;
    const by = Object.fromEntries(rows.map((r) => [r.slug, r]));

    expect("Alfa ochko", by["t-a"]?.points, 4);
    expect("Alfa o'yin", by["t-a"]?.played, 2);
    expect("Alfa gollar", `${by["t-a"]?.goals_for}:${by["t-a"]?.goals_against}`, "4:2");
    expect("Alfa o'rin", by["t-a"]?.pos, 1);
    expect("Beta ochko", by["t-b"]?.points, 3);
    expect("Beta o'rin", by["t-b"]?.pos, 2);
    expect("Gamma ochko", by["t-c"]?.points, 1);
    expect("Gamma o'rin", by["t-c"]?.pos, 3);

    await db.exec(`
      delete from public.matches m using public.teams h, public.teams a
      where m.home_team_id = h.id and m.away_team_id = a.id
        and h.slug = 't-a' and a.slug = 't-b';
    `);
    const after = (
      await db.query(
        `select s.points from public.standings s
         join public.teams tm on tm.id = s.team_id where tm.slug = 't-a'`
      )
    ).rows[0];
    expect("o'yin o'chirilgach Alfa ochkosi", after?.points, 1);

    console.log("  ✅ jadval mantiqi: ochko, gol va o'rinlar to'g'ri");
  } catch (err) {
    fail(`jadval mantiqi — ${String(err.message).split("\n")[0]}`);
  }
}

/**
 * To'purarlar HAR TURNIR uchun alohida hisoblanishini tekshiradi (0021).
 * Aynan shu narsa `player_stats` da buzuq edi: bir jamoa ikki turnirda
 * o'ynasa, gollari qo'shilib ketardi.
 */
async function checkScorersPerTournament(db) {
  const expect = (label, actual, want) => {
    if (String(actual) !== String(want)) fail(`${label}: kutilgan ${want}, chiqdi ${actual}`);
  };

  try {
    await db.exec(`
      -- Ikkinchi turnir: AYNAN SHU jamoalar yana o'ynaydi
      insert into public.tournaments (slug, name, dates_label, starts_on, ends_on, status)
        values ('t-test2', 'Ikkinchi kubok', 'test', '2026-03-01', '2026-04-01', 'faol');

      insert into public.matches (tournament_id, home_team_id, away_team_id, home_score, away_score, status, kickoff_at)
      select t.id, h.id, a.id, 2, 0, 'finished', '2026-03-10'::timestamptz
      from public.teams h, public.teams a, public.tournaments t
      where h.slug = 't-a' and a.slug = 't-c' and t.slug = 't-test2';

      -- 1-turnirdagi (Alfa 1:1 Gamma) o'yinga gol yozamiz
      insert into public.match_events (match_id, team_id, player_name, type, minute)
      select m.id, h.id, 'Aziz', 'goal', 20
      from public.matches m
      join public.teams h on h.id = m.home_team_id
      join public.tournaments t on t.id = m.tournament_id
      where t.slug = 't-test' and h.slug = 't-a';

      -- 2-turnirdagi o'yinga o'sha o'yinchining 2 ta goli
      insert into public.match_events (match_id, team_id, player_name, type, minute)
      select m.id, h.id, 'Aziz', 'goal', v.min
      from public.matches m
      join public.teams h on h.id = m.home_team_id
      join public.tournaments t on t.id = m.tournament_id
      cross join (values (15), (60)) as v(min)
      where t.slug = 't-test2' and h.slug = 't-a';
    `);

    const t1 = (
      await db.query(
        `select * from public.tournament_scorers((select id from public.tournaments where slug = 't-test'))`
      )
    ).rows;
    const t2 = (
      await db.query(
        `select * from public.tournament_scorers((select id from public.tournaments where slug = 't-test2'))`
      )
    ).rows;
    const all = (await db.query(`select * from public.overall_scorers()`)).rows;

    expect("1-turnirda Aziz gollari", t1.find((r) => r.player_name === "Aziz")?.goals, 1);
    expect("2-turnirda Aziz gollari", t2.find((r) => r.player_name === "Aziz")?.goals, 2);
    expect("umumiy Aziz gollari", all.find((r) => r.player_name === "Aziz")?.goals, 3);

    console.log("  ✅ to'purarlar: gollar turnirlar aro aralashmayapti (1 + 2 = 3)");
  } catch (err) {
    fail(`to'purarlar hisobi — ${String(err.message).split("\n")[0]}`);
  }
}

async function newDb() {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUB);
  return db;
}

// ── 1-ssenariy: toza baza, hamma migratsiyalar ──────────────────────────────
console.log("1) TOZA BAZA — barcha migratsiyalar ketma-ket:");
{
  const db = await newDb();
  await applyMigrations(db, ALL);
  await checkSchema(db);
  await checkStandingsLogic(db);
  await checkScorersPerTournament(db);
  await db.close();
}

// ── 2-ssenariy: tushib qolgan migratsiyalarni keyin qo'llash ────────────────
// Haqiqiy holat (26.07.2026): 0014, 0015, 0016 va 0019 bajarilmagan, lekin
// 0017 va 0018 bajarilgan. Ya'ni tartib buzilgan — shu holatdan chiqib
// bo'ladimi, tekshiramiz.
const SKIPPED = ["0014", "0015", "0016", "0019"];

console.log("\n2) YETIB OLISH — 0014/0015/0016/0019 tushib qolgan bazani tuzatish:");
{
  const db = await newDb();
  const appliedFirst = ALL.filter((f) => !SKIPPED.includes(num(f)) && num(f) < "0020");
  const catchUp = ALL.filter((f) => SKIPPED.includes(num(f)));
  const rest = ALL.filter((f) => num(f) >= "0020");

  console.log(`  boshlang'ich holat: ${appliedFirst.map(num).join(", ")}`);
  await applyMigrations(db, appliedFirst, { quiet: true });

  console.log(`  yetib olish: ${catchUp.map(num).join(", ")} → ${rest.map(num).join(", ")}`);
  await applyMigrations(db, [...catchUp, ...rest]);

  await checkSchema(db);
  await checkStandingsLogic(db);
  await checkScorersPerTournament(db);
  await db.close();
}

console.log(problems === 0 ? "\nHammasi joyida." : `\n${problems} ta muammo topildi.`);
process.exit(problems === 0 ? 0 : 1);
