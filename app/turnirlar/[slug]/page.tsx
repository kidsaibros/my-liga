import { notFound } from "next/navigation";
import { getTournamentDetail } from "@/lib/cache";
import { TournamentDetailClient } from "./TournamentDetailClient";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getTournamentDetail(slug);

  if (!detail) notFound();

  return (
    <TournamentDetailClient
      tournament={detail.tournament}
      standings={detail.standings}
      upcoming={detail.upcoming}
      results={detail.results}
      scorers={detail.scorers}
    />
  );
}
