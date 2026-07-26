"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead } from "@/lib/actions/notifications";
import { BellIcon } from "@/components/icons";
import type { Notification, TeamCreatedPayload } from "@/lib/types";

/** Admin panel qo'ng'irog'i — yangi jamoa yaratilganda Supabase Realtime orqali jonli xabar. */
export function NotificationsBell({ onNavigate }: { onNavigate?: () => void }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("*")
      .eq("recipient_role", "super_admin")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setItems((data ?? []) as Notification[]));

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: "recipient_role=eq.super_admin" },
        (payload) => {
          setItems((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function handleClick(n: Notification) {
    if (!n.read) {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setOpen(false);
    onNavigate?.();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Xabarlar"
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-[#EDF4EF] transition hover:bg-white/[0.16]"
      >
        <BellIcon size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9px] font-extrabold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 flex max-h-80 w-72 flex-col gap-1.5 overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0B0F0C] p-2.5 shadow-2xl">
            {items.length === 0 && (
              <div className="p-4 text-center text-[11.5px] text-[rgba(237,244,239,0.4)]">Xabarlar yo&apos;q</div>
            )}
            {items.map((n) => {
              const payload = n.payload as Partial<TeamCreatedPayload>;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left"
                  style={{ background: n.read ? "transparent" : "rgba(47,216,113,.08)" }}
                >
                  <span className="text-[12px] font-bold">Yangi jamoa: {payload.team_name ?? "—"}</span>
                  <span className="text-[10.5px] text-[rgba(237,244,239,0.45)]">
                    Murabbiy: {payload.coach_name ?? "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
