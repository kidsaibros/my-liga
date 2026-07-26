import { getOverallScorers } from "@/lib/cache";
import { StatistikaClient } from "./StatistikaClient";

export default async function StatistikaPage() {
  const players = await getOverallScorers();

  return <StatistikaClient players={players} />;
}
