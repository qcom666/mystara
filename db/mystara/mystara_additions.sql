-- =====================================================================
--  MYSTARA — дополнения к схеме (накатывать ПОСЛЕ mystara_schema.sql и mystara_seed.sql)
--    psql -d mystara -f mystara_additions.sql
--
--  Файл можно запускать повторно (IF NOT EXISTS / CREATE OR REPLACE).
--  Исходные mystara_schema.sql и mystara_seed.sql не изменялись.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
--  1. Подтверждение согласия на обработку персональных данных (152-ФЗ, ст. 9)
--     и пометка об удалении данных пользователя
-- ---------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_consent_at     timestamptz;  -- когда дано согласие
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_policy_version text;         -- на какую версию политики (напр. '2026-10-06')
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at             timestamptz;  -- когда данные удалены по запросу (см. anonymize_user)

-- ---------------------------------------------------------------------
--  2. Знак зодиака в профиле заполняется сам по дате рождения
--     (в схеме он "считается функцией zodiac_sign_for", но нигде не вызывался)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION profiles_set_zodiac() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.zodiac_sign_id := zodiac_sign_for(NEW.birth_date);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_zodiac ON profiles;
CREATE TRIGGER profiles_zodiac
    BEFORE INSERT OR UPDATE OF birth_date ON profiles
    FOR EACH ROW EXECUTE FUNCTION profiles_set_zodiac();

-- ---------------------------------------------------------------------
--  3. Удаление данных пользователя по его запросу / отзыву согласия
--
--     SELECT anonymize_user(123);
--
--     Удаляет всё личное: профили (имя, дата и место рождения), расклады и вытянутые
--     карты, события, показы рекламы, промокоды, права админа, комментарии в журнале
--     баланса. Строку users НЕ удаляет, а обезличивает (telegram_id -> -id, имя и
--     username стираются): на неё ссылаются платежи (ON DELETE RESTRICT), а платёжные
--     записи нужно хранить по требованиям налогового и бухгалтерского учёта.
--     Повторный вызов безопасен.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION anonymize_user(p_user_id bigint) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'user % not found', p_user_id;
    END IF;

    DELETE FROM readings          WHERE user_id = p_user_id;   -- reading_cards уйдут каскадом
    DELETE FROM profiles          WHERE user_id = p_user_id;
    DELETE FROM events            WHERE user_id = p_user_id;
    DELETE FROM ad_impressions    WHERE user_id = p_user_id;
    DELETE FROM promo_activations WHERE user_id = p_user_id;
    DELETE FROM admins            WHERE user_id = p_user_id;
    UPDATE balance_transactions   SET comment = NULL WHERE user_id = p_user_id;  -- свободный текст мог содержать личное

    UPDATE users
       SET telegram_id        = -id,        -- уникально и не пересекается с настоящими id пользователей
           username           = NULL,
           first_name         = NULL,
           language_code      = NULL,
           referrer_id        = NULL,
           notify_daily       = false,
           privacy_consent_at = NULL,
           privacy_policy_version = NULL,
           deleted_at         = COALESCE(deleted_at, now())
     WHERE id = p_user_id;
END;
$$;

COMMIT;
