"use client";

import { useEffect, useState } from "react";

/**
 * Jonli o'yin daqiqasi — `live_started_at`dan boshlab o'zi tiketadi (klientda).
 * Har soniya yangilanadi. Admin o'yinni to'xtatsa (status o'zgarsa), bu komponent
 * boshqa render qilinmaydi — ya'ni daqiqa to'xtaydi.
 *
 * `startedAt` bo'lmasa (eski o'yinlar) — qo'lda kiritilgan `fallback` daqiqa.
 */
export function LiveMinute({
  startedAt,
  fallback,
}: {
  startedAt: string | null;
  fallback?: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  let minute: number | null = null;
  if (startedAt) {
    minute = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60000));
  } else if (fallback != null) {
    minute = fallback;
  }

  if (minute === null) return null;
  return <span>{minute}&apos;</span>;
}
