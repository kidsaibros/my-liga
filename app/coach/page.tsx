import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Team } from "@/lib/types";
import { CoachDashboardClient } from "./CoachDashboardClient";
import { CreateTeamForm } from "./CreateTeamForm";

/** Murabbiy uchun alohida Dashboard — middleware allaqachon rolni tekshirgan, bu yerda ikkinchi himoya qatlami. */
export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team_id, full_name")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "coach") redirect("/");

  // Jamoasi hali yo'q — o'zi yaratadi (yaratilgach status='pending' bilan boshlanadi).
  if (!profile.team_id) {
    return <CreateTeamForm coachName={profile.full_name} />;
  }

  const { data: team } = await supabase.from("teams").select("*").eq("id", profile.team_id).single();
  if (!team) redirect("/");

  return <CoachDashboardClient team={team as Team} coachName={profile.full_name} />;
}
