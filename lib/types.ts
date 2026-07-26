/**
 * Domen tiplari — `lib/database.types.ts` dagi generatsiya qilingan sxemadan
 * kelib chiqadi. Qo'lda yozilgan ustun ro'yxatlari yo'q: jadvalga ustun
 * qo'shilsa, `supabase gen types` ni qayta ishga tushirish kifoya.
 *
 * Bu yerda faqat ikki xil ustma-ustlik qo'shiladi:
 *   1. `text` ustunlarni CHECK-constraint'ga mos union tiplarga toraytirish
 *      (masalan `status: string` → `TournamentStatus`).
 *   2. Supabase `select("*, team:teams(*)")` qaytaradigan joinlangan
 *      munosabatlarni tipga qo'shish.
 */

import type { Tables } from "./database.types";

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from "./database.types";

// ── CHECK-constraint'lardan kelib chiqadigan union tiplar ────────────────────
export type TournamentStatus = "faol" | "yakunlangan" | "kelajakdagi";
export type MatchStatus = "scheduled" | "live" | "finished";
export type StatType = "goal" | "assist";
export type ProfileRole = "user" | "coach" | "super_admin";
export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";
export type Formation = "4-4-2" | "4-3-3" | "4-2-3-1" | "3-5-2" | "3-4-3";
export type TeamStatus = "pending" | "approved" | "rejected";

/** Row tipidagi ayrim `string` ustunlarni tor union bilan almashtirish yordamchisi. */
type Narrow<Row, Overrides> = Omit<Row, keyof Overrides> & Overrides;

// ── Jadval tiplari ───────────────────────────────────────────────────────────
export type Team = Narrow<Tables<"teams">, { status: TeamStatus }>;

export type Tournament = Narrow<Tables<"tournaments">, { status: TournamentStatus }>;

export type Standing = Tables<"standings"> & { team: Team };

export type Match = Narrow<Tables<"matches">, { status: MatchStatus }> & {
  home_team: Team;
  away_team: Team;
  tournament?: Tournament;
};

export type PlayerStat = Tables<"player_stats"> & { team: Team };

export type Profile = Narrow<Tables<"profiles">, { role: ProfileRole }> & {
  team: Team | null;
};

export type News = Tables<"news">;

export type Sponsor = Tables<"sponsors">;

export type AppSettings = Tables<"app_settings">;

export type Player = Narrow<Tables<"players">, { position: PlayerPosition }>;

export type Lineup = Narrow<Tables<"lineups">, { formation: Formation }>;

export type CoachInvite = Tables<"coach_invites">;

export type UserFavorite = Tables<"user_favorites">;

export type ChatMessage = Tables<"chat_messages">;

// ── Bildirishnomalar ─────────────────────────────────────────────────────────
export interface TeamCreatedPayload {
  team_id: string;
  team_name: string;
  coach_name: string;
}

export type Notification = Narrow<
  Tables<"notifications">,
  {
    recipient_role: "super_admin" | "admin" | null;
    payload: TeamCreatedPayload | Record<string, unknown>;
  }
>;
