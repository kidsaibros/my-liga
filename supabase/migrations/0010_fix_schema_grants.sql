-- "permission denied for schema public" xatosini tuzatish.
-- Sabab: service_role (va postgres) uchun public sxemasi/jadvallariga standart
-- Supabase grant'lari yo'qolib qolgan (odatda restore/import yoki qo'lda REVOKE
-- natijasida yuzaga keladi). RLS bunga aloqasi yo'q — service_role RLS'ni chetlab
-- o'tadi, lekin GRANT darajasidagi ruxsat baribir kerak.
-- Bu skript Supabase'ning o'zi yangi loyiha yaratganda qo'yadigan standart
-- grant'larni qayta tiklaydi — xavfsiz, bir necha marta ishga tushirsa ham xato bermaydi.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all functions in schema public to postgres, service_role;

grant select on all tables in schema public to anon, authenticated;

alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant select on tables to anon, authenticated;
