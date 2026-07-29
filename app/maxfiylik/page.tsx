import Link from "next/link";
import type { Metadata } from "next";
import { Screen } from "@/components/Screen";
import { BackIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati — MY LIGA",
  description:
    "MY LIGA maxfiylik siyosati: qanday shaxsiy ma'lumotlarni yig'amiz, nima uchun, qanday saqlaymiz va foydalanuvchi huquqlari.",
};

/**
 * Maxfiylik siyosati sahifasi.
 *
 * NEGA KERAK: Google OAuth'ni production'da yoqish uchun Google "OAuth consent
 * screen"da ochiq (public) maxfiylik siyosati havolasini talab qiladi. Bu sahifa
 * yig'iladigan ma'lumotlar, ulardan foydalanish va foydalanuvchi huquqlarini
 * tushuntiradi.
 */
export default function MaxfiylikPage() {
  return (
    <Screen>
      <div className="flex flex-col gap-5 px-5 pt-3 pb-10">
        <div className="flex items-center gap-3">
          <Link
            href="/profil"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--fg)" }}
          >
            <BackIcon size={18} />
          </Link>
          <div className="text-[17px] font-extrabold tracking-tight">Maxfiylik siyosati</div>
        </div>

        <div className="text-[12px]" style={{ color: "var(--fg-muted)" }}>
          Oxirgi yangilanish: 2026-yil 29-iyul
        </div>

        <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--fg-soft)" }}>
          MY LIGA (&laquo;biz&raquo;, &laquo;ilova&raquo;) &mdash; havaskor futbol ligalarini
          boshqarish platformasi. Ushbu maxfiylik siyosati siz ilovadan foydalanganingizda qanday
          shaxsiy ma&apos;lumotlarni yig&apos;ishimiz, ulardan qanday foydalanishimiz va ularni
          qanday himoya qilishimizni tushuntiradi. Ilovadan foydalanish orqali siz ushbu siyosatga
          rozilik bildirasiz.
        </p>

        <Section title="1. Qanday ma'lumotlarni yig'amiz">
          Google hisobingiz orqali kirganingizda Google bizga quyidagilarni uzatadi:{" "}
          <b>ismingiz</b>, <b>elektron pochta manzilingiz</b> va <b>profil rasmingiz</b> (agar
          mavjud bo&apos;lsa). Bundan tashqari siz ilovada o&apos;zingiz kiritgan ma&apos;lumotlar
          &mdash; masalan jamoa nomi, o&apos;yinchi ismi, o&apos;yin natijalari, gol va assistlar,
          hamda siz yuklagan rasmlar (avatar, jamoa logotipi) &mdash; saqlanadi.
        </Section>

        <Section title="2. Ma'lumotlardan qanday foydalanamiz">
          Yig&apos;ilgan ma&apos;lumotlar faqat quyidagi maqsadlarda ishlatiladi: hisobingizni
          yaratish va tizimga kirishingizni ta&apos;minlash; profilingizni va rolingizni (muxlis,
          murabbiy, administrator) ko&apos;rsatish; turnir, o&apos;yin va statistika
          ma&apos;lumotlarini yuritish; ilovani ishlatish va yaxshilash. Biz sizning
          ma&apos;lumotlaringizni reklama maqsadida ishlatmaymiz.
        </Section>

        <Section title="3. Ma'lumotlarni saqlash va himoya qilish">
          Ma&apos;lumotlaringiz Supabase (PostgreSQL ma&apos;lumotlar bazasi va fayl saqlash) xizmati
          orqali xavfsiz serverlarda saqlanadi. Kirish autentifikatsiyasi Google OAuth va xavfsiz
          sessiya cookie&apos;lari orqali amalga oshiriladi. Ma&apos;lumotlar bazasida qatordan-qatorga
          xavfsizlik siyosati (Row Level Security) qo&apos;llaniladi &mdash; ya&apos;ni har bir
          foydalanuvchi faqat o&apos;ziga ruxsat etilgan ma&apos;lumotlarni ko&apos;ra oladi.
        </Section>

        <Section title="4. Ma'lumotlarni uchinchi tomonlarga berish">
          Biz sizning shaxsiy ma&apos;lumotlaringizni <b>sotmaymiz</b> va uchinchi tomonlarga tijorat
          maqsadida bermaymiz. Ma&apos;lumotlar faqat ilovaning ishlashini ta&apos;minlovchi texnik
          xizmatlar (Google &mdash; kirish autentifikatsiyasi, Supabase &mdash; ma&apos;lumotlar
          bazasi va fayl saqlash) doirasida qayta ishlanadi. Qonun talab qilgan hollardagina
          ma&apos;lumot tegishli organlarga oshkor qilinishi mumkin.
        </Section>

        <Section title="5. Cookie'lar">
          Ilova faqat zarur (sessiya) cookie&apos;laridan foydalanadi. Ular tizimga kirgan holatingizni
          eslab qolish uchun kerak. Kuzatuv yoki reklama cookie&apos;laridan foydalanilmaydi.
        </Section>

        <Section title="6. Sizning huquqlaringiz">
          Siz istalgan vaqtda profil ma&apos;lumotlaringizni (ism, rasm, bildirishnoma sozlamalari)
          ilova ichida tahrirlashingiz mumkin. Hisobingizni va unga bog&apos;liq ma&apos;lumotlarni
          o&apos;chirishni istasangiz, biz bilan quyidagi manzil orqali bog&apos;laning &mdash; so&apos;rovingiz
          asosli muddat ichida bajariladi.
        </Section>

        <Section title="7. Bolalar maxfiyligi">
          Ilova havaskor futbol jamoalari a&apos;zolari uchun mo&apos;ljallangan. Agar siz voyaga
          yetmagan bo&apos;lsangiz, ilovadan ota-onangiz yoki vasiyingiz roziligi bilan foydalaning.
        </Section>

        <Section title="8. Siyosatga o'zgartirishlar">
          Biz ushbu maxfiylik siyosatini vaqti-vaqti bilan yangilashimiz mumkin. Muhim
          o&apos;zgarishlar bo&apos;lsa, yangilangan sana yuqorida ko&apos;rsatiladi. Ilovadan
          foydalanishni davom ettirish yangilangan siyosatga rozilik hisoblanadi.
        </Section>

        <Section title="9. Biz bilan bog'lanish">
          Maxfiylik yuzasidan savollaringiz yoki ma&apos;lumotni o&apos;chirish so&apos;rovlaringiz
          bo&apos;lsa, quyidagi manzilga yozing:{" "}
          <a
            href="mailto:kamronbekravshanov17@gmail.com"
            style={{ color: "#0E9F6E", fontWeight: 700 }}
          >
            kamronbekravshanov17@gmail.com
          </a>
        </Section>
      </div>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[14.5px] font-extrabold" style={{ color: "var(--fg)" }}>
        {title}
      </h2>
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-soft)" }}>
        {children}
      </p>
    </div>
  );
}
