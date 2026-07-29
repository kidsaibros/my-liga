import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToAll } from "@/lib/push";

// Segment config (runtime/dynamic) ataylab belgilanmagan — ular
// experimental.useCache bilan mos kelmaydi. Route `request.headers`ni
// o'qigani uchun avtomat dinamik va standart Node runtime'da ishlaydi.

/**
 * O'yin boshlanishi eslatmasi.
 *
 * Tashqi cron (masalan cron-job.org) har ~15 daqiqada shu manzilga murojaat
 * qiladi. Yaqin 35 daqiqa ichida boshlanadigan va hali eslatilmagan o'yinlarni
 * topib, barcha obunachilarga push yuboradi va `reminder_sent = true` qiladi.
 *
 * Himoya: `Authorization: Bearer <CRON_SECRET>` yoki `x-cron-secret` sarlavhasi
 * to'g'ri bo'lishi shart, aks holda 401.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET sozlanmagan" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  const bearerOk = auth === `Bearer ${secret}`;
  const headerOk = headerSecret === secret;
  if (!bearerOk && !headerOk) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);

  const { data: matches, error } = await admin
    .from("matches")
    .select(
      "id, kickoff_at, venue, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)"
    )
    .eq("status", "scheduled")
    .eq("reminder_sent", false)
    .gte("kickoff_at", now.toISOString())
    .lte("kickoff_at", windowEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = matches ?? [];
  let sent = 0;

  for (const m of rows as unknown as MatchRow[]) {
    const home = m.home_team?.name ?? "Jamoa";
    const away = m.away_team?.name ?? "Jamoa";
    const time = new Date(m.kickoff_at).toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      await sendPushToAll({
        title: "⚽ O'yin boshlanmoqda",
        body: `${home} — ${away} · ${time}${m.venue ? ` · ${m.venue}` : ""}`,
        url: "/oyin",
        tag: `match-${m.id}`,
      });
      await admin.from("matches").update({ reminder_sent: true }).eq("id", m.id);
      sent++;
    } catch {
      // Bitta o'yin xato bersa ham qolganini davom ettiramiz.
    }
  }

  return NextResponse.json({ ok: true, checked: rows.length, reminded: sent });
}

type MatchRow = {
  id: string;
  kickoff_at: string;
  venue: string | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
};
