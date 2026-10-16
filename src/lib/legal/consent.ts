import { ADDRESS_CLAUSE, OPERATOR } from "./operator";
import type { LegalSection } from "./privacy-policy";

/**
 * «Согласие на обработку персональных данных» — намеренно *отдельный* документ, не часть политики
 * конфиденциальности: по ст. 9 152-ФЗ (с поправками 2025 года) согласие должно даваться отдельно
 * от других документов, а не быть встроенным в политику или пользовательское соглашение. Форма
 * регистрации, страница входа и первый экран в Telegram ведут на эту страницу и записывают принятие
 * версии `PRIVACY_POLICY_VERSION`.
 *
 * Требует юридической проверки, как и privacy-policy.ts: заполнить заглушки и держать согласованным
 * с перечнями данных и получателей в политике (меняя одно, меняйте другое и повышайте версию).
 */
const op = OPERATOR;

export const CONSENT_SECTIONS: LegalSection[] = [
  {
    id: "consent",
    title: { ru: "Согласие", en: "Consent" },
    body: {
      ru: [
        `Я, пользователь сервиса «${op.serviceName}», действуя свободно, своей волей и в своём интересе, в соответствии со статьёй 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» даю согласие оператору — ${op.name} (${op.registration}${op.address ? `; адрес: ${op.address}` : ""}; e-mail: ${op.email}) — на обработку моих персональных данных на условиях, изложенных ниже.`,
      ],
      en: [
        `I, a user of the “${op.serviceName}” service, acting freely, of my own will and in my own interest, in accordance with Article 9 of Russian Federal Law No. 152-FZ of 27 July 2006 “On Personal Data”, consent to the processing of my personal data by the operator — ${op.name} (${op.registration}${op.address ? `; address: ${op.address}` : ""}; e-mail: ${op.email}) — on the terms set out below.`,
      ],
    },
  },
  {
    id: "purposes",
    title: { ru: "Цели обработки", en: "Purposes of processing" },
    body: {
      ru: [
        [
          "регистрация и аутентификация, ведение учётной записи;",
          "сохранение истории раскладов, результатов нумерологических и астрологических расчётов и избранного;",
          "формирование раскладов, расчётов и толкований по моим запросам, в том числе с использованием автоматизированных средств и искусственного интеллекта;",
          "обеспечение работоспособности и безопасности сервиса;",
          "ответы на мои обращения.",
        ],
      ],
      en: [
        [
          "registration and authentication, maintaining my account;",
          "saving my reading history, numerology and astrology results and favorites;",
          "producing spreads, calculations and interpretations at my request, including by automated means and artificial intelligence;",
          "keeping the service working and secure;",
          "replying to my enquiries.",
        ],
      ],
    },
  },
  {
    id: "data",
    title: { ru: "Перечень персональных данных", en: "Personal data covered" },
    body: {
      ru: [
        [
          "имя, которым я представился при регистрации или в Telegram, адрес электронной почты;",
          "идентификатор пользователя Telegram, имя пользователя (username), ссылка на фотографию профиля, код языка — при входе через Telegram;",
          "дата рождения;",
          "текст моих вопросов к раскладам, выбранные расклады, вытянутые карты, полученные толкования, избранное;",
          "сведения о моих покупках и платежах (без реквизитов банковской карты, которые я ввожу только у платёжного провайдера);",
          "технические данные: IP-адрес, сведения о браузере и устройстве, файлы cookie.",
        ],
        "Специальные категории персональных данных и биометрические данные я в сервис вносить не буду.",
      ],
      en: [
        [
          "my name (as given at registration or shown in Telegram) and e-mail address;",
          "my Telegram user ID, username, profile-photo link and language code — when signing in with Telegram;",
          "my date of birth;",
          "the text of my questions, chosen spreads, drawn cards, received interpretations and favorites;",
          "information about my purchases and payments (without bank-card details, which I enter only at the payment provider);",
          "technical data: IP address, browser and device information, cookies.",
        ],
        "I will not enter special categories of personal data or biometric data into the service.",
      ],
    },
  },
  {
    id: "actions",
    title: { ru: "Действия с данными и способ обработки", en: "Actions and method of processing" },
    body: {
      ru: [
        "Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (предоставление, доступ) лицам, указанным ниже, блокирование, удаление, уничтожение. Обработка осуществляется с использованием средств автоматизации.",
      ],
      en: [
        "Collection, recording, systematisation, accumulation, storage, clarification (updating, changing), retrieval, use, transfer (provision, access) to the persons named below, blocking, deletion, destruction. Processing is carried out with the aid of automation.",
      ],
    },
  },
  {
    id: "recipients",
    title: { ru: "Передача третьим лицам и трансграничная передача", en: "Transfer to third parties, incl. cross-border" },
    body: {
      ru: [
        "Я согласен(на) на передачу данных лицам, участвующим в работе сервиса и действующим по поручению оператора или по моему действию, в объёме, необходимом для достижения целей:",
        [
          "хостинг-провайдеру Vercel Inc. (США; центр обработки данных во Франкфурте-на-Майне, Германия) и провайдеру базы данных: [указать];",
          "платёжным провайдерам — для приёма оплаты и возвратов;",
          "провайдеру языковой модели (в случае включения генерации толкований с помощью ИИ) — только текст вопроса, выбранный расклад и вытянутые карты, без имени и адреса электронной почты: не используется;",
          "Telegram (при входе через Telegram и при использовании мини-приложения Telegram).",
        ],
        "Мне известно, что часть этих лиц находится или может обрабатывать данные за пределами Российской Федерации, в том числе в государствах, не обеспечивающих адекватной защиты прав субъектов персональных данных: США, Германия, а также государства, где расположена инфраструктура Telegram. Я даю согласие на такую трансграничную передачу.",
      ],
      en: [
        "I agree to the transfer of data to the persons involved in running the service, who act on the operator’s instructions or at my action, to the extent necessary to achieve the purposes:",
        [
          "the hosting provider Vercel Inc. (USA; data centre in Frankfurt am Main, Germany) and the database provider: [state];",
          "payment providers — to take payments and make refunds;",
          "the language-model provider (if AI-generated interpretations are enabled) — only the question text, the chosen spread and the drawn cards, without name or e-mail: not used;",
          "Telegram (when signing in with Telegram and when using the Telegram Mini App).",
        ],
        "I understand that some of these persons are located, or may process data, outside the Russian Federation, including in states that do not provide adequate protection of data-subject rights: the USA, Germany, and the states where Telegram’s infrastructure is located. I consent to such cross-border transfer.",
      ],
    },
  },
  {
    id: "term",
    title: { ru: "Срок действия и отзыв", en: "Term and withdrawal" },
    body: {
      ru: [
        "Согласие действует с момента его предоставления до момента его отзыва либо удаления моей учётной записи — в зависимости от того, что наступит раньше.",
        `Я могу отозвать согласие в любой момент, направив соответствующее заявление на ${op.email}${ADDRESS_CLAUSE.ru}. Мне известно, что после отзыва обработка будет прекращена, а данные уничтожены в срок, не превышающий 30 дней, если иное не предусмотрено законом, и что доступ к функциям, требующим учётной записи, может быть прекращён.`,
        "Согласие даётся отдельным действием (проставлением отметки) и не является условием пользования той частью сервиса, которая не требует учётной записи: без согласия можно получать расклады и расчёты как гость, без сохранения истории.",
      ],
      en: [
        "This consent is valid from the moment it is given until it is withdrawn or my account is deleted, whichever happens first.",
        `I may withdraw consent at any time by sending a written statement to ${op.email}${ADDRESS_CLAUSE.en}. I understand that after withdrawal processing will stop and the data will be destroyed within no more than 30 days unless the law provides otherwise, and that access to features requiring an account may be discontinued.`,
        "Consent is given by a separate action (ticking a box) and is not a condition of using the part of the service that does not need an account: without consent you can receive spreads and calculations as a guest, without saved history.",
      ],
    },
  },
];
