import { getTournaments } from "@/lib/cache";
import { TurnirlarClient } from "./TurnirlarClient";

export default async function TurnirlarPage() {
  const tournaments = await getTournaments();

  return <TurnirlarClient tournaments={tournaments} />;
}
