/**
 * Кто является «оператором» персональных данных, для политики конфиденциальности и формы согласия
 * (152-ФЗ требует указать в обоих оператора и контакт).
 *
 * Данные берутся из переменных окружения, чтобы настоящие реквизиты не хранились в репозитории: пока
 * они не заданы, юридические страницы показывают заметные заглушки `[…]`, а не выдуманные данные.
 * Опубликовать политику с заглушками — ошибка, но гораздо безопаснее, чем опубликовать выдуманную
 * юридическую личность.
 */
const placeholder = (label: string) => `[${label}]`;

/**
 * «Mystara_Support», «@Mystara_Support» и « @Mystara_Support » превращаются в «@Mystara_Support»;
 * если не задано, пустая строка.
 */
function normalizeTelegramHandle(raw: string | undefined): string {
  const handle = (raw ?? "").trim().replace(/^@/, "");
  return /^[A-Za-z0-9_]{4,32}$/.test(handle) ? `@${handle}` : "";
}

function telegramUrl(raw: string | undefined): string {
  const handle = normalizeTelegramHandle(raw);
  return handle ? `https://t.me/${handle.slice(1)}` : "";
}

/**
 * Российский номер из 11 цифр (в начале 7 или 8, остальное — любые разделители) приводится к «7XXXXXXXXXX»;
 * всё остальное считается незаданным номером.
 */
function phoneDigits(raw: string | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length === 11 && (digits[0] === "7" || digits[0] === "8") ? `7${digits.slice(1)}` : "";
}

/** «8 (962) 454-00-15» превращается в «+7 962 454-00-15»; если номер не задан, пустая строка. */
function formatPhone(raw: string | undefined): string {
  const d = phoneDigits(raw);
  return d ? `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}` : "";
}

function phoneUrl(raw: string | undefined): string {
  const d = phoneDigits(raw);
  return d ? `tel:+${d}` : "";
}

export const OPERATOR = {
  /** ФИО (ИП / самозанятый / физлицо) или полное наименование юрлица. */
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME || placeholder("ФИО или наименование оператора"),
  /** ИНН и, при наличии, ОГРН / ОГРНИП. */
  registration: process.env.NEXT_PUBLIC_OPERATOR_REGISTRATION || placeholder("ИНН / ОГРН(ИП)"),
  /** Адрес для почтовых обращений — необязательный: пока не задан, нигде не показывается (достаточно e-mail и Telegram поддержки). */
  address: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS || "",
  /** Адрес электронной почты для обращений субъектов персональных данных. */
  email: process.env.NEXT_PUBLIC_OPERATOR_EMAIL || placeholder("e-mail для обращений"),
  /** Телефон для обращений, например +7 962 454-00-15 (необязательный: пока не задан, нигде не показывается). */
  phone: formatPhone(process.env.NEXT_PUBLIC_OPERATOR_PHONE),
  /** Ссылка `tel:` на этот номер (пусто, если он не задан). */
  phoneUrl: phoneUrl(process.env.NEXT_PUBLIC_OPERATOR_PHONE),
  /** Telegram-аккаунт службы поддержки, например @Mystara_Support (необязательный). */
  telegram: normalizeTelegramHandle(process.env.NEXT_PUBLIC_OPERATOR_TELEGRAM),
  /** Ссылка на этот аккаунт (пусто, если он не задан). */
  telegramUrl: telegramUrl(process.env.NEXT_PUBLIC_OPERATOR_TELEGRAM),
  /** Публичный адрес сайта. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  /** Название сервиса, как он называется в тексте документов. */
  serviceName: "Mystara",
} as const;

/**
 * true, пока хотя бы одно из данных оператора остаётся заглушкой: используется для предупреждения
 * при разработке и в тестах.
 */
export function hasUnfilledOperatorDetails(): boolean {
  return [OPERATOR.name, OPERATOR.registration, OPERATOR.email].some((value) => value.startsWith("["));
}

/**
 * Увеличивать при любом существенном изменении политики или текста согласия. Хранится рядом с отметкой
 * времени согласия каждого пользователя, поэтому всегда можно сказать, на какую версию текста человек
 * согласился.
 */
export const PRIVACY_POLICY_VERSION = "2026-10-06";

/**
 * « или по адресу: …» — только если задан почтовый адрес: документы никогда не выводят пустой адрес
 * или заглушку.
 */
export const ADDRESS_CLAUSE = {
  ru: OPERATOR.address ? ` или по адресу: ${OPERATOR.address}` : "",
  en: OPERATOR.address ? ` or to: ${OPERATOR.address}` : "",
} as const;

/**
 * Версия и дата вступления в силу публичной оферты: повышать при любом существенном изменении,
 * как и версию политики.
 */
export const OFFER_VERSION = "2026-10-13";
export const OFFER_EFFECTIVE_DATE = { ru: "13.10.2026", en: "13 October 2026" } as const;

/** Дата вступления в силу текущей версии в читаемом виде (дд.мм.гггг для русского текста). */
export const PRIVACY_POLICY_EFFECTIVE_DATE = { ru: "06.10.2026", en: "6 October 2026" } as const;
