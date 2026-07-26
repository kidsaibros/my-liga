-- "permission denied for table tournaments" (va boshqa jadvallarda ham) — sabab:
-- 0010_fix_schema_grants.sql faqat SELECT huquqini anon/authenticated'ga berdi,
-- INSERT/UPDATE/DELETE esa faqat postgres/service_role'da qoldi. RLS policy'lar
-- (masalan admin_write) to'g'ri ishlayapti, lekin Postgres avval jadval darajasidagi
-- GRANT'ni tekshiradi — u yo'q bo'lsa RLS'gacha yetib bormay xato beradi.
-- Bu xavfsiz: RLS baribir yoqilgan, shuning uchun authenticated foydalanuvchi
-- faqat policy ruxsat bergan qatorlarni yoza oladi (masalan, faqat is_admin() bo'lsa).

grant insert, update, delete on all tables in schema public to authenticated;

alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
