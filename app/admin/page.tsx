import { createClient } from "@/lib/supabase/server";
import type { Match, Player, Team, Tournament, News, Sponsor, AppSettings, Profile } from "@/lib/types";
import { AdminClient } from "./AdminClient";

/** Admin paneli har doim joriy sessiyaga bog'liq — keshlanmaydi. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Yagona cookie-aware server klient: barcha so'rovlar admin sessiyasi ostida ketadi,
  // shuning uchun is_admin() ga tayanadigan RLS policy'lari to'g'ri ishlaydi
  // (eski anon singleton bilan `pending` jamoalar va app_settings ko'rinmasdi).
  const supabase = await createClient();

  const [
    { data: tournaments },
    { data: matches },
    { data: teams },
    { data: players },
    { data: news },
    { data: sponsors },
    { data: settings },
    { data: users },
  ] = await Promise.all([
    supabase.from("tournaments").select("*").order("starts_on", { ascending: false }),
    supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
      .order("kickoff_at", { ascending: false }),
    supabase.from("teams").select("*").order("name", { ascending: true }),
    // Gol muallifini kiritishda taklif (datalist) sifatida ishlatiladi
    supabase.from("players").select("*").order("name", { ascending: true }),
    supabase.from("news").select("*").order("published_at", { ascending: false }),
    supabase.from("sponsors").select("*").order("sort_order", { ascending: true }),
    supabase.from("app_settings").select("*").limit(1).maybeSingle(),
    supabase
      .from("profiles")
      .select("*, team:teams(*)")
      .not("user_id", "is", null)
      .neq("role", "super_admin")
      .order("full_name", { ascending: true }),
  ]);

  return (
    <AdminClient
      tournaments={(tournaments ?? []) as Tournament[]}
      matches={(matches ?? []) as unknown as Match[]}
      teams={(teams ?? []) as Team[]}
      players={(players ?? []) as Player[]}
      news={(news ?? []) as News[]}
      sponsors={(sponsors ?? []) as Sponsor[]}
      settings={(settings ?? null) as AppSettings | null}
      users={(users ?? []) as Profile[]}
    />
  );
}
