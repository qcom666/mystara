/**
 * Who the "operator" of personal data is, for the privacy policy and the
 * consent form (152-ФЗ requires both to name the operator and give a contact).
 *
 * These come from environment variables so real details never live in the
 * repo — and until they're set, the legal pages show obvious `[…]`
 * placeholders instead of invented details. Publishing a policy with
 * placeholders still in it is a mistake, but it's a far safer mistake than
 * publishing one with fabricated legal identity. See TODO.md "Legal".
 */
const placeholder = (label: string) => `[${label}]`;

export const OPERATOR = {
  /** ФИО (ИП / самозанятый / физлицо) или полное наименование юрлица. */
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME || placeholder("ФИО или наименование оператора"),
  /** ИНН и, при наличии, ОГРН / ОГРНИП. */
  registration: process.env.NEXT_PUBLIC_OPERATOR_REGISTRATION || placeholder("ИНН / ОГРН(ИП)"),
  /** Адрес для почтовых обращений — необязательный: пока не задан, нигде не показывается (достаточно e-mail и телефона). */
  address: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS || "",
  /** Адрес электронной почты для обращений субъектов персональных данных. */
  email: process.env.NEXT_PUBLIC_OPERATOR_EMAIL || placeholder("e-mail для обращений"),
  /** Телефон для обращений (необязательный). */
  phone: process.env.NEXT_PUBLIC_OPERATOR_PHONE || "",
  /** Публичный адрес сайта. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  /** Название сервиса, как он называется в тексте документов. */
  serviceName: "Mystara",
} as const;

/** True while any operator detail is still a placeholder — used to warn in dev and by the tests. */
export function hasUnfilledOperatorDetails(): boolean {
  return [OPERATOR.name, OPERATOR.registration, OPERATOR.email].some((value) => value.startsWith("["));
}

/**
 * Bump on any material change to the policy or the consent text. It's stored
 * next to each user's consent timestamp, so it's always possible to say which
 * version of the text a given person actually agreed to.
 */
export const PRIVACY_POLICY_VERSION = "2026-09-26";

/** " или по адресу: …" — only when a postal address is configured, so the documents never print an empty or placeholder address. */
export const ADDRESS_CLAUSE = {
  ru: OPERATOR.address ? ` или по адресу: ${OPERATOR.address}` : "",
  en: OPERATOR.address ? ` or to: ${OPERATOR.address}` : "",
} as const;

/** Version and effective date of the public offer (оферта) — bump on any material change, like the privacy policy. */
export const OFFER_VERSION = "2026-10-03";
export const OFFER_EFFECTIVE_DATE = { ru: "03.10.2026", en: "3 October 2026" } as const;

/** Human-readable date the current version took effect (dd.mm.yyyy for the Russian text). */
export const PRIVACY_POLICY_EFFECTIVE_DATE = { ru: "26.09.2026", en: "26 September 2026" } as const;
