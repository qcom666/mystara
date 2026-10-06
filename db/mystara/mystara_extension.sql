-- =====================================================================
--  MYSTARA — расширение схемы до полной базы проекта
--  Порядок: mystara_schema.sql -> mystara_seed.sql -> mystara_additions.sql
--           -> mystara_extension.sql (этот файл) -> mystara_content.sql
--
--  Идемпотентно: можно запускать повторно. Исходные файлы не меняются;
--  всё, что нужно изменить в их таблицах, делается здесь через ALTER.
--
--  Что добавляет:
--    1. Вход через сайт: e-mail/пароль, Google, подтверждение почты
--    2. Юридическое: версии документов, журнал согласий, запросы на удаление данных
--    3. Контент для двух языков (RU/EN) и справочники астрологии
--    4. Расклады: ИИ-толкования, избранное, натальные карты, расчёты нумерологии/астрологии
--    5. Деньги: ЮKassa (RUB) и Telegram Stars, возвраты, чеки самозанятого,
--       журнал уведомлений платёжных систем, выдача покупки и возврат функциями
--    6. Поддержка, журнал действий, настройки
--    7. Аналитические представления и роль только для чтения
--
--  Договорённость по суммам: XTR (Звёзды) — целые звёзды; RUB — в КОПЕЙКАХ
--  (1000 ₽ = 100000).
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- =====================================================================
--  1. ВХОД НА САЙТЕ (e-mail, Google) РЯДОМ С TELEGRAM
-- =====================================================================

-- Пользователь сайта может не иметь Telegram: telegram_id больше не обязателен,
-- но должен быть хотя бы один способ опознать человека.
ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email             text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash     text;          -- bcrypt; пароль не храним
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name      text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url        text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale            text NOT NULL DEFAULT 'ru' CHECK (locale IN ('ru', 'en'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS natal_credits     integer NOT NULL DEFAULT 0 CHECK (natal_credits >= 0);  -- оплаченные расчёты натальной карты
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at        timestamptz NOT NULL DEFAULT now();

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_identity_chk;
ALTER TABLE users ADD CONSTRAINT users_identity_chk CHECK (telegram_id IS NOT NULL OR email IS NOT NULL);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_format_chk;
ALTER TABLE users ADD CONSTRAINT users_email_format_chk CHECK (email IS NULL OR email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (lower(email)) WHERE email IS NOT NULL;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Вход через Google (токены не храним — для входа они не нужны)
CREATE TABLE IF NOT EXISTS auth_accounts (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider            text   NOT NULL CHECK (provider IN ('google')),
    provider_account_id text   NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS auth_accounts_user_idx ON auth_accounts (user_id);

-- Подтверждение почты и сброс пароля. В базе только хеш токена
CREATE TABLE IF NOT EXISTS verification_tokens (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint REFERENCES users (id) ON DELETE CASCADE,
    email      text   NOT NULL,
    purpose    text   NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
    token_hash text   NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS verification_tokens_user_idx ON verification_tokens (user_id);

-- =====================================================================
--  2. ЮРИДИЧЕСКОЕ (152-ФЗ, закон о защите прав потребителей)
-- =====================================================================

-- Версии документов на сайте. Совпадают с lib/legal/operator.ts
CREATE TABLE IF NOT EXISTS legal_documents (
    id             smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind           text NOT NULL CHECK (kind IN ('privacy_policy', 'consent', 'offer')),
    version        text NOT NULL,                        -- '2026-10-06'
    effective_from date NOT NULL,
    title_ru       text NOT NULL,
    title_en       text NOT NULL,
    url_path       text NOT NULL,                        -- '/privacy'
    is_current     boolean NOT NULL DEFAULT false,
    UNIQUE (kind, version)
);
CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_current_uq ON legal_documents (kind) WHERE is_current;

-- Журнал согласий. Только добавляется (строки не изменяются и не удаляются): это доказательство согласия
CREATE TABLE IF NOT EXISTS user_consents (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    document_kind    text   NOT NULL CHECK (document_kind IN ('privacy_policy', 'consent', 'offer')),
    document_version text   NOT NULL,
    action           text   NOT NULL CHECK (action IN ('given', 'withdrawn')),
    source           text   NOT NULL CHECK (source IN ('telegram', 'web', 'email', 'admin')),
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_consents_user_idx ON user_consents (user_id, created_at DESC);

-- Запросы пользователей: доступ к данным, исправление, удаление, отзыв согласия.
-- Срок ответа по закону — 10 рабочих дней, на удаление/отзыв — до 30 дней; due_at = 30 дней
CREATE TABLE IF NOT EXISTS data_requests (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     bigint REFERENCES users (id) ON DELETE SET NULL,
    kind        text   NOT NULL CHECK (kind IN ('access', 'rectify', 'delete', 'withdraw_consent', 'other')),
    channel     text   NOT NULL CHECK (channel IN ('email', 'telegram', 'web')),
    status      text   NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done', 'rejected')),
    received_at timestamptz NOT NULL DEFAULT now(),
    due_at      timestamptz NOT NULL DEFAULT now() + interval '30 days',
    done_at     timestamptz,
    note        text
);
CREATE INDEX IF NOT EXISTS data_requests_open_idx ON data_requests (due_at) WHERE status IN ('new', 'in_progress');

-- =====================================================================
--  3. КОНТЕНТ НА ДВУХ ЯЗЫКАХ И СПРАВОЧНИКИ АСТРОЛОГИИ
--     (русские столбцы исходной схемы остаются как есть, английские добавлены рядом)
-- =====================================================================

-- Карты таро
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS slug             text;                 -- the-fool, ace-of-cups (как в коде сайта)
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS name_en          text;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS keywords_ru      text[] NOT NULL DEFAULT '{}';
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS keywords_en      text[] NOT NULL DEFAULT '{}';
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS description_ru   text;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS description_en   text;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS meaning_upright_en  text;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS meaning_reversed_en text;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS meanings_ru      jsonb NOT NULL DEFAULT '{}';   -- upright, reversed, love, career, finance, spiritual
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS meanings_en      jsonb NOT NULL DEFAULT '{}';
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS yes_no           text CHECK (yes_no IN ('yes', 'no', 'maybe', 'yes-if-cautious'));
CREATE UNIQUE INDEX IF NOT EXISTS tarot_cards_slug_uq ON tarot_cards (slug) WHERE slug IS NOT NULL;

-- Расклады: slug как в коде сайта, английские тексты и подробные позиции
ALTER TABLE tarot_spreads ADD COLUMN IF NOT EXISTS slug             text;
ALTER TABLE tarot_spreads ADD COLUMN IF NOT EXISTS name_en          text;
ALTER TABLE tarot_spreads ADD COLUMN IF NOT EXISTS description_en   text;
ALTER TABLE tarot_spreads ADD COLUMN IF NOT EXISTS category         text CHECK (category IN ('general', 'love', 'career', 'decision', 'yes-no'));
ALTER TABLE tarot_spreads ADD COLUMN IF NOT EXISTS difficulty       text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE tarot_spreads ADD COLUMN IF NOT EXISTS position_details jsonb NOT NULL DEFAULT '[]';  -- [{id, order, label_ru, label_en, meaning_ru, meaning_en}]
CREATE UNIQUE INDEX IF NOT EXISTS tarot_spreads_slug_uq ON tarot_spreads (slug) WHERE slug IS NOT NULL;

-- Знаки зодиака
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS name_en         text;
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS modality        text CHECK (modality IN ('cardinal', 'fixed', 'mutable'));
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS ruling_planet   text;                 -- id планеты из таблицы planets
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS keywords_ru     text[] NOT NULL DEFAULT '{}';
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS keywords_en     text[] NOT NULL DEFAULT '{}';
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS description_ru  text;
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS description_en  text;
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS strengths_ru    text[] NOT NULL DEFAULT '{}';
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS strengths_en    text[] NOT NULL DEFAULT '{}';
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS challenges_ru   text[] NOT NULL DEFAULT '{}';
ALTER TABLE zodiac_signs ADD COLUMN IF NOT EXISTS challenges_en   text[] NOT NULL DEFAULT '{}';

-- Нумерология: типы чисел как в приложении (число жизненного пути, дня рождения, выражения, души, личности, зрелости)
ALTER TABLE numerology_meanings DROP CONSTRAINT IF EXISTS numerology_meanings_kind_check;
ALTER TABLE numerology_meanings ADD CONSTRAINT numerology_meanings_kind_check
    CHECK (kind IN ('life_path', 'birthday', 'destiny', 'soul', 'personality', 'maturity', 'personal_year'));
ALTER TABLE numerology_meanings ADD COLUMN IF NOT EXISTS title_en       text;
ALTER TABLE numerology_meanings ADD COLUMN IF NOT EXISTS body_en        text;
ALTER TABLE numerology_meanings ADD COLUMN IF NOT EXISTS keywords_ru    text[] NOT NULL DEFAULT '{}';
ALTER TABLE numerology_meanings ADD COLUMN IF NOT EXISTS keywords_en    text[] NOT NULL DEFAULT '{}';
ALTER TABLE numerology_meanings ADD COLUMN IF NOT EXISTS strengths_ru   text[] NOT NULL DEFAULT '{}';
ALTER TABLE numerology_meanings ADD COLUMN IF NOT EXISTS strengths_en   text[] NOT NULL DEFAULT '{}';
ALTER TABLE numerology_meanings ADD COLUMN IF NOT EXISTS challenges_ru  text[] NOT NULL DEFAULT '{}';
ALTER TABLE numerology_meanings ADD COLUMN IF NOT EXISTS challenges_en  text[] NOT NULL DEFAULT '{}';

-- Справочники астрологии и натальной карты
CREATE TABLE IF NOT EXISTS planets (
    id        text PRIMARY KEY,                           -- sun, moon, mercury ...
    symbol    text NOT NULL,
    name_ru   text NOT NULL,
    name_en   text NOT NULL,
    nature_ru text NOT NULL,
    nature_en text NOT NULL
);

CREATE TABLE IF NOT EXISTS houses (
    number   smallint PRIMARY KEY CHECK (number BETWEEN 1 AND 12),
    title_ru text NOT NULL,
    title_en text NOT NULL,
    theme_ru text NOT NULL,
    theme_en text NOT NULL
);

CREATE TABLE IF NOT EXISTS aspects (
    type       text PRIMARY KEY,                          -- conjunction, sextile, square, trine, opposition
    angle_deg  smallint NOT NULL,
    orb_deg    smallint NOT NULL,
    symbol     text NOT NULL,
    label_ru   text NOT NULL,
    label_en   text NOT NULL,
    meaning_ru text NOT NULL,
    meaning_en text NOT NULL
);

-- Дневная / ночная карта (секта, эллинистическая астрология)
CREATE TABLE IF NOT EXISTS sect_profiles (
    id              text PRIMARY KEY CHECK (id IN ('day', 'night')),
    title_ru        text NOT NULL,
    title_en        text NOT NULL,
    description_ru  text NOT NULL,
    description_en  text NOT NULL,
    favored_planets text[] NOT NULL DEFAULT '{}',         -- id планет
    keynote_ru      text NOT NULL,
    keynote_en      text NOT NULL
);

-- Города для выбора места рождения: свой список, без внешних сервисов геокодирования
CREATE TABLE IF NOT EXISTS cities (
    id         text PRIMARY KEY,
    name_ru    text NOT NULL,
    name_en    text NOT NULL,
    country_ru text NOT NULL,
    country_en text NOT NULL,
    latitude   numeric(8, 5) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude  numeric(8, 5) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    timezone   text NOT NULL                              -- IANA, например Europe/Moscow
);

-- «На кого вы похожи»: развлекательный факт про знаменитостей
CREATE TABLE IF NOT EXISTS celebrities (
    id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name_en        text NOT NULL UNIQUE,
    name_ru        text NOT NULL,
    birth_date     date NOT NULL,
    zodiac_sign_id smallint REFERENCES zodiac_signs (id),  -- считается триггером по дате рождения
    archetype_tags text[] NOT NULL DEFAULT '{}'
);
DROP TRIGGER IF EXISTS celebrities_zodiac ON celebrities;
CREATE TRIGGER celebrities_zodiac BEFORE INSERT OR UPDATE OF birth_date ON celebrities
    FOR EACH ROW EXECUTE FUNCTION profiles_set_zodiac();

-- Какие архетипы связаны со старшими арканами (для «двойника»)
CREATE TABLE IF NOT EXISTS card_archetypes (
    card_id smallint NOT NULL REFERENCES tarot_cards (id) ON DELETE CASCADE,
    tag     text     NOT NULL,
    PRIMARY KEY (card_id, tag)
);

-- =====================================================================
--  4. РАСКЛАДЫ: ИИ-ТОЛКОВАНИЯ, ИЗБРАННОЕ, НАТАЛЬНЫЕ КАРТЫ
-- =====================================================================

ALTER TABLE readings DROP CONSTRAINT IF EXISTS readings_kind_check;
ALTER TABLE readings ADD CONSTRAINT readings_kind_check
    CHECK (kind IN ('tarot', 'card_of_day', 'natal_chart', 'numerology', 'astrology', 'compatibility', 'personal_horoscope'));
ALTER TABLE readings ADD COLUMN IF NOT EXISTS locale      text CHECK (locale IN ('ru', 'en'));
ALTER TABLE readings ADD COLUMN IF NOT EXISTS seed        text;                      -- чем вытянуты карты (для проверки, не для повтора)
ALTER TABLE readings ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Толкование, которое выдал алгоритм или нейросеть
CREATE TABLE IF NOT EXISTS ai_interpretations (
    reading_id           bigint PRIMARY KEY REFERENCES readings (id) ON DELETE CASCADE,
    provider             text   NOT NULL,                        -- mock, anthropic ...
    summary              text   NOT NULL,
    overall              text   NOT NULL,
    themes               text[] NOT NULL DEFAULT '{}',
    advice               text[] NOT NULL DEFAULT '{}',
    challenges           text[] NOT NULL DEFAULT '{}',
    card_interpretations jsonb  NOT NULL DEFAULT '[]',
    generated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind       text   NOT NULL CHECK (kind IN ('card', 'spread')),
    target     text   NOT NULL,                                  -- slug карты или расклада
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, kind, target)
);

-- Данные натальной карты: место и время рождения нужны отдельно от результата
CREATE TABLE IF NOT EXISTS natal_charts (
    reading_id       bigint PRIMARY KEY REFERENCES readings (id) ON DELETE CASCADE,
    birth_instant_utc timestamptz NOT NULL,
    has_exact_time   boolean NOT NULL,                           -- нет времени — дома, асцендент и MC не считаем
    place_label      text,
    latitude         numeric(8, 5) NOT NULL,
    longitude        numeric(8, 5) NOT NULL,
    timezone         text NOT NULL,
    chart            jsonb NOT NULL                              -- планеты, асцендент, дома, аспекты
);

-- =====================================================================
--  5. ДЕНЬГИ: ЮKASSA (RUB) + TELEGRAM STARS
-- =====================================================================

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE payments ADD CONSTRAINT payments_provider_check CHECK (provider IN ('telegram_stars', 'yookassa', 'manual'));
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_currency_check;
ALTER TABLE payments ADD CONSTRAINT payments_currency_check CHECK (currency IN ('XTR', 'RUB'));
COMMENT ON COLUMN payments.amount IS 'XTR — целые звёзды; RUB — в копейках (1000 ₽ = 100000)';

-- Два вида внутренних «монет»: кристаллы бота и оплаченные расчёты натальной карты
ALTER TABLE products ADD COLUMN IF NOT EXISTS credit_kind    text NOT NULL DEFAULT 'crystals' CHECK (credit_kind IN ('crystals', 'natal_chart'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_rub_kop  integer CHECK (price_rub_kop IS NULL OR price_rub_kop > 0);   -- цена на сайте, в копейках
ALTER TABLE balance_transactions ADD COLUMN IF NOT EXISTS credit_kind text NOT NULL DEFAULT 'crystals' CHECK (credit_kind IN ('crystals', 'natal_chart'));

CREATE OR REPLACE FUNCTION apply_balance_transaction() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.credit_kind = 'natal_chart' THEN
        UPDATE users SET natal_credits = natal_credits + NEW.amount WHERE id = NEW.user_id;
    ELSE
        UPDATE users SET balance = balance + NEW.amount WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Одна оплата — одно начисление, даже если платёжная система пришлёт уведомление дважды
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_payment_uq ON subscriptions (payment_id) WHERE payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS balance_tx_purchase_uq ON balance_transactions (payment_id) WHERE reason = 'purchase' AND payment_id IS NOT NULL;

-- Возвраты
CREATE TABLE IF NOT EXISTS refunds (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id         bigint  NOT NULL REFERENCES payments (id) ON DELETE RESTRICT,
    amount             integer NOT NULL CHECK (amount > 0),         -- в тех же единицах, что payments.amount
    reason             text,
    status             text    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'failed')),
    provider_refund_id text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    done_at            timestamptz
);
CREATE INDEX IF NOT EXISTS refunds_payment_idx ON refunds (payment_id);

-- Чеки самозанятого («Мой налог»): по каждой оплате и возврату
CREATE TABLE IF NOT EXISTS receipts (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id     bigint  NOT NULL REFERENCES payments (id) ON DELETE RESTRICT,
    kind           text    NOT NULL DEFAULT 'income' CHECK (kind IN ('income', 'refund')),
    status         text    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'canceled', 'failed')),
    amount_kop     integer NOT NULL CHECK (amount_kop > 0),
    receipt_number text,
    receipt_url    text,
    issued_at      timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS receipts_payment_idx ON receipts (payment_id);
CREATE INDEX IF NOT EXISTS receipts_pending_idx ON receipts (created_at) WHERE status = 'pending';

-- Входящие уведомления платёжных систем: сначала пишем сюда, потом обрабатываем.
-- UNIQUE (provider, event_id) не даёт обработать одно уведомление дважды
CREATE TABLE IF NOT EXISTS webhook_events (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider     text   NOT NULL CHECK (provider IN ('telegram_stars', 'yookassa')),
    event_id     text   NOT NULL,
    event_type   text,
    payload      jsonb  NOT NULL,
    received_at  timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    error        text,
    UNIQUE (provider, event_id)
);
CREATE INDEX IF NOT EXISTS webhook_events_unprocessed_idx ON webhook_events (received_at) WHERE processed_at IS NULL;

-- Выдача купленного после подтверждённой оплаты. Безопасна при повторном вызове.
--   SELECT fulfill_payment(42);   -- 'fulfilled' | 'already_fulfilled' | 'not_found' | 'invalid_status'
CREATE OR REPLACE FUNCTION fulfill_payment(p_payment_id bigint) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
    pay  payments%ROWTYPE;
    prod products%ROWTYPE;
    base timestamptz;
BEGIN
    SELECT * INTO pay FROM payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN RETURN 'not_found'; END IF;
    IF pay.status NOT IN ('pending', 'paid') THEN RETURN 'invalid_status'; END IF;

    IF EXISTS (SELECT 1 FROM subscriptions WHERE payment_id = pay.id)
       OR EXISTS (SELECT 1 FROM balance_transactions WHERE payment_id = pay.id AND reason = 'purchase') THEN
        RETURN 'already_fulfilled';
    END IF;

    SELECT * INTO prod FROM products WHERE id = pay.product_id;
    UPDATE payments SET status = 'paid', paid_at = COALESCE(paid_at, now()) WHERE id = pay.id;

    IF prod.kind = 'credits' THEN
        INSERT INTO balance_transactions (user_id, amount, reason, payment_id, credit_kind)
        VALUES (pay.user_id, prod.credits, 'purchase', pay.id, prod.credit_kind);
    ELSE
        -- продление идёт после уже оплаченного периода, а не поверх него
        SELECT GREATEST(now(), COALESCE(max(expires_at), now())) INTO base
          FROM subscriptions WHERE user_id = pay.user_id AND revoked_at IS NULL;
        INSERT INTO subscriptions (user_id, product_id, payment_id, starts_at, expires_at, auto_renew)
        VALUES (pay.user_id, prod.id, pay.id, base, base + make_interval(days => prod.duration_days),
                pay.provider = 'telegram_stars');
    END IF;
    RETURN 'fulfilled';
END;
$$;

-- Возврат: платёж -> refunded, подписка отзывается, а выданные монеты снимаются
-- в пределах того, что ещё осталось на балансе. Деньги возвращает платёжная система.
--   SELECT refund_payment(42, 'по заявлению пользователя');
CREATE OR REPLACE FUNCTION refund_payment(p_payment_id bigint, p_reason text DEFAULT NULL) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
    pay   payments%ROWTYPE;
    prod  products%ROWTYPE;
    have  integer;
    take  integer;
BEGIN
    SELECT * INTO pay FROM payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN RETURN 'not_found'; END IF;
    IF pay.status = 'refunded' THEN RETURN 'already_refunded'; END IF;
    IF pay.status <> 'paid' THEN RETURN 'invalid_status'; END IF;

    SELECT * INTO prod FROM products WHERE id = pay.product_id;

    UPDATE payments SET status = 'refunded', refunded_at = now() WHERE id = pay.id;
    INSERT INTO refunds (payment_id, amount, reason, status, done_at) VALUES (pay.id, pay.amount, p_reason, 'done', now());

    IF prod.kind = 'subscription' THEN
        UPDATE subscriptions SET revoked_at = now() WHERE payment_id = pay.id AND revoked_at IS NULL;
    ELSE
        SELECT CASE WHEN prod.credit_kind = 'natal_chart' THEN natal_credits ELSE balance END INTO have FROM users WHERE id = pay.user_id;
        take := LEAST(prod.credits, have);
        IF take > 0 THEN
            INSERT INTO balance_transactions (user_id, amount, reason, payment_id, credit_kind, comment)
            VALUES (pay.user_id, -take, 'refund', pay.id, prod.credit_kind, 'возврат платежа');
        END IF;
    END IF;
    RETURN 'refunded';
END;
$$;

-- =====================================================================
--  6. ПОДДЕРЖКА, ЖУРНАЛ ДЕЙСТВИЙ, НАСТРОЙКИ
-- =====================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint REFERENCES users (id) ON DELETE SET NULL,
    channel    text   NOT NULL CHECK (channel IN ('telegram', 'email', 'web')),
    subject    text   NOT NULL,
    status     text   NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'solved', 'closed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    closed_at  timestamptz
);
CREATE INDEX IF NOT EXISTS support_tickets_open_idx ON support_tickets (created_at) WHERE status IN ('open', 'pending');
DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS support_messages (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id     bigint NOT NULL REFERENCES support_tickets (id) ON DELETE CASCADE,
    author        text   NOT NULL CHECK (author IN ('user', 'staff')),
    staff_user_id bigint REFERENCES users (id) ON DELETE SET NULL,
    body          text   NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_messages_ticket_idx ON support_messages (ticket_id, created_at);

-- Кто, что и когда менял руками (админка, возвраты, удаление данных)
CREATE TABLE IF NOT EXISTS audit_log (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id bigint REFERENCES users (id) ON DELETE SET NULL,
    action        text   NOT NULL,                  -- refund, anonymize_user, grant_subscription ...
    entity        text,                             -- payments, users ...
    entity_id     text,
    details       jsonb  NOT NULL DEFAULT '{}',
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_time_idx   ON audit_log (created_at DESC);

-- Настройки, которые меняются без выкладки кода
CREATE TABLE IF NOT EXISTS app_settings (
    key         text PRIMARY KEY,
    value       jsonb NOT NULL,
    description text,
    updated_at  timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS app_settings_updated_at ON app_settings;
CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
--  7. ОБНОВЛЁННОЕ УДАЛЕНИЕ ДАННЫХ (учитывает новые таблицы)
-- =====================================================================
CREATE OR REPLACE FUNCTION anonymize_user(p_user_id bigint) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'user % not found', p_user_id;
    END IF;

    DELETE FROM readings            WHERE user_id = p_user_id;   -- карты, натальные карты и ИИ-толкования уйдут каскадом
    DELETE FROM profiles            WHERE user_id = p_user_id;
    DELETE FROM favorites           WHERE user_id = p_user_id;
    DELETE FROM events              WHERE user_id = p_user_id;
    DELETE FROM ad_impressions      WHERE user_id = p_user_id;
    DELETE FROM promo_activations   WHERE user_id = p_user_id;
    DELETE FROM admins              WHERE user_id = p_user_id;
    DELETE FROM auth_accounts       WHERE user_id = p_user_id;
    DELETE FROM verification_tokens WHERE user_id = p_user_id;
    UPDATE balance_transactions     SET comment = NULL WHERE user_id = p_user_id;
    UPDATE support_messages         SET body = '[удалено по запросу пользователя]'
     WHERE ticket_id IN (SELECT id FROM support_tickets WHERE user_id = p_user_id);

    -- журнал согласий не стираем (это доказательство), добавляем отзыв, если согласие было
    INSERT INTO user_consents (user_id, document_kind, document_version, action, source)
    SELECT p_user_id, 'consent', COALESCE(privacy_policy_version, 'unknown'), 'withdrawn', 'admin'
      FROM users WHERE id = p_user_id AND privacy_consent_at IS NOT NULL;

    -- строку пользователя оставляем обезличенной: на неё ссылаются платежи (ON DELETE RESTRICT),
    -- а платёжные записи нужно хранить по требованиям налогового и бухгалтерского учёта
    UPDATE users
       SET telegram_id            = -id,           -- уникально и не пересекается с настоящими id
           username               = NULL,
           first_name             = NULL,
           language_code          = NULL,
           email                  = NULL,
           email_verified_at      = NULL,
           password_hash          = NULL,
           display_name           = NULL,
           avatar_url             = NULL,
           referrer_id            = NULL,
           notify_daily           = false,
           privacy_consent_at     = NULL,
           privacy_policy_version = NULL,
           deleted_at             = COALESCE(deleted_at, now())
     WHERE id = p_user_id;
END;
$$;

-- =====================================================================
--  8. НАЧАЛЬНЫЕ ДАННЫЕ: ДОКУМЕНТЫ, ТОВАРЫ, НАСТРОЙКИ
-- =====================================================================

INSERT INTO legal_documents (kind, version, effective_from, title_ru, title_en, url_path, is_current) VALUES
    ('privacy_policy', '2026-09-26', '2026-09-26', 'Политика конфиденциальности', 'Privacy Policy', '/privacy', false),
    ('privacy_policy', '2026-10-06', '2026-10-06', 'Политика конфиденциальности', 'Privacy Policy', '/privacy', true),
    ('consent',        '2026-09-26', '2026-09-26', 'Согласие на обработку персональных данных', 'Consent to the Processing of Personal Data', '/consent', false),
    ('consent',        '2026-10-06', '2026-10-06', 'Согласие на обработку персональных данных', 'Consent to the Processing of Personal Data', '/consent', true),
    ('offer',          '2026-10-03', '2026-10-03', 'Публичная оферта', 'Public Offer', '/offer', false),
    ('offer',          '2026-10-06', '2026-10-06', 'Публичная оферта (пользовательское соглашение)', 'Public Offer (Terms of Use)', '/offer', true)
ON CONFLICT (kind, version) DO NOTHING;

-- Товары сайта: цены те же, что на странице тарифов и в оферте
INSERT INTO products (code, kind, title, description, credits, credit_kind, price_stars, price_rub_kop, sort_order) VALUES
    ('natal_pack_3', 'credits', 'Натальная карта — 3 расчёта', 'Пакет из 3 построений натальной карты', 3, 'natal_chart', 500, 100000, 5)
ON CONFLICT (code) DO UPDATE
   SET title = EXCLUDED.title, description = EXCLUDED.description, credits = EXCLUDED.credits,
       credit_kind = EXCLUDED.credit_kind, price_stars = EXCLUDED.price_stars, price_rub_kop = EXCLUDED.price_rub_kop;
UPDATE products SET price_rub_kop = 30000 WHERE code = 'sub_month' AND price_rub_kop IS DISTINCT FROM 30000;  -- Premium: 300 ₽ в месяц

INSERT INTO app_settings (key, value, description) VALUES
    ('free_readings_per_day',        '3',     'Сколько бесплатных раскладов в сутки (как в коде: PLAN_POLICIES.free)'),
    ('natal_pack_credits',           '3',     'Сколько расчётов натальной карты в пакете'),
    ('natal_chart_free_for_testing', 'true',  'Временно: натальная карта бесплатна (выключить перед запуском оплаты)'),
    ('premium_price_rub_kop',        '30000', 'Цена Premium в месяц, копейки')
ON CONFLICT (key) DO NOTHING;

-- =====================================================================
--  9. АНАЛИТИЧЕСКИЕ ПРЕДСТАВЛЕНИЯ
-- =====================================================================

CREATE OR REPLACE VIEW v_revenue_daily AS
SELECT date_trunc('day', paid_at)::date AS day,
       provider,
       currency,
       count(*)                          AS payments,
       sum(amount)                       AS amount_sum      -- XTR: звёзды, RUB: копейки
FROM payments
WHERE status = 'paid'
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW v_funnel_daily AS
SELECT date_trunc('day', created_at)::date AS day,
       name,
       count(*)                            AS events,
       count(DISTINCT user_id)             AS users
FROM events
GROUP BY 1, 2;

CREATE OR REPLACE VIEW v_active_subscriptions AS
SELECT user_id, telegram_id, premium_until FROM user_premium WHERE is_premium;

CREATE OR REPLACE VIEW v_data_requests_open AS
SELECT id, user_id, kind, channel, status, received_at, due_at,
       (due_at::date - now()::date) AS days_left
FROM data_requests
WHERE status IN ('new', 'in_progress')
ORDER BY due_at;

CREATE OR REPLACE VIEW v_user_overview AS
SELECT u.id,
       u.telegram_id,
       u.username,
       u.email,
       u.locale,
       u.balance,
       u.natal_credits,
       up.is_premium,
       up.premium_until,
       (SELECT count(*) FROM readings r WHERE r.user_id = u.id)                                         AS readings,
       (SELECT max(r.created_at) FROM readings r WHERE r.user_id = u.id)                                AS last_reading_at,
       (SELECT count(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'paid')                   AS paid_payments,
       u.created_at,
       u.deleted_at
FROM users u
JOIN user_premium up ON up.user_id = u.id;

-- =====================================================================
--  10. ПОДСКАЗКИ В pgAdmin (описания таблиц)
-- =====================================================================
COMMENT ON TABLE users               IS 'Пользователи: Telegram, e-mail, Google. Баланс менять только через balance_transactions';
COMMENT ON TABLE readings            IS 'Любой результат: расклад, нумерология, астрология, натальная карта';
COMMENT ON TABLE payments            IS 'Каждая попытка оплаты; строки не удаляются. RUB в копейках, XTR в звёздах';
COMMENT ON TABLE balance_transactions IS 'Единственный способ менять кристаллы и расчёты натальной карты (триггер обновляет users)';
COMMENT ON TABLE user_consents       IS 'Журнал согласий (152-ФЗ). Только добавление строк';
COMMENT ON TABLE data_requests       IS 'Запросы на доступ/удаление данных: срок ответа 30 дней (due_at)';
COMMENT ON TABLE webhook_events      IS 'Входящие уведомления ЮKassa и Telegram: UNIQUE(provider, event_id) защищает от повторной обработки';
COMMENT ON TABLE receipts            IS 'Чеки самозанятого («Мой налог») по оплатам и возвратам';
COMMENT ON FUNCTION anonymize_user(bigint)        IS 'Удаление персональных данных по запросу; платежи сохраняются';
COMMENT ON FUNCTION fulfill_payment(bigint)       IS 'Выдать купленное после оплаты; безопасно вызывать повторно';
COMMENT ON FUNCTION refund_payment(bigint, text)  IS 'Оформить возврат в базе (деньги возвращает платёжная система)';

-- =====================================================================
--  11. РОЛЬ ТОЛЬКО ДЛЯ ЧТЕНИЯ (аналитика, просмотр) — создаётся администратором сервера
--      CREATE ROLE mystara_readonly NOLOGIN;
-- =====================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mystara_readonly') THEN
        GRANT USAGE ON SCHEMA public TO mystara_readonly;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO mystara_readonly;
        -- в personal-таблицах не даём читать пароли и токены
        REVOKE SELECT ON users FROM mystara_readonly;
        GRANT SELECT (id, telegram_id, username, first_name, language_code, locale, source_id, referrer_id, balance,
                      natal_credits, timezone, notify_daily, notify_time, is_bot_blocked, is_banned,
                      created_at, last_active_at, updated_at, deleted_at, email_verified_at, privacy_policy_version)
              ON users TO mystara_readonly;
        REVOKE SELECT ON verification_tokens FROM mystara_readonly;
    END IF;
END
$$;

COMMIT;
