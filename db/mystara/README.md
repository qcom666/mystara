# Полная база `mystara` (сайт + Telegram-бот + Mini App)

PostgreSQL 16, локально (порт 5432), база `mystara`, владелец `mystara_app`. Основа - схема бота из
`mystara_schema.sql` и `mystara_seed.sql`, расширенная до полной базы проекта и заполненная
содержимым сайта.

## Что в базе

**43 таблицы, 7 представлений, 7 функций, 6 триггеров, 42 внешних ключа, 93 индекса.**

| Блок | Таблицы |
|---|---|
| Пользователи и вход | `users` (Telegram, e-mail, Google), `auth_accounts`, `verification_tokens`, `profiles`, `admins` |
| Юридическое (152-ФЗ) | `legal_documents` (версии политики, согласия, оферты), `user_consents` (журнал согласий), `data_requests` (запросы на удаление/доступ, срок 30 дней) |
| Расклады и разборы | `readings`, `reading_cards`, `ai_interpretations`, `natal_charts`, `favorites` |
| Контент (RU + EN) | `tarot_cards` (78), `tarot_spreads` (9), `zodiac_signs` (12), `numerology_meanings` (72), `planets`, `houses`, `aspects`, `sect_profiles`, `cities` (77), `celebrities` (20), `card_archetypes`, `horoscopes` (пусто, наполняется) |
| Деньги | `products`, `payments` (ЮKassa в копейках, Звёзды), `refunds`, `receipts` (чеки самозанятого), `subscriptions`, `balance_transactions`, `promo_codes`, `promo_activations`, `webhook_events` |
| Маркетинг | `traffic_sources`, `ad_campaigns`, `ad_impressions`, `broadcasts` |
| Служебное | `events`, `support_tickets`, `support_messages`, `audit_log`, `app_settings` |
| Представления | `user_premium`, `source_stats`, `v_revenue_daily`, `v_funnel_daily`, `v_active_subscriptions`, `v_data_requests_open`, `v_user_overview` |

Договорённость по суммам: **Звёзды (XTR) - целые звёзды, рубли (RUB) - в копейках** (1000 ₽ = 100000).

## Функции (логика в самой базе)

- `fulfill_payment(payment_id)` - выдать купленное после оплаты (кристаллы, расчёты натальной карты или подписку).
  Безопасна при повторном вызове: вернёт `already_fulfilled`, а уникальные индексы не дадут начислить дважды.
- `refund_payment(payment_id, причина)` - оформить возврат: платёж становится `refunded`, подписка отзывается,
  монеты снимаются в пределах остатка (баланс не уйдёт в минус).
- `anonymize_user(user_id)` - удаление персональных данных по запросу: стирает профили, расклады, события,
  e-mail, пароль и т.д., обезличивает строку пользователя, **платежи и журнал согласий сохраняет**.
- `zodiac_sign_for(дата)` - знак зодиака; триггер сам заполняет его в профилях и у знаменитостей.
- Триггер баланса: `users.balance` и `users.natal_credits` меняются **только** вставкой в `balance_transactions`.

## Файлы и порядок

1. `mystara_schema.sql`, `mystara_seed.sql` - твои исходные файлы (не менялись).
2. `mystara_additions.sql` - согласие, `deleted_at`, автозаполнение знака, первая `anonymize_user`.
3. `mystara_extension.sql` - всё остальное (вход, юридическое, деньги, поддержка, представления, роль только для чтения).
4. `mystara_content.sql` - **сгенерирован** из кода сайта: `npx tsx scripts/export-content-sql.ts > db/mystara/mystara_content.sql`.
   Правишь тексты в `src/modules/**` - перегенерируй файл и накати заново (он идемпотентный).

Собрать с нуля на пустой базе (создать её в pgAdmin: Databases -> Create -> Database, владелец `mystara_app`, UTF8):

```powershell
powershell -ExecutionPolicy Bypass -File db\mystara\load.ps1 -DbName имя_базы
```

Проверено: база, собранная этой командой с нуля, идентична рабочей.

## Просмотр, копии

```powershell
powershell -ExecutionPolicy Bypass -File db\mystara\studio.ps1          # Prisma Studio: http://localhost:5556
powershell -ExecutionPolicy Bypass -File db\backup.ps1 -DbName mystara  # резервная копия
powershell -ExecutionPolicy Bypass -File db\restore.ps1 -File db\backups\ИМЯ.dump -DbName mystara -Yes
```

В pgAdmin: Servers -> твой сервер -> правой кнопкой по **Databases -> Refresh** -> `mystara`.

## Безопасность

- Роль `mystara_readonly` (без права входа, для аналитики): читает всё, **кроме паролей и токенов**
  (`users.password_hash`, `verification_tokens`). Входной пароль ей можно задать отдельно, когда понадобится.
- В базе нет паролей в открытом виде: только bcrypt-хеши и хеши токенов.
- Локальный сервер слушает только `localhost`.

## Важно: сайт пока работает на другой схеме

Сайт и Mini App сейчас хранят данные по схеме Prisma (`prisma/schema.prisma`: база `mystara_dev` локально и Neon на Vercel).
Эта база `mystara` приложением **пока не используется**. Перенос сайта на неё - отдельный этап (переписать код доступа
к данным или описать эту схему в Prisma через `prisma db pull`). До этого момента она - готовая, проверенная основа,
к которой можно подключить бота и новую версию сайта.
