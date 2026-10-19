-- Адреса e-mail хранятся в нижнем регистре и без пробелов по краям: вход, регистрация и восстановление
-- пароля не зависят от того, как адрес набран. Адрес, который после приведения совпал бы с адресом другого
-- аккаунта, не меняется: такие пары разбираются вручную (вход по ним всё равно работает без учёта регистра).
UPDATE "User" AS u
SET "email" = lower(btrim(u."email"))
WHERE u."email" IS NOT NULL
  AND u."email" <> lower(btrim(u."email"))
  AND NOT EXISTS (
    SELECT 1 FROM "User" AS o
    WHERE o."id" <> u."id" AND o."email" IS NOT NULL AND lower(btrim(o."email")) = lower(btrim(u."email"))
  );
