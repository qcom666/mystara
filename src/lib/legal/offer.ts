import { NATAL_CHART_PACK_CREDITS, NATAL_CHART_PRICE_RUB, NATAL_CHART_PRICE_STARS } from "@/lib/pricing/natal-chart-pricing";
import { PREMIUM_PRICE_RUB, PREMIUM_PRICE_STARS } from "@/lib/pricing/premium-pricing";
import { PREMIUM_NATAL_CHART_INTERVAL_DAYS, PREMIUM_PERIOD_DAYS } from "@/modules/subscriptions/premium";
import { OPERATOR } from "./operator";
import type { LegalSection } from "./privacy-policy";

/**
 * Публичная оферта на платные цифровые услуги Mystara: договор, который покупатель принимает оплатой
 * (ГК РФ, ст. 435, 437, 438). Основной текст русский; английский — перевод для удобства.
 *
 * Составлена по Гражданскому кодексу (ст. 437, 438, 450, 782) и Закону о защите прав потребителей
 * (ст. 16, 17, 26.1, 31, 32) и под то, как реально работает код (кредиты начисляет вебхук платёжной
 * системы, см. purchase.repository.ts). Это не юридическая консультация: перед первой продажей нужна
 * проверка юристом.
 *
 * Намеренно НЕТ ничего об оплате криптовалютой: статья 14 закона 259-ФЗ запрещает принимать цифровую
 * валюту в оплату услуг в России и запрещает публиковать информацию о таком предложении.
 *
 * Цены берутся из модулей цен, поэтому оферта не может разойтись с сайтом.
 */

const op = OPERATOR;
const ru = (value: number) => value.toFixed(2).replace(".", ",");
const perCredit = NATAL_CHART_PRICE_RUB / NATAL_CHART_PACK_CREDITS;

export const OFFER_SECTIONS: LegalSection[] = [
  {
    id: "general",
    title: { ru: "1. Общие положения", en: "1. General provisions" },
    body: {
      ru: [
        `Настоящий документ является публичной офертой — официальным предложением ${op.name}, самозанятого (плательщика налога на профессиональный доход), ИНН указан в разделе «Реквизиты» (далее — «Исполнитель»), заключить договор возмездного оказания услуг на изложенных ниже условиях с любым дееспособным лицом, которое примет это предложение (далее — «Пользователь»), в соответствии со статьями 435, 437 и 438 Гражданского кодекса Российской Федерации.`,
        `Услуги оказываются через сервис «${op.serviceName}», доступный на сайте ${op.siteUrl} и в виде мини-приложения (Mini App) в мессенджере Telegram (далее — «Сервис»).`,
        "Настоящий документ одновременно является пользовательским соглашением (условиями использования) Сервиса: используя Сервис, в том числе его бесплатные функции, Пользователь принимает его условия.",
        "Оферта размещена на странице Сервиса «Публичная оферта» и действует бессрочно до её отзыва или изменения Исполнителем. Договор считается заключённым с момента акцепта, описанного в разделе 5.",
        "Ничто в настоящей оферте не ограничивает права Пользователя-потребителя, установленные Законом Российской Федерации от 07.02.1992 № 2300-1 «О защите прав потребителей». Условия, противоречащие этим правам, не применяются.",
      ],
      en: [
        `This document is a public offer — an official proposal by ${op.name}, a self-employed person (a professional-income-tax payer) whose tax ID is given in the “Details” section (the “Provider”), to conclude a paid-services contract on the terms below with any legally capable person who accepts it (the “User”), under Articles 435, 437 and 438 of the Civil Code of the Russian Federation.`,
        `The services are provided through the “${op.serviceName}” service, available at ${op.siteUrl} and as a Mini App inside the Telegram messenger (the “Service”).`,
        "This document is also the Service’s user agreement (terms of use): by using the Service, including its free features, the User accepts its terms.",
        "The offer is published on the Service’s “Public offer” page and remains in force until the Provider withdraws or amends it. The contract is concluded at the moment of acceptance described in section 5.",
        "Nothing in this offer limits the rights of a User who is a consumer under Russian Law No. 2300-1 of 7 February 1992 “On Consumer Rights Protection”. Any term contrary to those rights does not apply.",
      ],
    },
  },
  {
    id: "terms",
    title: { ru: "2. Термины", en: "2. Definitions" },
    body: {
      ru: [
        [
          "«Сервис» — мини-приложение и сайт «Mystara», в которых Пользователю доступны расклады Таро, нумерологические и астрологические расчёты и построение натальной карты.",
          "«Аккаунт» — учётная запись Пользователя в Сервисе (создаётся при входе через Telegram, в том числе автоматически при открытии Mini App в Telegram).",
          `«Кредит» — единица платной услуги на Аккаунте: один Кредит даёт право на одно построение натальной карты. Пакет «Натальная карта» содержит ${NATAL_CHART_PACK_CREDITS} Кредита.`,
          "«Premium» — платный тариф Сервиса, открывающий безлимитные расклады и все расклады Таро (в том числе «Кельтский крест»), на условиях, указанных на странице «Тарифы».",
          "«Заказ» — выбор Пользователем платной услуги и способа оплаты в интерфейсе Сервиса.",
        ],
      ],
      en: [
        [
          "“Service” — the “Mystara” Mini App and website, where the User can get Tarot readings, numerology and astrology calculations and a natal chart.",
          "“Account” — the User’s profile in the Service (created by signing in with Telegram, including automatically when the Mini App is opened in Telegram).",
          `“Credit” — a unit of the paid service on an Account: one Credit entitles the User to one natal-chart calculation. The “Natal Chart” pack contains ${NATAL_CHART_PACK_CREDITS} Credits.`,
          "“Premium” — the Service’s paid plan that unlocks unlimited readings and all Tarot spreads (including the Celtic Cross), on the terms shown on the “Pricing” page.",
          "“Order” — the User’s selection of a paid service and a payment method in the Service’s interface.",
        ],
      ],
    },
  },
  {
    id: "subject",
    title: { ru: "3. Предмет договора", en: "3. Subject of the contract" },
    body: {
      ru: [
        "Исполнитель обязуется предоставить Пользователю доступ к платным функциям Сервиса — в виде цифровых услуг, оказываемых дистанционно через сеть «Интернет», а Пользователь обязуется оплатить их на условиях настоящей оферты.",
        [
          `пакет «Натальная карта» — ${NATAL_CHART_PACK_CREDITS} построения натальной карты (расчёт положений планет, асцендента, домов и аспектов по указанным Пользователем дате, времени и месту рождения);`,
          `подписка Premium — доступ на оплаченный срок (${PREMIUM_PERIOD_DAYS} дней) к безлимитным раскладам, ко всем раскладам Таро и к одному построению натальной карты в ${PREMIUM_NATAL_CHART_INTERVAL_DAYS} дней без списания Кредитов.`,
        ],
        "Бесплатные функции Сервиса предоставляются без оплаты и предметом настоящего договора не являются, но на них также распространяются разделы 4, 9 и 10.",
      ],
      en: [
        "The Provider undertakes to give the User access to the Service’s paid features — as digital services delivered remotely over the Internet — and the User undertakes to pay for them on the terms of this offer.",
        [
          `the “Natal Chart” pack — ${NATAL_CHART_PACK_CREDITS} natal-chart calculations (positions of the planets, the Ascendant, houses and aspects based on the birth date, time and place the User enters);`,
          `the Premium subscription — access for the paid period (${PREMIUM_PERIOD_DAYS} days) to unlimited readings, all Tarot spreads and one natal-chart calculation every ${PREMIUM_NATAL_CHART_INTERVAL_DAYS} days without using Credits.`,
        ],
        "The Service’s free features are provided at no charge and are not the subject of this contract, but sections 4, 9 and 10 apply to them too.",
      ],
    },
  },
  {
    id: "nature",
    title: { ru: "4. Характер услуг", en: "4. Nature of the services" },
    body: {
      ru: [
        "Сервис носит развлекательный и познавательный характер и предназначен для размышления и самопознания. Расклады Таро, нумерологические и астрологические толкования и натальная карта — это символические интерпретации; они не являются предсказанием будущего, гаданием как оказанием услуги с гарантированным результатом, а также психологической, медицинской, юридической, финансовой или иной профессиональной консультацией.",
        "Исполнитель не гарантирует наступление каких-либо событий и не отвечает за решения, которые Пользователь принимает на основании толкований. Тексты толкований формируются автоматически на основе данных карт и расчётов.",
        "Астрономическая часть натальной карты (положения планет) рассчитывается по эфемеридам; точность асцендента и домов зависит от верности введённого Пользователем времени и места рождения.",
      ],
      en: [
        "The Service is of an entertainment and educational nature and is meant for reflection and self-discovery. Tarot readings, numerology and astrology interpretations and the natal chart are symbolic interpretations; they are not a prediction of the future, not fortune-telling offered as a service with a guaranteed result, and not psychological, medical, legal, financial or other professional advice.",
        "The Provider does not guarantee that any event will occur and is not responsible for decisions the User makes on the basis of the interpretations. The interpretation texts are generated automatically from the card and calculation data.",
        "The astronomical part of the natal chart (planet positions) is calculated from ephemerides; the accuracy of the Ascendant and houses depends on the birth time and place the User enters being correct.",
      ],
    },
  },
  {
    id: "acceptance",
    title: { ru: "5. Акцепт оферты и заключение договора", en: "5. Acceptance and conclusion of the contract" },
    body: {
      ru: [
        "Акцептом оферты является оформление Заказа и его оплата способом, предложенным в Сервисе (статья 438 ГК РФ). Совершая оплату, Пользователь подтверждает, что ознакомился с офертой, Политикой конфиденциальности и принимает их условия полностью.",
        "Платные услуги доступны Пользователям, достигшим 18 лет. Оформляя Заказ, Пользователь подтверждает, что ему исполнилось 18 лет.",
        "Для получения платных услуг Пользователю нужен Аккаунт: Кредиты и подписка закрепляются за тем Аккаунтом, с которого оформлен Заказ.",
      ],
      en: [
        "Acceptance of the offer means placing an Order and paying for it by a method offered in the Service (Article 438 of the Civil Code). By paying, the User confirms having read the offer and the Privacy Policy and accepts their terms in full.",
        "Paid services are available to Users aged 18 or over. By placing an Order the User confirms being at least 18.",
        "To receive paid services the User needs an Account: Credits and the subscription are attached to the Account from which the Order was placed.",
      ],
    },
  },
  {
    id: "prices",
    title: { ru: "6. Цены и порядок оплаты", en: "6. Prices and payment" },
    body: {
      ru: [
        [
          `пакет «Натальная карта» (${NATAL_CHART_PACK_CREDITS} построения): ${NATAL_CHART_PRICE_RUB} ₽ (при оплате Telegram Stars — ${NATAL_CHART_PRICE_STARS} Stars);`,
          `подписка Premium (${PREMIUM_PERIOD_DAYS} дней): ${PREMIUM_PRICE_RUB} ₽ (при оплате Telegram Stars — ${PREMIUM_PRICE_STARS} Stars).`,
        ],
        "Актуальные цены указаны на странице «Тарифы». Цена, показанная при оформлении Заказа, — окончательная; налог на добавленную стоимость не облагается (Исполнитель применяет специальный налоговый режим «Налог на профессиональный доход»).",
        "Способы оплаты, доступные на момент Заказа, показываются в интерфейсе Сервиса. На сайте это банковская карта и Система быстрых платежей (СБП) через подключённый к Сервису платёжный сервис (его наименование показывается при оформлении Заказа) — в российских рублях. Внутри Telegram оплата принимается в Telegram Stars. Сервис не хранит данные банковских карт: они вводятся на стороне платёжного сервиса.",
        `Подписка Premium оплачивается заранее на ${PREMIUM_PERIOD_DAYS} дней. Автоматического продления и повторных списаний нет: чтобы продлить Premium, Пользователь оплачивает его ещё раз, и новый срок добавляется к уже оплаченному.`,
        "Исполнитель вправе изменять цены. Изменение не затрагивает уже оплаченные Заказы и применяется к Заказам, оформленным после публикации новой цены.",
        "Чек по каждому платежу формируется Исполнителем в приложении «Мой налог» и направляется Пользователю в порядке, установленном Федеральным законом от 27.11.2018 № 422-ФЗ.",
      ],
      en: [
        [
          `“Natal Chart” pack (${NATAL_CHART_PACK_CREDITS} calculations): ${NATAL_CHART_PRICE_RUB} RUB (${NATAL_CHART_PRICE_STARS} Stars when paying with Telegram Stars);`,
          `Premium subscription (${PREMIUM_PERIOD_DAYS} days): ${PREMIUM_PRICE_RUB} RUB (${PREMIUM_PRICE_STARS} Stars when paying with Telegram Stars).`,
        ],
        "Current prices are shown on the “Pricing” page. The price shown when the Order is placed is final; VAT is not charged (the Provider applies the special tax regime “Tax on Professional Income”).",
        "The payment methods available at the time of the Order are shown in the Service’s interface. On the website these are bank card and the Faster Payments System (SBP) through the payment service connected to the Service (its name is shown when the Order is placed), in Russian roubles. Inside Telegram payment is accepted in Telegram Stars. The Service does not store bank-card data: it is entered on the payment service’s side.",
        `The Premium subscription is paid up front for ${PREMIUM_PERIOD_DAYS} days. There is no automatic renewal and no recurring charges: to extend Premium the User pays for it again, and the new period is added to the one already paid.`,
        "The Provider may change prices. A change does not affect Orders already paid and applies to Orders placed after the new price is published.",
        "A receipt for each payment is issued by the Provider in the “My Tax” app and sent to the User as required by Federal Law No. 422-FZ of 27 November 2018.",
      ],
    },
  },
  {
    id: "delivery",
    title: { ru: "7. Порядок оказания услуг", en: "7. How the services are provided" },
    body: {
      ru: [
        `Услуги оказываются дистанционно и в цифровом виде. После подтверждения платежа платёжным сервисом Кредиты зачисляются на Аккаунт Пользователя автоматически, как правило в течение нескольких минут; подписка Premium активируется так же и действует ${PREMIUM_PERIOD_DAYS} дней с момента оплаты (если Premium уже действует, новый срок добавляется к его окончанию).`,
        "Каждое построение натальной карты списывает один Кредит и считается оказанной услугой с момента, когда результат показан Пользователю. Кредиты не имеют срока действия, пока Сервис работает.",
        `Пока Premium действует, Пользователю доступно одно построение натальной карты за каждые ${PREMIUM_NATAL_CHART_INTERVAL_DAYS} дней без списания Кредитов: срок отсчитывается от предыдущего такого построения, а неиспользованные построения не накапливаются. Если такое построение уже использовано, очередное построение списывает один Кредит, как обычно.`,
        "Если платёж прошёл, а Кредиты не поступили в течение 24 часов, Пользователю следует написать Исполнителю по адресу из раздела «Реквизиты» — Исполнитель зачислит Кредиты или вернёт деньги.",
        "Если из-за технического сбоя построение карты не было выполнено, списанный Кредит восстанавливается.",
      ],
      en: [
        `The services are provided remotely and in digital form. Once the payment service confirms the payment, Credits are added to the User’s Account automatically, normally within a few minutes; a Premium subscription is activated in the same way and runs for ${PREMIUM_PERIOD_DAYS} days from the payment (if Premium is already active, the new period is added to its end).`,
        "Each natal-chart calculation uses one Credit and counts as a service rendered from the moment the result is shown to the User. Credits do not expire while the Service is operating.",
        `While Premium is active, the User may build one natal chart every ${PREMIUM_NATAL_CHART_INTERVAL_DAYS} days without using Credits: the period runs from the previous such calculation, and unused calculations do not accumulate. If that calculation has already been used, the next one uses one Credit as usual.`,
        "If a payment went through but no Credits arrived within 24 hours, the User should write to the Provider at the address in the “Details” section — the Provider will add the Credits or refund the money.",
        "If a calculation could not be completed because of a technical failure, the Credit used is restored.",
      ],
    },
  },
  {
    id: "refunds",
    title: { ru: "8. Возврат денежных средств и отказ от услуги", en: "8. Refunds and withdrawal from the contract" },
    body: {
      ru: [
        "Пользователь вправе в любое время отказаться от договора, оплатив Исполнителю фактически понесённые им расходы (статья 32 Закона о защите прав потребителей, статья 782 ГК РФ). Фактически оказанной услугой считается каждое построение натальной карты, результат которого уже показан Пользователю.",
        [
          `при отказе от неиспользованных Кредитов Исполнитель возвращает стоимость каждого неиспользованного Кредита: ${ru(perCredit)} ₽ за один Кредит пакета стоимостью ${NATAL_CHART_PRICE_RUB} ₽ (цена пакета, делённая на ${NATAL_CHART_PACK_CREDITS});`,
          "при отказе от подписки Premium Исполнитель возвращает оплату за неиспользованную часть оплаченного периода пропорционально оставшимся дням;",
          "построения натальной карты, уже выполненные и показанные Пользователю, возврату не подлежат, так как услуга оказана в полном объёме и надлежащего качества.",
        ],
        "Чтобы вернуть деньги, Пользователь направляет заявление на e-mail из раздела «Реквизиты» с указанием Аккаунта (e-mail или Telegram-имени), даты и способа оплаты. Заявление рассматривается в течение 10 дней со дня его получения (статья 31 Закона о защите прав потребителей).",
        "Возврат производится тем способом, которым была произведена оплата: на банковскую карту или счёт СБП — через платёжный сервис, через который была оплата (срок зачисления зависит от банка Пользователя); при оплате Telegram Stars — возвратом Stars через Telegram.",
        "Если услуга оказана ненадлежащим образом (например, из-за сбоя Сервиса), Пользователь вправе потребовать повторного оказания услуги либо возврата уплаченной суммы.",
      ],
      en: [
        "The User may withdraw from the contract at any time by paying the Provider for the costs actually incurred (Article 32 of the Consumer Rights Protection Law, Article 782 of the Civil Code). A natal-chart calculation whose result has already been shown to the User counts as a service actually rendered.",
        [
          `when withdrawing from unused Credits the Provider refunds the value of each unused Credit: ${ru(perCredit)} RUB per Credit of a pack priced at ${NATAL_CHART_PRICE_RUB} RUB (the pack price divided by ${NATAL_CHART_PACK_CREDITS});`,
          "when withdrawing from a Premium subscription the Provider refunds the unused part of the paid period in proportion to the remaining days;",
          "natal-chart calculations already completed and shown to the User are not refundable, because the service has been rendered in full and of proper quality.",
        ],
        "To get a refund the User sends a request to the e-mail address in the “Details” section, naming the Account (e-mail or Telegram name) and the date and method of payment. The request is considered within 10 days of receipt (Article 31 of the Consumer Rights Protection Law).",
        "The refund is made by the method used to pay: to the bank card or SBP account through the payment service used to pay (when it arrives depends on the User’s bank); for payments in Telegram Stars — by refunding the Stars through Telegram.",
        "If a service was provided improperly (for example because of a Service failure), the User may demand that it be provided again or that the amount paid be refunded.",
      ],
    },
  },
  {
    id: "user-duties",
    title: { ru: "9. Права, обязанности и интеллектуальная собственность", en: "9. Rights, duties and intellectual property" },
    body: {
      ru: [
        "Пользователь обязуется указывать достоверные данные, не передавать доступ к Аккаунту третьим лицам, не использовать Сервис для противоправных целей, не пытаться нарушить его работу и не собирать данные Сервиса автоматизированными средствами.",
        "Результаты расчётов предоставляются для личного некоммерческого использования. Пользователь не вправе перепродавать Кредиты, доступ к Аккаунту или результаты расчётов.",
        "Исполнитель вправе приостановить или прекратить доступ Пользователя к Сервису при существенном нарушении им условий оферты, возвратив при этом стоимость неиспользованных Кредитов и оплаченного, но не использованного периода подписки.",
        "Тексты, изображения карт, оформление, программный код и иные материалы Сервиса охраняются законодательством об интеллектуальной собственности. Оплата услуг не передаёт Пользователю исключительных прав на эти материалы; Пользователю предоставляется неисключительное право личного некоммерческого использования результатов расчётов и раскладов. Копирование и распространение материалов Сервиса без согласия Исполнителя запрещены.",
      ],
      en: [
        "The User undertakes to provide accurate data, not to share Account access with third parties, not to use the Service for unlawful purposes, not to try to disrupt its operation and not to collect the Service’s data by automated means.",
        "Calculation results are provided for personal, non-commercial use. The User may not resell Credits, Account access or calculation results.",
        "The Provider may suspend or end the User’s access to the Service in case of a material breach of this offer, refunding the value of unused Credits and the paid but unused part of a subscription period.",
        "The Service’s texts, card images, design, source code and other materials are protected by intellectual-property law. Paying for services does not transfer exclusive rights to those materials to the User; the User is granted a non-exclusive right to use calculation and reading results for personal, non-commercial purposes. Copying or distributing the Service’s materials without the Provider’s consent is prohibited.",
      ],
    },
  },
  {
    id: "liability",
    title: { ru: "10. Ответственность сторон", en: "10. Liability" },
    body: {
      ru: [
        "Стороны несут ответственность за неисполнение или ненадлежащее исполнение обязательств в соответствии с законодательством Российской Федерации.",
        "Исполнитель стремится обеспечить непрерывную работу Сервиса, но не гарантирует его бесперебойность: возможны плановые технические работы и сбои; порядок восстановления Кредитов и возврата денег при этом определён разделами 7 и 8.",
        "Исполнитель не отвечает за перебои в работе Сервиса, вызванные действиями третьих лиц, сбоями сетей связи, платёжных сервисов и мессенджера Telegram, а также иными обстоятельствами вне его разумного контроля; в таких случаях действует порядок восстановления Кредитов и возврата денег из раздела 7 и 8.",
        "Исполнитель не отвечает за решения и действия Пользователя, совершённые на основании толкований Сервиса (раздел 4).",
        "Стороны освобождаются от ответственности за неисполнение обязательств, вызванное обстоятельствами непреодолимой силы, если они непосредственно повлияли на исполнение.",
      ],
      en: [
        "The parties are liable for non-performance or improper performance of their obligations in accordance with the laws of the Russian Federation.",
        "The Provider aims to keep the Service running continuously but does not guarantee uninterrupted operation: planned maintenance and failures are possible; the restoration of Credits and refund procedure in sections 7 and 8 applies in that case.",
        "The Provider is not liable for interruptions of the Service caused by third parties, failures of communication networks, payment services or the Telegram messenger, or other circumstances beyond its reasonable control; in such cases the restoration of Credits and refund procedure in sections 7 and 8 applies.",
        "The Provider is not liable for decisions and actions of the User taken on the basis of the Service’s interpretations (section 4).",
        "The parties are released from liability for non-performance caused by force majeure if it directly affected performance.",
      ],
    },
  },
  {
    id: "personal-data",
    title: { ru: "11. Персональные данные", en: "11. Personal data" },
    body: {
      ru: [
        "Обработка персональных данных Пользователя осуществляется в соответствии с Политикой конфиденциальности и на основании отдельного Согласия на обработку персональных данных; оба документа размещены на отдельных страницах Сервиса. Акцепт настоящей оферты не заменяет такого согласия.",
      ],
      en: [
        "The User’s personal data is processed in accordance with the Privacy Policy and on the basis of the separate Consent to the Processing of Personal Data; both documents are on separate pages of the Service. Acceptance of this offer does not replace that consent.",
      ],
    },
  },
  {
    id: "claims",
    title: { ru: "12. Претензии и разрешение споров", en: "12. Claims and disputes" },
    body: {
      ru: [
        "Претензии направляются Исполнителю на e-mail из раздела «Реквизиты». Исполнитель рассматривает претензию и отвечает на неё в течение 10 дней со дня получения.",
        "Договор регулируется законодательством Российской Федерации. Споры, не урегулированные путём переговоров, разрешаются в суде в соответствии с законодательством; Пользователь-потребитель вправе обратиться в суд по месту своего жительства или пребывания, по месту заключения либо исполнения договора (статья 17 Закона о защите прав потребителей).",
      ],
      en: [
        "Claims are sent to the Provider at the e-mail address in the “Details” section. The Provider considers a claim and replies within 10 days of receiving it.",
        "The contract is governed by the laws of the Russian Federation. Disputes not settled by negotiation are resolved in court in accordance with the law; a User who is a consumer may sue in the court at their place of residence or stay, or where the contract was concluded or is performed (Article 17 of the Consumer Rights Protection Law).",
      ],
    },
  },
  {
    id: "changes",
    title: { ru: "13. Изменение оферты", en: "13. Changes to the offer" },
    body: {
      ru: [
        "Исполнитель вправе изменять оферту, публикуя новую редакцию на странице Сервиса; новая редакция действует с момента публикации. К Заказам, оплаченным до публикации, применяется редакция, действовавшая на дату оплаты. Дата и версия действующей редакции указаны в начале документа.",
      ],
      en: [
        "The Provider may amend the offer by publishing a new version on the Service’s page; the new version takes effect on publication. Orders paid before publication are governed by the version in force on the payment date. The date and version of the current text are shown at the top of the document.",
      ],
    },
  },
  {
    id: "details",
    title: { ru: "14. Реквизиты Исполнителя", en: "14. Provider’s details" },
    body: {
      ru: [
        [
          `Исполнитель: ${op.name}, самозанятый (плательщик налога на профессиональный доход)`,
          `Регистрационные данные: ${op.registration}`,
          ...(op.address ? [`Адрес: ${op.address}`] : []),
          ...(op.phone ? [`Телефон: ${op.phone}`] : []),
          `Электронная почта: ${op.email}`,
          ...(op.telegram ? [`Поддержка в Telegram: ${op.telegram}`] : []),
          `Сайт: ${op.siteUrl}`,
        ],
      ],
      en: [
        [
          `Provider: ${op.name}, self-employed (professional-income-tax payer)`,
          `Registration details: ${op.registration}`,
          ...(op.address ? [`Address: ${op.address}`] : []),
          ...(op.phone ? [`Phone: ${op.phone}`] : []),
          `E-mail: ${op.email}`,
          ...(op.telegram ? [`Telegram support: ${op.telegram}`] : []),
          `Website: ${op.siteUrl}`,
        ],
      ],
    },
  },
];
