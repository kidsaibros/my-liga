import Link from "next/link";

/**
 * 404. `notFound()` chaqirilganda (masalan mavjud bo'lmagan turnir slug'i) va
 * noma'lum yo'llarda ko'rsatiladi.
 */
export default function NotFound() {
  return (
    <div className="app-scroll flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div
        className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px] text-[#E9C464]"
        style={{
          background: "linear-gradient(140deg,#4A3A10,#241A05)",
          border: "1px solid rgba(233,196,100,0.4)",
        }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 3v5.8M12 15.2V21M3.5 9.5l5.4 1.8M20.5 9.5l-5.4 1.8M6.5 19l3.3-4.6M17.5 19l-3.3-4.6" />
        </svg>
      </div>

      <h1 className="mt-5 text-[19px] font-extrabold tracking-tight">Sahifa topilmadi</h1>
      <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed" style={{ color: "var(--fg-soft)" }}>
        Siz izlagan sahifa mavjud emas yoki o&apos;chirilgan. Havolani tekshirib
        ko&apos;ring yoki quyidagi bo&apos;limlardan birini tanlang.
      </p>

      <div className="mt-6 flex w-full max-w-[280px] flex-col gap-2.5">
        <Link
          href="/"
          className="w-full rounded-[13px] border-0 px-4 py-3 text-[13px] font-extrabold text-[#062016]"
          style={{ background: "linear-gradient(120deg,#22C55E,#0E9F6E)" }}
        >
          Bosh sahifa
        </Link>
        <Link
          href="/turnirlar"
          className="w-full rounded-[13px] border px-4 py-3 text-[13px] font-semibold"
          style={{ background: "var(--bg-soft)", borderColor: "var(--border)", color: "var(--fg)" }}
        >
          Turnirlar
        </Link>
      </div>
    </div>
  );
}
