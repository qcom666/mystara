import { ADDRESS_CLAUSE, OPERATOR } from "./operator";

/**
 * Содержимое политики конфиденциальности. Основной текст русский (его требует 152-ФЗ и его читает
 * российский пользователь или регулятор); английский — перевод для удобства, на странице он так
 * и помечен.
 *
 * Написана так, чтобы описывать то, что код реально делает. Это не юридическая консультация: нужна
 * проверка юристом, заполнение всех заглушек `[…]` и сверка с действующим текстом 152-ФЗ до публичного
 * запуска. Утверждения об инфраструктуре (где размещено, какой провайдер ИИ, сроки хранения журналов)
 * должны быть верны для *развёрнутой* системы: меняйте их при смене инфраструктуры.
 */

export type LegalLang = "ru" | "en";
/** Строка — абзац; string[] — маркированный список. */
export type LegalBlock = string | string[];

export interface LegalSection {
  id: string;
  title: Record<LegalLang, string>;
  body: Record<LegalLang, LegalBlock[]>;
}

const op = OPERATOR;

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    id: "general",
    title: { ru: "1. Общие положения", en: "1. General provisions" },
    body: {
      ru: [
        `Настоящая Политика в отношении обработки персональных данных (далее — «Политика») определяет, каким образом сервис «${op.serviceName}» (далее — «Сервис»), доступный по адресу ${op.siteUrl} и в виде мини-приложения (Mini App) в мессенджере Telegram, собирает, использует, хранит и защищает персональные данные пользователей.`,
        "Политика разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» (далее — «152-ФЗ») и иными нормативными правовыми актами Российской Федерации в области персональных данных.",
        "Политика опубликована в открытом доступе на странице Сервиса «Политика конфиденциальности». Пользуясь Сервисом, вы подтверждаете, что ознакомились с Политикой.",
        "Обработка персональных данных, для которой требуется согласие, осуществляется только после того, как вы даёте такое согласие отдельным действием — на основании документа «Согласие на обработку персональных данных», размещённого на отдельной странице Сервиса. Настоящая Политика не является таким согласием.",
      ],
      en: [
        `This Personal Data Processing Policy (the “Policy”) explains how the “${op.serviceName}” service (the “Service”), available at ${op.siteUrl} and as a Mini App inside the Telegram messenger, collects, uses, stores and protects users’ personal data.`,
        "The Policy is written in accordance with Russian Federal Law No. 152-FZ of 27 July 2006 “On Personal Data” (“152-FZ”) and other Russian personal-data legislation.",
        "The Policy is publicly available on the Service’s “Privacy Policy” page. By using the Service you confirm that you have read it.",
        "Processing that requires consent takes place only after you give that consent by a separate action, on the basis of the separate document “Consent to the Processing of Personal Data”. This Policy is not that consent.",
      ],
    },
  },
  {
    id: "operator",
    title: { ru: "2. Оператор персональных данных", en: "2. The personal-data operator" },
    body: {
      ru: [
        "Оператором персональных данных (лицом, определяющим цели и состав обработки) является:",
        [`Наименование / ФИО: ${op.name}`, `Регистрационные данные: ${op.registration}`, ...(op.address ? [`Адрес: ${op.address}`] : []), ...(op.phone ? [`Телефон: ${op.phone}`] : []), `Электронная почта для обращений: ${op.email}`, ...(op.telegram ? [`Поддержка в Telegram: ${op.telegram}`] : [])],
      ],
      en: [
        "The personal-data operator (the party that determines the purposes and scope of processing) is:",
        [`Name: ${op.name}`, `Registration details: ${op.registration}`, ...(op.address ? [`Address: ${op.address}`] : []), ...(op.phone ? [`Phone: ${op.phone}`] : []), `Contact e-mail: ${op.email}`, ...(op.telegram ? [`Telegram support: ${op.telegram}`] : [])],
      ],
    },
  },
  {
    id: "nature",
    title: { ru: "3. Характер Сервиса", en: "3. Nature of the Service" },
    body: {
      ru: [
        "Сервис носит исключительно развлекательный и рефлексивный характер. Расклады Таро, нумерологические и астрологические расчёты, а также любые толкования (в том числе сформированные автоматически с помощью алгоритмов или искусственного интеллекта) являются символическими интерпретациями.",
        "Они не являются гаданием в смысле предсказания будущего, не гарантируют наступления каких-либо событий и не заменяют медицинскую, психологическую, юридическую, финансовую или иную профессиональную консультацию. Решения, принятые на основании таких материалов, пользователь принимает самостоятельно и под собственную ответственность.",
        "Оператор не принимает решений, порождающих юридические последствия для пользователя или иным образом затрагивающих его права и законные интересы, исключительно на основании автоматизированной обработки персональных данных.",
      ],
      en: [
        "The Service is purely for entertainment and reflection. Tarot spreads, numerology and astrology calculations, and any interpretations (including those generated automatically by algorithms or artificial intelligence) are symbolic interpretations.",
        "They are not fortune-telling in the sense of predicting the future, they do not guarantee that any event will occur, and they are no substitute for medical, psychological, legal, financial or other professional advice. Decisions made on the basis of such material are made by the user independently and at the user’s own responsibility.",
        "The operator does not make decisions that produce legal consequences for the user, or otherwise affect the user’s rights and legitimate interests, solely on the basis of automated processing of personal data.",
      ],
    },
  },
  {
    id: "data",
    title: { ru: "4. Какие данные мы обрабатываем", en: "4. What data we process" },
    body: {
      ru: [
        "Данные учётной записи:",
        [
          "имя и адрес электронной почты — при регистрации по e-mail;",
          "хеш пароля — сам пароль мы не храним и не видим;",
          "сведения о приглашении (чей код приглашения использован) — если вы создали аккаунт по ссылке друга; использованные промокоды;",
          "идентификатор чата Telegram и язык — если вы подписались в боте на «Карту дня» (команда /daily; отписаться: /daily off);",
          "при входе через Telegram — идентификатор пользователя Telegram, имя, фамилия, имя пользователя (username), ссылка на фотографию профиля и код языка интерфейса, которые Telegram передаёт мини-приложению в подписанных данных запуска.",
        ],
        "Данные, которые вы вводите в Сервис:",
        [
          "дата рождения — для нумерологических и астрологических расчётов; сохраняется на сервере только если вы нажимаете «Сохранить результат»;",
          "текст вопроса к раскладу (поле необязательное); сохраняется на сервере только если вы сохраняете расклад;",
          "выбранные расклады, вытянутые карты, полученные толкования и избранное — для учёта истории, если у вас есть учётная запись;",
          "полное имя, которое вы вводите для нумерологического расчёта, используется только для вычисления в вашем браузере и на серверах Оператора не сохраняется.",
        ],
        "Данные о покупках и платежах (если вы что-то покупаете):",
        [
          "состав и стоимость заказа, дата, способ оплаты, статус платежа и идентификатор платежа у платёжного провайдера;",
          "реквизиты банковской карты и иные платёжные данные вводятся только на стороне платёжного провайдера — мы их не получаем и не храним;",
          "сведения для формирования чека (способ связи, на который он направляется).",
        ],
        "Технические данные:",
        [
          "IP-адрес, сведения о браузере и устройстве, дата и время запросов — они попадают в технические журналы хостинг-провайдера, которые ведутся для работоспособности и безопасности;",
          "файлы cookie и данные локального хранилища браузера — см. раздел 8.",
        ],
        "Мы не запрашиваем специальные категории персональных данных (о состоянии здоровья, расовой и национальной принадлежности, политических взглядах, религиозных и философских убеждениях, интимной жизни) и биометрические персональные данные. Просим не вносить такие сведения в поле вопроса. Если вы всё же сделаете это по собственной инициативе, такие сведения будут обработаны как содержание вашего вопроса; вы можете потребовать их удаления способом, указанным в разделе 10.",
      ],
      en: [
        "Account data:",
        [
          "name and e-mail address — when registering by e-mail;",
          "a password hash — we neither store nor see the password itself;",
          "invitation details (whose invitation code was used) — if you created an account through a friend’s link; promo codes you used;",
          "your Telegram chat ID and language — if you subscribed to the “Card of the day” in the bot (the /daily command; to stop: /daily off);",
          "when signing in with Telegram — the Telegram user ID, first and last name, username, profile-photo link and interface language code that Telegram passes to the Mini App in its signed launch data.",
        ],
        "Data you enter into the Service:",
        [
          "date of birth — for numerology and astrology calculations; stored on the server only if you press “Save result”;",
          "the text of your question for a spread (optional); stored on the server only if you save the reading;",
          "chosen spreads, drawn cards, received interpretations and favorites — to keep your history, if you have an account;",
          "the full name you enter for the numerology calculation is used only to compute results in your browser and is not stored on the operator’s servers.",
        ],
        "Purchase and payment data (if you buy something):",
        [
          "what was ordered and its price, the date, the payment method, the payment status and the payment ID at the payment provider;",
          "bank-card details and other payment credentials are entered only on the payment provider’s side — we neither receive nor store them;",
          "details for issuing a receipt (the contact it is sent to).",
        ],
        "Technical data:",
        [
          "IP address, browser and device information, date and time of requests — these end up in the hosting provider’s technical logs, kept for reliability and security;",
          "cookies and browser local-storage data — see section 8.",
        ],
        "We do not ask for special categories of personal data (health, racial or ethnic origin, political views, religious or philosophical beliefs, intimate life) or biometric data. Please do not put such information into the question field. If you do so on your own initiative, it will be processed as part of the content of your question; you may ask for it to be deleted as described in section 10.",
      ],
    },
  },
  {
    id: "purposes",
    title: { ru: "5. Цели и правовые основания обработки", en: "5. Purposes and legal bases" },
    body: {
      ru: [
        "Мы обрабатываем персональные данные только для следующих целей:",
        [
          "регистрация и аутентификация пользователей, ведение учётной записи, сохранение истории раскладов, результатов расчётов и избранного — на основании вашего согласия (п. 1 ч. 1 ст. 6 152-ФЗ) и в целях исполнения пользовательского соглашения, стороной которого вы являетесь (п. 5 ч. 1 ст. 6);",
          "формирование раскладов, расчётов и толкований по вашим запросам, в том числе автоматизированное формирование текста толкования — на тех же основаниях;",
          "обеспечение работоспособности и безопасности Сервиса, предотвращение злоупотреблений — в целях реализации законных интересов Оператора, если при этом не нарушаются ваши права и свободы (п. 7 ч. 1 ст. 6);",
          "ответы на ваши обращения — на основании вашего обращения и согласия;",
          "оформление и учёт покупок, оказание оплаченных услуг, возвраты и формирование чека — на основании договора (публичной оферты), стороной которого вы являетесь (п. 5 ч. 1 ст. 6), и требований законодательства;",
          "исполнение требований законодательства Российской Федерации (п. 2 ч. 1 ст. 6).",
        ],
        "Мы не используем персональные данные для рекламных рассылок, не продаём их и не передаём для маркетинговых целей. Если это изменится, мы запросим отдельное согласие.",
      ],
      en: [
        "We process personal data only for the following purposes:",
        [
          "registering and authenticating users, maintaining accounts, saving reading history, calculation results and favorites — on the basis of your consent (Art. 6(1)(1) of 152-FZ) and to perform the user agreement to which you are a party (Art. 6(1)(5));",
          "producing spreads, calculations and interpretations at your request, including automated generation of interpretation text — on the same bases;",
          "keeping the Service working and secure and preventing abuse — for the operator’s legitimate interests, where this does not override your rights and freedoms (Art. 6(1)(7));",
          "replying to your enquiries — on the basis of your enquiry and consent;",
          "placing and recording purchases, providing paid services, refunds and issuing receipts — on the basis of the contract (public offer) to which you are a party (Art. 6(1)(5)) and legal requirements;",
          "complying with the legislation of the Russian Federation (Art. 6(1)(2)).",
        ],
        "We do not use personal data for advertising mailings, we do not sell it, and we do not pass it on for marketing. If that changes, we will ask for separate consent.",
      ],
    },
  },
  {
    id: "processing",
    title: { ru: "6. Порядок обработки и передача третьим лицам", en: "6. How data is processed, and third parties" },
    body: {
      ru: [
        "Обработка осуществляется с использованием средств автоматизации и включает сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу (предоставление, доступ) в случаях, указанных ниже, блокирование, удаление и уничтожение персональных данных.",
        "Для работы Сервиса мы привлекаем следующих исполнителей (поручение обработки по ч. 3 ст. 6 152-ФЗ) и иных получателей:",
        [
          "хостинг-провайдер Vercel Inc. (США) — размещение и работа Сервиса; функции Сервиса выполняются в центре обработки данных во Франкфурте-на-Майне (Германия);",
          "провайдер базы данных — хранение данных учётных записей и истории: [указать провайдера и место размещения базы данных на территории РФ];",
          "платёжные провайдеры — приём оплаты и возвраты: на сайте банковские карты и СБП принимает подключённый к Сервису платёжный сервис (его наименование показывается при оформлении заказа), в Telegram оплата проходит звёздами Telegram (Telegram Stars) внутри Telegram;",
          "провайдер языковой модели (если включена генерация толкований с помощью ИИ) — текст вопроса, сведения о выбранном раскладе и вытянутых картах передаются для формирования толкования. Ваше имя, адрес электронной почты и иные идентификаторы при этом не передаются. Если генерация с помощью внешнего ИИ не включена, толкование формируется встроенным алгоритмом без передачи данных вовне. Провайдер: в настоящее время внешний провайдер ИИ не используется;",
          "Telegram — при использовании Сервиса как мини-приложения Telegram; Telegram самостоятельно определяет порядок обработки данных на своей стороне;",
          "государственные органы — в случаях и порядке, прямо предусмотренных законодательством Российской Федерации.",
        ],
        "Иным третьим лицам персональные данные без вашего согласия или иного основания, предусмотренного законом, не передаются.",
      ],
      en: [
        "Processing is carried out with the aid of automation and includes collection, recording, systematisation, accumulation, storage, clarification (updating, changing), retrieval, use, transfer (provision, access) in the cases listed below, blocking, deletion and destruction of personal data.",
        "To run the Service we engage the following processors (Art. 6(3) of 152-FZ) and other recipients:",
        [
          "the hosting provider Vercel Inc. (USA) — to host and run the Service; the Service’s functions run in a data centre in Frankfurt am Main (Germany);",
          "the database provider — to store account data and history: [state the provider and the location of the database in the Russian Federation];",
          "payment providers — to take payments and make refunds: on the website bank cards and SBP are accepted by the payment service connected to the Service (its name is shown when the Order is placed); in Telegram payment is made in Telegram Stars inside Telegram;",
          "a language-model provider (if AI-generated interpretations are enabled) — the text of the question, the chosen spread and the drawn cards are sent to generate the interpretation. Your name, e-mail address and other identifiers are not sent. If external AI generation is not enabled, the interpretation is produced by a built-in algorithm and nothing leaves the Service. Provider: currently no external AI provider is used;",
          "Telegram — when the Service is used as a Telegram Mini App; Telegram independently determines how it processes data on its side;",
          "public authorities — in cases and in the manner expressly provided for by the legislation of the Russian Federation.",
        ],
        "Personal data is not passed to any other third party without your consent or another basis provided by law.",
      ],
    },
  },
  {
    id: "cross-border",
    title: { ru: "7. Хранение в России и трансграничная передача", en: "7. Storage in Russia and cross-border transfer" },
    body: {
      ru: [
        "Запись, систематизация, накопление, хранение, уточнение (обновление, изменение) и извлечение персональных данных граждан Российской Федерации осуществляются с использованием баз данных, находящихся на территории Российской Федерации, в соответствии с ч. 5 ст. 18 152-ФЗ. Место хранения: [указать наименование провайдера и местонахождение центра обработки данных в РФ].",
        "Некоторые из получателей, перечисленных в разделе 6 (провайдер ИИ, Telegram, а также иные иностранные провайдеры инфраструктуры), могут находиться или обрабатывать данные за пределами Российской Федерации, то есть осуществляется трансграничная передача. Оператор [уведомил / уведомит] уполномоченный орган (Роскомнадзор) о намерении осуществлять трансграничную передачу в порядке ст. 12 152-ФЗ и перед её началом оценивает меры защиты, принимаемые получателем. Информация о государствах, на территории которых может осуществляться передача: [указать].",
      ],
      en: [
        "The recording, systematisation, accumulation, storage, clarification (updating, changing) and retrieval of personal data of citizens of the Russian Federation are carried out using databases located on the territory of the Russian Federation, in accordance with Art. 18(5) of 152-FZ. Storage location: [state the provider name and the location of the data centre in the Russian Federation].",
        "Some of the recipients listed in section 6 (the AI provider, Telegram and any other foreign infrastructure providers) may be located, or may process data, outside the Russian Federation — that is, a cross-border transfer takes place. The operator [has notified / will notify] the authorised body (Roskomnadzor) of its intention to make cross-border transfers under Art. 12 of 152-FZ, and before any transfer assesses the protection measures taken by the recipient. States to whose territory transfer may take place: [state].",
      ],
    },
  },
  {
    id: "cookies",
    title: { ru: "8. Файлы cookie и локальное хранилище", en: "8. Cookies and local storage" },
    body: {
      ru: [
        "Сервис использует только технически необходимые данные в вашем браузере:",
        [
          "сессионные cookie (Auth.js: сессия входа, защита от подделки запросов CSRF, адрес возврата после входа) — без них вход в учётную запись невозможен; срок действия сессии по умолчанию — 30 дней;",
          "данные локального хранилища браузера: выбранный язык интерфейса и отметка о том, что вы приняли соответствующую версию Согласия и Политики.",
        ],
        "Мы не используем рекламные cookie, сторонние счётчики и системы веб-аналитики. Сервис ведёт собственную обезличенную статистику (например, сколько раз открыта страница, начат или сохранён расклад): записывается только факт события, день и вид приложения (сайт или Telegram), без cookie, IP-адреса и других идентификаторов. Для работы мини-приложения Telegram загружается скрипт с сервера telegram.org; при этом Telegram может получать технические сведения о вашем запросе (например, IP-адрес). Шрифты интерфейса размещены на серверах Сервиса. Вы можете удалить cookie и локальные данные в настройках браузера; в этом случае вам потребуется снова войти в учётную запись и выбрать язык.",
      ],
      en: [
        "The Service uses only technically necessary data in your browser:",
        [
          "session cookies (Auth.js: the sign-in session, CSRF protection, the return address after sign-in) — sign-in is impossible without them; the session lasts 30 days by default;",
          "browser local-storage data: your chosen interface language and a marker that you accepted the relevant version of the Consent and this Policy.",
        ],
        "We do not use advertising cookies, third-party counters or web-analytics systems. The Service keeps its own anonymous usage statistics (for example, how often a page is opened or a reading is started or saved): only the fact of the event, the day and the kind of app (website or Telegram) are recorded, without cookies, IP addresses or other identifiers. To run the Telegram Mini App, a script is loaded from telegram.org, and Telegram may receive technical details of that request (such as your IP address). Interface fonts are hosted on the Service’s own servers. You can delete cookies and local data in your browser settings; you will then need to sign in again and choose your language again.",
      ],
    },
  },
  {
    id: "retention",
    title: { ru: "9. Сроки хранения и защита данных", en: "9. Retention and protection" },
    body: {
      ru: [
        "Данные учётной записи, история раскладов, сохранённые результаты и избранное хранятся, пока у вас есть учётная запись, либо до отзыва вами согласия или получения от вас требования об удалении — в зависимости от того, что наступит раньше. После этого данные удаляются или обезличиваются, если законодательство не требует их дальнейшего хранения.",
        "Если вы пользуетесь Сервисом без учётной записи, текст вашего вопроса и вытянутые карты обрабатываются только для формирования ответа и в базе данных Сервиса не сохраняются. Технические журналы хостинг-провайдера хранятся в течение срока, установленного этим провайдером: не более 30 дней.",
        "Оператор принимает правовые, организационные и технические меры защиты, предусмотренные ст. 18.1 и 19 152-ФЗ, в том числе: пароли хранятся только в виде хеша; передача данных между вашим устройством и Сервисом осуществляется по защищённому соединению (HTTPS); подлинность данных запуска Telegram проверяется по криптографической подписи; доступ к базе данных ограничен.",
      ],
      en: [
        "Account data, reading history, saved results and favorites are kept while you have an account, or until you withdraw consent or ask for deletion — whichever happens first. After that the data is deleted or anonymised, unless the law requires it to be kept.",
        "If you use the Service without an account, the text of your question and the drawn cards are processed only to produce the response and are not stored in the Service’s database. The hosting provider’s technical logs are kept for the period set by that provider: no more than 30 days.",
        "The operator takes the legal, organisational and technical protection measures required by Arts. 18.1 and 19 of 152-FZ, including: passwords are stored only as a hash; data is transmitted between your device and the Service over a secure connection (HTTPS); the authenticity of Telegram launch data is verified by its cryptographic signature; access to the database is restricted.",
      ],
    },
  },
  {
    id: "rights",
    title: { ru: "10. Ваши права и как ими воспользоваться", en: "10. Your rights and how to use them" },
    body: {
      ru: [
        "Вы вправе (ст. 14 152-ФЗ):",
        [
          "получить подтверждение факта обработки ваших персональных данных и сведения о ней;",
          "требовать уточнения, блокирования или уничтожения данных, если они неполны, устарели, неточны, получены незаконно или не нужны для заявленной цели;",
          "отозвать согласие на обработку персональных данных;",
          "обжаловать действия или бездействие Оператора в уполномоченном органе по защите прав субъектов персональных данных (Роскомнадзор) или в суде.",
        ],
        `Удалить аккаунт и данные, а вместе с этим отозвать согласие, можно самостоятельно в личном кабинете (раздел «Данные и приватность»). Остальные обращения направляются на ${op.email}${ADDRESS_CLAUSE.ru}. Чтобы мы могли найти ваши данные, укажите адрес электронной почты учётной записи, имя пользователя (username) в Telegram либо иные сведения, позволяющие вас идентифицировать.`,
        "Мы ответим на обращение в срок, установленный законом (как правило, в течение 10 рабочих дней; этот срок может быть продлён не более чем на 5 рабочих дней с мотивированным уведомлением). При отзыве согласия обработка прекращается, а данные уничтожаются в срок, не превышающий 30 дней, если иное не предусмотрено законом. После отзыва согласия доступ к функциям, требующим учётной записи, может быть прекращён.",
      ],
      en: [
        "You have the right (Art. 14 of 152-FZ) to:",
        [
          "obtain confirmation that your personal data is being processed, and information about the processing;",
          "require your data to be clarified, blocked or destroyed if it is incomplete, out of date, inaccurate, unlawfully obtained or not needed for the stated purpose;",
          "withdraw your consent to the processing of personal data;",
          "appeal the operator’s actions or inaction to the authorised body for the protection of data-subject rights (Roskomnadzor) or in court.",
        ],
        `You can delete your account and data, and thereby withdraw consent, yourself in your account page (the “Data and privacy” section). Other requests are sent to ${op.email}${ADDRESS_CLAUSE.en}. So that we can find your data, include the e-mail address of your account, your Telegram username, or other details that identify you.`,
        "We will respond within the period set by law (as a rule, within 10 working days, extendable by no more than 5 working days with a reasoned notice). When consent is withdrawn, processing stops and the data is destroyed within no more than 30 days unless the law provides otherwise. After consent is withdrawn, access to features that require an account may be discontinued.",
      ],
    },
  },
  {
    id: "children",
    title: { ru: "11. Возраст пользователей", en: "11. Age of users" },
    body: {
      ru: [
        "Сервис не предназначен для лиц младше 18 лет, и мы сознательно не собираем персональные данные несовершеннолетних. Если вы полагаете, что данные несовершеннолетнего попали в Сервис, напишите нам — мы удалим их.",
      ],
      en: [
        "The Service is not intended for persons under 18, and we knowingly do not collect personal data of minors. If you believe a minor’s data has reached the Service, write to us and we will delete it.",
      ],
    },
  },
  {
    id: "changes",
    title: { ru: "12. Изменение Политики и контакты", en: "12. Changes to the Policy and contacts" },
    body: {
      ru: [
        "Оператор вправе изменять Политику. Новая редакция вступает в силу с момента публикации на этой странице, если иное не указано в ней. О существенных изменениях мы уведомляем на этой странице, а при необходимости запрашиваем повторное согласие. Действующая редакция и дата её вступления в силу указаны в начале документа.",
        `По всем вопросам, связанным с обработкой персональных данных: ${op.email}.`,
      ],
      en: [
        "The operator may change the Policy. A new version takes effect when it is published on this page unless it states otherwise. We announce material changes on this page and, where necessary, ask for consent again. The current version and its effective date are shown at the top of the document.",
        `For any questions about the processing of personal data: ${op.email}.`,
      ],
    },
  },
];
