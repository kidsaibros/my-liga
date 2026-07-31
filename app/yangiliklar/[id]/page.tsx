import Link from "next/link";
import { notFound } from "next/navigation";
import { Screen } from "@/components/Screen";
import { BackIcon } from "@/components/icons";
import { createPublicClient } from "@/lib/supabase/public";
import type { News } from "@/lib/types";

/** Bitta yangilik — to'liq matn bilan. Ro'yxatdagi kartani bosganda ochiladi. */
export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const n = data as News;

  return (
    <Screen>
      <div className="flex flex-col gap-4 px-5 pt-3 pb-10">
        <div className="flex items-center gap-3">
          <Link
            href="/yangiliklar"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--fg)" }}
          >
            <BackIcon size={18} />
          </Link>
          <div className="text-[17px] font-extrabold tracking-tight">Yangilik</div>
        </div>

        <div
          className="overflow-hidden rounded-[18px] border"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          {n.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.image_url} alt={n.title} className="max-h-[360px] w-full object-cover" />
          ) : (
            <div className="h-[200px] w-full" style={{ background: n.cover_gradient }} />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-[20px] font-extrabold leading-snug tracking-tight">{n.title}</h1>
          <div className="text-[11.5px]" style={{ color: "var(--fg-muted)" }}>
            {new Date(n.published_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <p
            className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed"
            style={{ color: "var(--fg-soft)" }}
          >
            {n.body}
          </p>
        </div>
      </div>
    </Screen>
  );
}
