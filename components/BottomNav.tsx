"use client";

import { useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useSessionProfile } from "./SessionProvider";
import { AdminSheet } from "@/app/admin/AdminSheet";

const ACTIVE = "#0E9F6E";
const INACTIVE = "var(--fg-muted)";

const itemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "4px 0",
  textDecoration: "none",
  WebkitTapHighlightColor: "transparent",
};

/**
 * Link ichidagi kontent. `useLinkStatus()` faqat <Link> avlodida ishlaydi va
 * bosilgandan keyin sahifa kelguncha `pending: true` qaytaradi — shu vaqtda
 * belgini darhol yashil qilamiz. Aks holda bosilgan tugma server javobi
 * kelguncha o'zgarmay turadi va ilova "sekin" bo'lib tuyuladi.
 */
function NavContent({
  active,
  label,
  children,
}: {
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const { pending } = useLinkStatus();
  const color = active || pending ? ACTIVE : INACTIVE;

  return (
    <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color }}>
      <span style={{ display: "flex", opacity: pending && !active ? 0.7 : 1, transition: "opacity .12s" }}>
        {children}
      </span>
      <span style={{ fontSize: 9.5, fontWeight: 700 }}>{label}</span>
    </span>
  );
}

function NavLink({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    // prefetch: Next.js yo'nalishni ko'rinishga kirgan zahoti oldindan yuklab
    // qo'yadi, shuning uchun bosilganda sahifa deyarli bir zumda almashadi.
    // Eski variant `router.push()` edi — u umuman prefetch qilmaydi, shuning
    // uchun har bosishda 1-2 soniyalik kutish paydo bo'lardi.
    <Link href={href} prefetch style={itemStyle}>
      <NavContent active={active} label={label}>
        {children}
      </NavContent>
    </Link>
  );
}

/** MY LIGA App.dc.html "BOTTOM NAV" bloki bilan 1:1 (qatorlar 665-679). */
export function BottomNav() {
  const pathname = usePathname();
  const profile = useSessionProfile();
  const [adminOpen, setAdminOpen] = useState(false);

  // O'yin sahifasida pastki panel o'rniga chat maydoni, /coach'da esa o'zining
  // to'liq sahifa Dashboard'i bor — ikkalasida ham pastki panel yashiriladi
  if (pathname.startsWith("/oyin") || pathname.startsWith("/coach")) return null;

  const role = profile?.role;
  const isSuperAdmin = role === "super_admin";
  const isCoach = role === "coach";
  const showCenterNav = isSuperAdmin || isCoach;
  const navGrid = showCenterNav ? "1fr 1fr 76px 1fr 1fr" : "1fr 1fr 1fr 1fr";

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 0,
          width: "100%",
          maxWidth: 430,
          boxSizing: "border-box",
          background: "var(--card)",
          borderTop: "1px solid #EDEEF1",
          display: "grid",
          gridTemplateColumns: navGrid,
          alignItems: "center",
          padding: "8px 10px calc(env(safe-area-inset-bottom, 12px) + 8px)",
          zIndex: 10,
        }}
      >
        <NavLink href="/" active={pathname === "/"} label="Bosh sahifa">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
            <path d="M4 11l8-7 8 7v9h-5.5v-5.5h-5V20H4z" />
          </svg>
        </NavLink>

        <NavLink href="/turnirlar" active={pathname.startsWith("/turnirlar")} label="O'yinlar">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 3v5.8M12 15.2V21M3.5 9.5l5.4 1.8M20.5 9.5l-5.4 1.8M6.5 19l3.3-4.6M17.5 19l-3.3-4.6" />
          </svg>
        </NavLink>

        {showCenterNav && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            {isSuperAdmin && (
              <button
                onClick={() => setAdminOpen(true)}
                aria-label="Admin panel"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: 0,
                  background: "#0E9F6E",
                  color: "#fff",
                  cursor: "pointer",
                  marginTop: -30,
                  boxShadow: "0 10px 22px rgba(14,159,110,.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}

            {isCoach && (
              <Link
                href="/coach"
                prefetch
                aria-label="Mening jamoam"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  width: 64,
                  textDecoration: "none",
                  marginTop: -30,
                }}
              >
                <span
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "linear-gradient(150deg,#0E9F6E,#065F46)",
                    color: "#fff",
                    boxShadow: "0 10px 22px rgba(14,159,110,.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l7 3v6c0 4.5-3.1 8-7 9.5C8.1 19 5 15.5 5 11V5z" />
                    <path d="M12 7v6M9 10h6" />
                  </svg>
                </span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: "#0E9F6E" }}>Mening Jamoam</span>
              </Link>
            )}
          </div>
        )}

        <NavLink href="/statistika" active={pathname.startsWith("/statistika")} label="Statistika">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 20V12M12 20V5M19 20v-5" />
          </svg>
        </NavLink>

        <NavLink href="/profil" active={pathname.startsWith("/profil")} label="Profil">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 20c1.3-3.2 4.1-5 7.5-5s6.2 1.8 7.5 5" />
          </svg>
        </NavLink>
      </div>

      {adminOpen && <AdminSheet onClose={() => setAdminOpen(false)} />}
    </>
  );
}
