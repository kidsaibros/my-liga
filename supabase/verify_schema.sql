-- SXEMA TEKSHIRUVI — bazaga hech narsa yozmaydi, faqat o'qiydi.
--
-- Migratsiyalar qo'lda qo'llanganda ba'zi skriptlar o'rtada xato bilan
-- to'xtashi mumkin (masalan `coach_invites` shunday yo'qolib qolgan edi).
-- Bu skript 0001–0020 kutayotgan barcha obyektlarni bittalab tekshiradi.
--
-- Supabase Dashboard → SQL Editor'da ishga tushiring. Natijada `holat` ustuni
-- «✅ bor» yoki «❌ YO'Q» ko'rsatadi, yo'qlari eng yuqorida chiqadi.

with expected(kind, name, migration) as (
  values
    -- ── Jadvallar ───────────────────────────────────────────────────────────
    ('table', 'teams',          '0001'),
    ('table', 'tournaments',    '0001'),
    ('table', 'standings',      '0001'),
    ('table', 'matches',        '0001'),
    ('table', 'player_stats',   '0001'),
    ('table', 'profiles',       '0001'),
    ('table', 'chat_messages',  '0001'),
    ('table', 'news',           '0002'),
    ('table', 'sponsors',       '0007'),
    ('table', 'app_settings',   '0011'),
    ('table', 'user_favorites', '0011'),
    ('table', 'players',        '0013'),
    ('table', 'lineups',        '0013'),
    ('table', 'coach_invites',  '0016'),
    ('table', 'notifications',  '0016'),

    -- ── Funksiyalar ─────────────────────────────────────────────────────────
    ('function', 'is_admin',                         '0003'),
    ('function', 'prevent_role_self_escalation',     '0009'),
    ('function', 'is_team_coach',                    '0013'),
    ('function', 'is_coach',                         '0016'),
    ('function', 'prevent_team_status_self_approval','0016'),
    ('function', 'notify_team_created',              '0016'),
    ('function', 'recalc_standings',                 '0019'),
    ('function', 'matches_recalc_standings',         '0019'),

    -- ── Ustunlar (keyingi migratsiyalarda qo'shilganlari) ───────────────────
    ('column', 'profiles.role',           '0003'),
    ('column', 'profiles.user_id',        '0003'),
    ('column', 'profiles.avatar_url',     '0009'),
    ('column', 'profiles.email',          '0013'),
    ('column', 'profiles.push_enabled',   '0011'),
    ('column', 'teams.coach_email',       '0009'),
    ('column', 'teams.coach_id',          '0013'),
    ('column', 'teams.logo_url',          '0008'),
    ('column', 'teams.status',            '0016'),
    ('column', 'teams.created_by',        '0016'),
    ('column', 'tournaments.logo_url',    '0008'),
    ('column', 'tournaments.regulations', '0017'),
    ('column', 'players.photo_url',       '0014'),

    -- ── Triggerlar ──────────────────────────────────────────────────────────
    ('trigger', 'trg_prevent_role_self_escalation',      '0009'),
    ('trigger', 'trg_prevent_team_status_self_approval', '0016'),
    ('trigger', 'trg_notify_team_created',               '0016'),
    ('trigger', 'trg_matches_recalc_standings',          '0019'),

    -- ── Cheklovlar ──────────────────────────────────────────────────────────
    ('constraint', 'teams_status_check',                '0016'),
    ('constraint', 'matches_teams_differ_check',        '0018'),
    ('constraint', 'matches_scores_non_negative_check', '0018'),
    ('constraint', 'matches_minute_range_check',        '0018')
),
checked as (
  select
    e.migration,
    e.kind as turi,
    e.name as obyekt,
    case
      when e.kind = 'table' then
        (to_regclass('public.' || e.name) is not null)

      when e.kind = 'function' then
        exists (
          select 1 from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = e.name
        )

      when e.kind = 'column' then
        exists (
          select 1 from information_schema.columns c
          where c.table_schema = 'public'
            and c.table_name  = split_part(e.name, '.', 1)
            and c.column_name = split_part(e.name, '.', 2)
        )

      when e.kind = 'trigger' then
        exists (
          select 1 from pg_trigger t
          where not t.tgisinternal and t.tgname = e.name
        )

      when e.kind = 'constraint' then
        exists (select 1 from pg_constraint where conname = e.name)
    end as bormi
  from expected e
)
select
  migration,
  turi,
  obyekt,
  case when bormi then '✅ bor' else '❌ YO''Q' end as holat
from checked
-- Yo'qlari eng yuqorida: `bormi = false` birinchi bo'lishi uchun `bormi asc`.
order by bormi asc, migration, turi, obyekt;
