-- =====================================================================
--  MYSTARA — схема базы данных
--  СУБД: PostgreSQL 14+
--
--  Как накатить:
--    createdb mystara
--    psql -d mystara -f mystara_schema.sql
--    psql -d mystara -f mystara_seed.sql
--
--  Договорённости:
--    * все даты — timestamptz (хранятся в UTC)
--    * "кристаллы" — внутренняя валюта бота (users.balance)
--    * вместо ENUM — text + CHECK: новые значения добавляются одной строкой
--    * [MVP] — таблица нужна к запуску, [ПОЗЖЕ] — можно не трогать до роста
-- =====================================================================

BEGIN;

-- =====================================================================
--  1. СПРАВОЧНИКИ (контент, который заполняете вы)
-- =====================================================================

-- [MVP] 12 знаков зодиака
CREATE TABLE zodiac_signs (
    id          smallint PRIMARY KEY,                 -- 1..12
    code        text     NOT NULL UNIQUE,             -- aries, taurus ...
    name_ru     text     NOT NULL,
    emoji       text     NOT NULL,
    element     text     NOT NULL CHECK (element IN ('fire', 'earth', 'air', 'water')),
    start_month smallint NOT NULL CHECK (start_month BETWEEN 1 AND 12),
    start_day   smallint NOT NULL CHECK (start_day BETWEEN 1 AND 31),
    end_month   smallint NOT NULL CHECK (end_month BETWEEN 1 AND 12),
    end_day     smallint NOT NULL CHECK (end_day BETWEEN 1 AND 31)
);

-- [MVP] 78 карт таро
CREATE TABLE tarot_cards (
    id               smallint PRIMARY KEY,            -- 1..78
    code             text     NOT NULL UNIQUE,        -- fool, cups_01 ...
    name_ru          text     NOT NULL,
    arcana           text     NOT NULL CHECK (arcana IN ('major', 'minor')),
    suit             text     CHECK (suit IN ('wands', 'cups', 'swords', 'pentacles')),
    num              smallint NOT NULL,               -- старшие: 0..21, младшие: 1..14
    meaning_upright  text,                            -- значение в прямом положении
    meaning_reversed text,                            -- значение в перевёрнутом
    image_path       text,                            -- путь/URL картинки
    tg_file_id       text,                            -- file_id после первой отправки в Telegram (чтобы не грузить заново)
    CHECK ((arcana = 'major' AND suit IS NULL) OR (arcana = 'minor' AND suit IS NOT NULL))
);

-- [MVP] Виды раскладов
CREATE TABLE tarot_spreads (
    id           smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code         text     NOT NULL UNIQUE,            -- card_of_day, three_cards ...
    name_ru      text     NOT NULL,
    description  text,
    cards_count  smallint NOT NULL CHECK (cards_count BETWEEN 1 AND 20),
    positions    jsonb    NOT NULL DEFAULT '[]',      -- ["Прошлое","Настоящее","Будущее"]
    price        integer  NOT NULL DEFAULT 0 CHECK (price >= 0),  -- цена в кристаллах, 0 = бесплатно
    premium_only boolean  NOT NULL DEFAULT false,     -- только по подписке
    is_active    boolean  NOT NULL DEFAULT true,
    sort_order   smallint NOT NULL DEFAULT 0
);

-- [MVP] Готовые тексты гороскопов (общие, по знаку). Генерируются заранее, пользователям отдаются из кэша
CREATE TABLE horoscopes (
    id           bigint   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sign_id      smallint NOT NULL REFERENCES zodiac_signs (id),
    period       text     NOT NULL CHECK (period IN ('day', 'week', 'month', 'year')),
    period_start date     NOT NULL,                   -- день / понедельник недели / 1-е число месяца
    category     text     NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'love', 'money', 'health')),
    body         text     NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (sign_id, period, period_start, category)
);

-- [MVP] Трактовки чисел для нумерологии
CREATE TABLE numerology_meanings (
    id     integer  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind   text     NOT NULL CHECK (kind IN ('life_path', 'destiny', 'soul', 'personality', 'personal_year')),
    number smallint NOT NULL,                         -- 1..9, 11, 22, 33
    title  text,
    body   text     NOT NULL,
    UNIQUE (kind, number)
);

-- =====================================================================
--  2. ПОЛЬЗОВАТЕЛИ
-- =====================================================================

-- [MVP] Источники трафика. Каждому ролику в TikTok/Instagram — своя ссылка t.me/<бот>?start=<code>
CREATE TABLE traffic_sources (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       text   NOT NULL UNIQUE,                -- tt_taro_01, ig_reels_05
    platform   text   NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'telegram', 'vk', 'other')),
    title      text,                                  -- что это за ролик/пост
    cost_rub   numeric(12, 2) NOT NULL DEFAULT 0,     -- сколько потратили (если платное размещение)
    created_at timestamptz NOT NULL DEFAULT now()
);

-- [MVP] Все, кто нажал /start
CREATE TABLE users (
    id             bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telegram_id    bigint  NOT NULL UNIQUE,
    username       text,
    first_name     text,
    language_code  text,
    source_id      bigint  REFERENCES traffic_sources (id) ON DELETE SET NULL,  -- откуда пришёл
    referrer_id    bigint  REFERENCES users (id) ON DELETE SET NULL,            -- кто пригласил
    balance        integer NOT NULL DEFAULT 0 CHECK (balance >= 0),            -- кристаллы; руками НЕ менять, см. balance_transactions
    timezone       text    NOT NULL DEFAULT 'Europe/Moscow',
    notify_daily   boolean NOT NULL DEFAULT true,     -- слать ли ежедневный гороскоп
    notify_time    time    NOT NULL DEFAULT '09:00',  -- во сколько (по timezone пользователя)
    is_bot_blocked boolean NOT NULL DEFAULT false,    -- пользователь заблокировал бота
    is_banned      boolean NOT NULL DEFAULT false,    -- мы забанили пользователя
    created_at     timestamptz NOT NULL DEFAULT now(),
    last_active_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX users_source_idx   ON users (source_id);
CREATE INDEX users_referrer_idx ON users (referrer_id);
CREATE INDEX users_notify_idx   ON users (notify_time) WHERE notify_daily AND NOT is_bot_blocked;

-- [MVP] Данные рождения. kind='self' — сам пользователь, 'other' — партнёр/друг (для совместимости)
--       Вынесено отдельно: это персональные данные, их проще защищать и удалять по запросу
CREATE TABLE profiles (
    id             bigint   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        bigint   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind           text     NOT NULL DEFAULT 'self' CHECK (kind IN ('self', 'other')),
    name           text     NOT NULL,                 -- имя (для нумерологии — полное)
    gender         text     CHECK (gender IN ('male', 'female')),  -- нужно для согласования текстов
    birth_date     date     NOT NULL,
    birth_time     time,                              -- может быть неизвестно
    birth_place    text,                              -- "Казань, Россия"
    birth_lat      numeric(8, 5),
    birth_lon      numeric(8, 5),
    birth_tz       text,                              -- "Europe/Moscow"
    zodiac_sign_id smallint REFERENCES zodiac_signs (id),  -- считается функцией zodiac_sign_for(birth_date)
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_user_idx ON profiles (user_id);
CREATE UNIQUE INDEX profiles_one_self_uq ON profiles (user_id) WHERE kind = 'self';  -- свой профиль только один

-- [MVP] Команда проекта с доступом к админке
CREATE TABLE admins (
    user_id    bigint PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    role       text   NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'content', 'support')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
--  3. РАСКЛАДЫ И РАЗБОРЫ (то, что пользователь получает от бота)
-- =====================================================================

-- [MVP] Любой персональный результат: расклад, натальная карта, нумерология, совместимость
CREATE TABLE readings (
    id                 bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            bigint  NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind               text    NOT NULL CHECK (kind IN ('tarot', 'card_of_day', 'natal_chart',
                                                        'numerology', 'compatibility', 'personal_horoscope')),
    spread_id          smallint REFERENCES tarot_spreads (id),          -- для таро
    profile_id         bigint  REFERENCES profiles (id) ON DELETE SET NULL,  -- чей разбор
    partner_profile_id bigint  REFERENCES profiles (id) ON DELETE SET NULL,  -- второй человек (совместимость)
    question           text,                          -- вопрос пользователя
    result_text        text,                          -- готовый текст, который ушёл пользователю
    result_data        jsonb   NOT NULL DEFAULT '{}', -- сырые данные: числа, положения планет и т.п.
    price              integer NOT NULL DEFAULT 0 CHECK (price >= 0),   -- сколько кристаллов списали
    paid_by            text    NOT NULL DEFAULT 'free' CHECK (paid_by IN ('free', 'subscription', 'balance')),
    status             text    NOT NULL DEFAULT 'done' CHECK (status IN ('pending', 'done', 'failed')),
    rating             smallint CHECK (rating IN (-1, 1)),              -- 👎 / 👍
    ai_model           text,                          -- если текст пишет нейросеть
    tokens_in          integer,
    tokens_out         integer,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX readings_user_idx ON readings (user_id, created_at DESC);
CREATE INDEX readings_kind_idx ON readings (kind, created_at);

-- [MVP] Какие карты выпали в раскладе
CREATE TABLE reading_cards (
    reading_id  bigint   NOT NULL REFERENCES readings (id) ON DELETE CASCADE,
    pos         smallint NOT NULL,                    -- номер позиции в раскладе, с 1
    card_id     smallint NOT NULL REFERENCES tarot_cards (id),
    is_reversed boolean  NOT NULL DEFAULT false,
    PRIMARY KEY (reading_id, pos),
    UNIQUE (reading_id, card_id)                      -- одна карта не выпадает дважды
);

-- =====================================================================
--  4. ДЕНЬГИ
-- =====================================================================

-- [MVP] Что продаём: подписки и пакеты кристаллов
CREATE TABLE products (
    id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code          text    NOT NULL UNIQUE,            -- sub_month, crystals_50
    kind          text    NOT NULL CHECK (kind IN ('subscription', 'credits')),
    title         text    NOT NULL,
    description   text,
    duration_days integer,                            -- для подписки
    credits       integer,                            -- для пакета кристаллов
    price_stars   integer NOT NULL CHECK (price_stars > 0),  -- цена в Telegram Stars
    is_active     boolean NOT NULL DEFAULT true,
    sort_order    smallint NOT NULL DEFAULT 0,
    CHECK (
        (kind = 'subscription' AND duration_days IS NOT NULL AND duration_days > 0)
        OR (kind = 'credits' AND credits IS NOT NULL AND credits > 0)
    )
);

-- [ПОЗЖЕ] Промокоды
CREATE TABLE promo_codes (
    id         bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       text    NOT NULL UNIQUE,
    kind       text    NOT NULL CHECK (kind IN ('credits', 'subscription_days', 'discount_percent')),
    value      integer NOT NULL CHECK (value > 0),    -- кристаллы / дни / процент
    max_uses   integer,                               -- NULL = без лимита
    used_count integer NOT NULL DEFAULT 0,
    expires_at timestamptz,
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE promo_activations (
    promo_code_id bigint NOT NULL REFERENCES promo_codes (id) ON DELETE CASCADE,
    user_id       bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    activated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (promo_code_id, user_id)              -- один промокод — один раз на человека
);

-- [MVP] Каждая попытка оплаты. Строки отсюда НИКОГДА не удаляются
CREATE TABLE payments (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             bigint NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    product_id          integer NOT NULL REFERENCES products (id),
    provider            text   NOT NULL DEFAULT 'telegram_stars' CHECK (provider IN ('telegram_stars', 'manual')),
    amount              integer NOT NULL CHECK (amount > 0),
    currency            text   NOT NULL DEFAULT 'XTR',   -- XTR = Telegram Stars
    status              text   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    provider_payment_id text,                            -- telegram_payment_charge_id — нужен для возврата
    is_recurring        boolean NOT NULL DEFAULT false,  -- автопродление подписки (не первый платёж)
    promo_code_id      bigint REFERENCES promo_codes (id) ON DELETE SET NULL,
    raw                 jsonb,                           -- весь объект successful_payment на всякий случай
    created_at          timestamptz NOT NULL DEFAULT now(),
    paid_at             timestamptz,
    refunded_at         timestamptz
);
CREATE INDEX payments_user_idx ON payments (user_id, created_at DESC);
CREATE INDEX payments_paid_idx ON payments (paid_at) WHERE status = 'paid';
-- защита от двойного зачисления одного и того же платежа:
CREATE UNIQUE INDEX payments_provider_uq ON payments (provider, provider_payment_id)
    WHERE provider_payment_id IS NOT NULL;

-- [MVP] Подписки. Одна строка = один оплаченный период (каждое продление — новая строка).
--       Подписка активна, пока есть строка с expires_at > now() и revoked_at IS NULL —
--       никаких кронов для "истечения" не нужно
CREATE TABLE subscriptions (
    id          bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     bigint  NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id  integer REFERENCES products (id),        -- NULL, если выдали вручную/по промокоду
    payment_id  bigint  REFERENCES payments (id),
    starts_at   timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz NOT NULL,
    auto_renew  boolean NOT NULL DEFAULT false,          -- пользователь отключил автопродление → false
    revoked_at  timestamptz,                             -- отозвана (возврат денег) — период больше не считается
    created_at  timestamptz NOT NULL DEFAULT now(),
    CHECK (expires_at > starts_at)
);
CREATE INDEX subscriptions_user_idx ON subscriptions (user_id, expires_at DESC);

-- [MVP] Журнал движения кристаллов. Баланс меняется ТОЛЬКО вставкой строки сюда:
--       триггер ниже сам обновит users.balance, а CHECK (balance >= 0) не даст уйти в минус
CREATE TABLE balance_transactions (
    id         bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint  NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    amount     integer NOT NULL CHECK (amount <> 0),     -- + начисление, − списание
    reason     text    NOT NULL CHECK (reason IN ('purchase', 'reading', 'welcome_bonus', 'referral_bonus',
                                                    'promo', 'refund', 'admin')),
    payment_id bigint  REFERENCES payments (id),
    reading_id bigint  REFERENCES readings (id) ON DELETE SET NULL,
    comment    text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX balance_tx_user_idx ON balance_transactions (user_id, created_at DESC);

CREATE FUNCTION apply_balance_transaction() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE users SET balance = balance + NEW.amount WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER balance_transactions_apply
    AFTER INSERT ON balance_transactions
    FOR EACH ROW EXECUTE FUNCTION apply_balance_transaction();

-- =====================================================================
--  5. РЕКЛАМА И РАССЫЛКИ
-- =====================================================================

-- [ПОЗЖЕ] Реклама, которую продаёте внутри бота.
--         post — рекламный пост, channel_sub — "подпишись на канал спонсора, чтобы получить расклад"
CREATE TABLE ad_campaigns (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           text   NOT NULL,                  -- внутреннее название / рекламодатель
    kind            text   NOT NULL DEFAULT 'post' CHECK (kind IN ('post', 'channel_sub')),
    body            text,
    media_file_id   text,
    button_text     text,
    button_url      text,
    channel_id      bigint,                           -- telegram id канала (для channel_sub)
    price_rub       numeric(12, 2),                   -- сколько вам заплатили
    max_impressions integer,                          -- NULL = без лимита
    starts_at       timestamptz NOT NULL DEFAULT now(),
    ends_at         timestamptz,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ad_impressions (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id bigint NOT NULL REFERENCES ad_campaigns (id) ON DELETE CASCADE,
    user_id     bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    shown_at    timestamptz NOT NULL DEFAULT now(),
    clicked_at  timestamptz
);
CREATE INDEX ad_impressions_campaign_idx ON ad_impressions (campaign_id, shown_at);
CREATE INDEX ad_impressions_user_idx     ON ad_impressions (user_id, shown_at DESC);

-- [ПОЗЖЕ] Рассылки по базе из админки
CREATE TABLE broadcasts (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title         text   NOT NULL,
    body          text   NOT NULL,
    media_file_id text,
    button_text   text,
    button_url    text,
    segment       jsonb  NOT NULL DEFAULT '{}',       -- кому: {"premium": false, "sign": "leo"}
    status        text   NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'done', 'canceled')),
    scheduled_at  timestamptz,
    sent_count    integer NOT NULL DEFAULT 0,
    failed_count  integer NOT NULL DEFAULT 0,
    created_by    bigint REFERENCES users (id) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    finished_at   timestamptz
);

-- =====================================================================
--  6. АНАЛИТИКА
-- =====================================================================

-- [MVP] Лог событий для воронки: start → onboarding_done → first_reading → paywall_shown → purchase
CREATE TABLE events (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint REFERENCES users (id) ON DELETE CASCADE,
    name       text   NOT NULL,
    props      jsonb  NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_name_idx ON events (name, created_at);
CREATE INDEX events_user_idx ON events (user_id, created_at);

-- =====================================================================
--  7. ГОТОВЫЕ ФУНКЦИИ И ПРЕДСТАВЛЕНИЯ
-- =====================================================================

-- Знак зодиака по дате рождения: SELECT zodiac_sign_for('1999-08-15');  → 5 (Лев)
CREATE FUNCTION zodiac_sign_for(d date) RETURNS smallint
LANGUAGE sql STABLE AS $$
    SELECT z.id
    FROM zodiac_signs z,
         LATERAL (SELECT extract(month FROM d)::int * 100 + extract(day FROM d)::int AS md,
                         z.start_month * 100 + z.start_day                           AS s,
                         z.end_month * 100 + z.end_day                               AS e) x
    WHERE (x.s <= x.e AND x.md BETWEEN x.s AND x.e)
       OR (x.s >  x.e AND (x.md >= x.s OR x.md <= x.e))   -- Козерог: переход через Новый год
    LIMIT 1;
$$;

-- Есть ли у пользователя активная подписка и до какого числа
CREATE VIEW user_premium AS
SELECT u.id                          AS user_id,
       u.telegram_id,
       max(s.expires_at) IS NOT NULL AS is_premium,
       max(s.expires_at)             AS premium_until
FROM users u
LEFT JOIN subscriptions s
       ON s.user_id = u.id
      AND s.expires_at > now()
      AND s.revoked_at IS NULL
GROUP BY u.id;

-- Что приносит каждый ролик: сколько пришло, сколько заплатило, сколько звёзд
CREATE VIEW source_stats AS
SELECT ts.id,
       ts.code,
       ts.platform,
       ts.title,
       count(DISTINCT u.id)                          AS users,
       count(DISTINCT p.user_id)                     AS payers,
       coalesce(sum(p.amount), 0)                    AS revenue_stars
FROM traffic_sources ts
LEFT JOIN users u    ON u.source_id = ts.id
LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'paid'
GROUP BY ts.id;

COMMIT;
