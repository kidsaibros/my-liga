import Link from "next/link";

type Chip = { id: string; name: string; slug: string };

/**
 * Bosh sahifadagi liga tugmalari — endi HAQIQIY ligalar (format = 'liga', faol).
 * Har biri o'sha liganing turnir sahifasiga (jadval + o'yinlar) olib boradi.
 * Liga yo'q bo'lsa — hech narsa ko'rsatilmaydi.
 */
export function LeagueChips({ leagues }: { leagues: Chip[] }) {
  if (!leagues || leagues.length === 0) return null;

  return (
    <div
      className="no-scrollbar"
      style={{
        display: "flex",
        flexWrap: "nowrap",
        gap: 8,
        overflowX: "auto",
        margin: "12px -16px 0",
        padding: "0 16px 2px",
      }}
    >
      {leagues.map((lg) => (
        <Link
          key={lg.id}
          href={`/turnirlar/${lg.slug}`}
          style={{
            flex: "none",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--fg-soft)",
            borderRadius: 99,
            padding: "7px 15px",
            fontSize: 12.5,
            fontWeight: 700,
            whiteSpace: "nowrap",
            textDecoration: "none",
          }}
        >
          {lg.name}
        </Link>
      ))}
    </div>
  );
}
