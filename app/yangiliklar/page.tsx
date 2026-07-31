import Link from "next/link";
import { Screen } from "@/components/Screen";
import { BackIcon } from "@/components/icons";
import { getNews } from "@/lib/cache";

export default async function YangiliklarPage() {
  const news = await getNews();

  return (
    <Screen>
      <div className="flex flex-col gap-4 px-5 pt-3 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--fg)" }}
          >
            <BackIcon size={18} />
          </Link>
          <div className="text-[17px] font-extrabold tracking-tight">Yangiliklar</div>
        </div>

        {news.length === 0 ? (
          <div
            className="rounded-[18px] border p-6 text-center text-sm"
            style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--fg-muted)" }}
          >
            Hozircha yangiliklar yo&apos;q
          </div>
        ) : (
          news.map((n) => (
            <Link
              key={n.id}
              href={`/yangiliklar/${n.id}`}
              className="block overflow-hidden rounded-[18px] border transition-opacity hover:opacity-90"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}
            >
              {n.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.image_url} alt={n.title} className="h-[180px] w-full object-cover" />
              ) : (
                <div className="h-[180px] w-full" style={{ background: n.cover_gradient }} />
              )}
              <div className="flex flex-col gap-1.5 p-4">
                <div className="text-[13px] font-bold">{n.title}</div>
                <div className="line-clamp-2 text-[12px]" style={{ color: "var(--fg-soft)" }}>
                  {n.body}
                </div>
                <div className="text-[10.5px]" style={{ color: "var(--fg-muted)" }}>
                  {new Date(n.published_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Screen>
  );
}
