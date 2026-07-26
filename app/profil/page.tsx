import { createClient } from "@/lib/supabase/server";
import type { AppSettings, Profile } from "@/lib/types";
import { ProfilClient } from "./ProfilClient";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <ProfilClient email={null} profile={null} settings={null} />;
  }

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("*, team:teams(*)").eq("user_id", user.id).single(),
    supabase.from("app_settings").select("*").limit(1).maybeSingle(),
  ]);

  return (
    <ProfilClient
      email={user.email ?? null}
      profile={profile as Profile | null}
      settings={settings as AppSettings | null}
    />
  );
}
