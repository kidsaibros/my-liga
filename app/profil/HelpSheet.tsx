"use client";

import { Sheet } from "@/components/ui";
import { TelegramIcon, PhoneIcon } from "@/components/icons";
import type { AppSettings } from "@/lib/types";

export function HelpSheet({ settings, onClose }: { settings: AppSettings | null; onClose: () => void }) {
  return (
    <Sheet title="Yordam" onClose={onClose}>
      <div className="flex flex-col gap-2.5 pb-2">
        {settings?.telegram_support_url ? (
          <a
            href={settings.telegram_support_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[13.5px] font-bold"
            style={{ background: "#0E9F6E", color: "#fff" }}
          >
            <TelegramIcon size={20} />
            Telegram orqali bog&apos;lanish
          </a>
        ) : null}

        {settings?.phone_support ? (
          <a
            href={`tel:${settings.phone_support}`}
            className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-[13.5px] font-bold"
            style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--fg)" }}
          >
            <PhoneIcon size={18} />
            Qo&apos;ng&apos;iroq qilish — {settings.phone_support}
          </a>
        ) : null}

        {!settings?.telegram_support_url && !settings?.phone_support && (
          <div
            className="rounded-2xl border p-5 text-center text-[12.5px]"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            Qo&apos;llab-quvvatlash ma&apos;lumotlari hali kiritilmagan
          </div>
        )}
      </div>
    </Sheet>
  );
}
