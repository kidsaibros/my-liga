// Admin panel Server Actions uchun input validatsiya sxemalari.
// Maydon nomlari va cheklovlar supabase/migrations/0001_init.sql'dagi
// jadval ustunlariga mos keladi.

import { z } from "zod";

export const idSchema = z.string().uuid("Noto'g'ri ID formati");

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug majburiy")
  .max(80, "Slug juda uzun")
  .regex(/^[a-z0-9-]+$/, "Slug faqat kichik lotin harflari, raqam va '-' belgisidan iborat bo'lishi kerak");

const cssValueSchema = z.string().trim().min(1, "Majburiy maydon").max(300);

/**
 * Bo'sh satrni `undefined` ga aylantiradi, aks holda berilgan sxemani qo'llaydi.
 * `.or()` bilan yozilgan eski variant xato edi: agar asosiy sxema bo'sh satrni
 * qabul qilsa (masalan oddiy `z.string()`), ikkinchi shox umuman ishga tushmasdi
 * va DB'ga NULL o'rniga bo'sh satr yozilardi.
 */
const emptyToUndefined = <T extends z.ZodType<string, string>>(schema: T) =>
  z.union([z.literal("").transform(() => undefined), schema.optional()]);

/**
 * Xavfsizlik: `z.url()` `javascript:`, `data:` va boshqa sxemalarni ham to'g'ri
 * URL deb hisoblaydi. Bu qiymatlar keyinchalik `<a href>` yoki CSS `url()` ichiga
 * tushgani uchun faqat http/https ga ruxsat beramiz.
 */
const httpUrlSchema = z
  .string()
  .trim()
  .max(500)
  .url("URL formati noto'g'ri")
  .refine((v) => /^https?:\/\//i.test(v), "URL http:// yoki https:// bilan boshlanishi kerak");

const optionalUrlSchema = emptyToUndefined(httpUrlSchema);

const optionalEmailSchema = emptyToUndefined(
  z.string().trim().toLowerCase().max(255).email("Email formati noto'g'ri")
);

// ── teams ──────────────────────────────────────────────────
export const teamSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1, "Nomi majburiy").max(120),
  init: z
    .string()
    .trim()
    .min(1, "Qisqartma majburiy")
    .max(3, "Qisqartma 3 belgidan oshmasligi kerak")
    .transform((s) => s.toUpperCase()),
  crest_gradient: cssValueSchema,
  crest_border: cssValueSchema,
  crest_color: cssValueSchema,
  logo_url: optionalUrlSchema,
  coach_email: optionalEmailSchema,
});
export type TeamInput = z.infer<typeof teamSchema>;

// ── tournaments ────────────────────────────────────────────
export const tournamentStatusSchema = z.enum(["faol", "yakunlangan", "kelajakdagi"]);

export const tournamentSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1, "Nomi majburiy").max(150),
    dates_label: z.string().trim().min(1, "Sana yorlig'i majburiy").max(150),
    starts_on: z.iso.date("Boshlanish sanasi noto'g'ri (YYYY-MM-DD)"),
    ends_on: z.iso.date("Tugash sanasi noto'g'ri (YYYY-MM-DD)"),
    team_count: z.coerce.number().int().min(0).max(1000),
    status: tournamentStatusSchema,
    logo_url: optionalUrlSchema,
    // Reglament — har bir qator turnir sahifasida alohida band bo'lib chiqadi.
    regulations: emptyToUndefined(
      z.string().trim().max(10000, "Reglament 10000 belgidan oshmasligi kerak")
    ),
  })
  .refine((v) => v.ends_on >= v.starts_on, {
    message: "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas",
    path: ["ends_on"],
  });
export type TournamentInput = z.infer<typeof tournamentSchema>;

// ── news ───────────────────────────────────────────────────
export const newsSchema = z.object({
  title: z.string().trim().min(1, "Sarlavha majburiy").max(200),
  body: z.string().trim().min(1, "Matn majburiy").max(20000),
  cover_gradient: cssValueSchema,
  published_at: z.coerce.date("Sana noto'g'ri").transform((d) => d.toISOString()),
});
export type NewsInput = z.infer<typeof newsSchema>;

// ── sponsors (homiylar) ───────────────────────────────────
export const sponsorSchema = z.object({
  name: z.string().trim().min(1, "Nomi majburiy").max(120),
  logo_url: optionalUrlSchema,
  link_url: optionalUrlSchema,
  is_featured: z.coerce.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});
export type SponsorInput = z.infer<typeof sponsorSchema>;

// ── app_settings (admin "Tizim sozlamalari") ──────────────
const optionalTextSchema = (max: number) => emptyToUndefined(z.string().trim().max(max));

export const appSettingsSchema = z.object({
  telegram_support_url: optionalUrlSchema,
  phone_support: optionalTextSchema(30),
  app_name: optionalTextSchema(60),
  system_status: optionalTextSchema(60),
});
export type AppSettingsInput = z.infer<typeof appSettingsSchema>;

// ── profiles (foydalanuvchining o'zi tahrirlaydigan maydonlar) ───────────
export const profileNameSchema = z.string().trim().min(1, "Ism bo'sh bo'lishi mumkin emas").max(120);

// ── player_stats (murabbiy o'z jamoasi o'yinchilarini boshqarishi) ─────────
export const playerStatSchema = z.object({
  player_name: z.string().trim().min(1, "O'yinchi ismi majburiy").max(120),
  team_id: idSchema,
  goals: z.coerce.number().int().min(0).max(999),
  assists: z.coerce.number().int().min(0).max(999),
});
export type PlayerStatInput = z.infer<typeof playerStatSchema>;

// ── coach invites (jamoasiz 'coach' sifatida taklif qilish) ────────────────
export const emailSchema = z.string().trim().toLowerCase().min(1, "Email majburiy").email("Email formati noto'g'ri");

export const coachInviteSchema = z.object({
  email: emailSchema,
});
export type CoachInviteInput = z.infer<typeof coachInviteSchema>;

// ── murabbiy o'zi jamoa yaratishi (faqat nom + logo) ───────────────────────
export const teamCreateSchema = z.object({
  name: z.string().trim().min(1, "Nomi majburiy").max(120),
  logo_url: optionalUrlSchema,
});
export type TeamCreateInput = z.infer<typeof teamCreateSchema>;

// ── players (roster — murabbiy boshqaradigan jamoa tarkibi) ───────────────
export const positionSchema = z.enum(["GK", "DEF", "MID", "FWD"]);

export const playerSchema = z.object({
  team_id: idSchema,
  number: z.coerce.number().int().min(0, "0 dan katta bo'lishi kerak").max(99, "99 dan kichik bo'lishi kerak"),
  name: z.string().trim().min(1, "Ism majburiy").max(120),
  position: positionSchema,
  is_starter: z.coerce.boolean().default(false),
  photo_url: optionalUrlSchema,
});
export type PlayerInput = z.infer<typeof playerSchema>;

// ── lineups (jamoa uchun joriy taktik sxema) ───────────────────────────────
export const formationSchema = z.enum(["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "3-4-3"]);

export const lineupSchema = z.object({
  team_id: idSchema,
  formation: formationSchema,
  captain_player_id: idSchema.nullable(),
});
export type LineupInput = z.infer<typeof lineupSchema>;
