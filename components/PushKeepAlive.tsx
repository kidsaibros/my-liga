"use client";

import { useEffect } from "react";
import { enablePush, pushSupported } from "@/lib/push-client";

/**
 * Push obunani "tirik" saqlaydi.
 *
 * MUAMMO: obuna vaqti-vaqti bilan tushib qolishi mumkin (brauzer kalitni
 * yangilaydi, Android batareya optimizatsiyasi bekor qiladi va h.k.). Bunda
 * foydalanuvchi Sozlamalardan qo'lda qayta yoqmasa, xabar kelmay qoladi.
 *
 * YECHIM: ilova har ochilganda — agar foydalanuvchi allaqachon ruxsat bergan
 * bo'lsa — obunani jimgina qayta yozamiz. So'rov (prompt) chiqmaydi, chunki
 * faqat `Notification.permission === "granted"` bo'lganda ishlaydi. Shunday
 * qilib foydalanuvchi hech qachon qo'lda yoqib-o'chirmaydi.
 */
export function PushKeepAlive() {
  useEffect(() => {
    if (!pushSupported()) return;
    if (Notification.permission !== "granted") return;
    // Jimgina yangilaymiz — natijasi muhim emas, xato bo'lsa e'tibor bermaymiz.
    enablePush().catch(() => {});
  }, []);

  return null;
}
