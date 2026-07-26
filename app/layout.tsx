import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Splash } from "@/components/Splash";
import { getSessionProfile } from "@/lib/auth";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Liga",
  description: "Havaskor futbol va mini-futbol musobaqalarini boshqarish platformasi",
};

export const viewport: Viewport = {
  themeColor: "#1e2425",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getSessionProfile();

  return (
    <html lang="uz" className={jakarta.variable} suppressHydrationWarning>
      {/*
        suppressHydrationWarning <body> uchun ham kerak: brauzer kengaytmalari
        (parol menejerlari, reklama bloklagichlar) React yuklanguncha <body> ga
        o'z atributlarini qo'shib qo'yadi (`bis_register`, `__processed_...`),
        bu esa har bir sahifada soxta hydration mismatch xatosi beradi.
      */}
      <body suppressHydrationWarning>
        <ThemeProvider>
          <div className="app-frame">
            <Splash />
            {/* Safe-area top spacer — native status bar shu yerda joylashadi (prototip bilan 1:1) */}
            <div style={{ height: "env(safe-area-inset-top, 16px)", flex: "none" }} />
            <SessionProvider profile={profile}>
              <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
            </SessionProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
