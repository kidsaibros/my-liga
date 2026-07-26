"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Yorug'/qorong'i tema — faqat Profil sahifasidagi tugma orqali almashadi, tizim sozlamasiga ergashmaydi. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
