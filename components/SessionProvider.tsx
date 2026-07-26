"use client";

import { createContext, useContext } from "react";
import type { SessionProfile } from "@/lib/auth";

const SessionContext = createContext<SessionProfile | null>(null);

export function SessionProvider({
  profile,
  children,
}: {
  profile: SessionProfile | null;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={profile}>{children}</SessionContext.Provider>;
}

/** BottomNav kabi client komponentlar joriy foydalanuvchi rolini shu orqali oladi. */
export function useSessionProfile() {
  return useContext(SessionContext);
}
