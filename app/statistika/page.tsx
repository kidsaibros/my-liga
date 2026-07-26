import { getPlayerStats } from "@/lib/cache";
import { StatistikaClient } from "./StatistikaClient";

export default async function StatistikaPage() {
  const players = await getPlayerStats();

  return <StatistikaClient players={players} />;
}
