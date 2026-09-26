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
  /** Адрес для почтовых обращений. */
  address: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS || placeholder("адрес оператора"),
  /** Адрес электронной почты для обращений субъектов персональных данных. */
  email: process.env.NEXT_PUBLIC_OPERATOR_EMAIL || placeholder("e-mail для обращений"),
  /** Публичный адрес сайта. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  /** Название сервиса, как он называется в тексте документов. */
  serviceName: "Mystara",
} as const;

/** True while any operator detail is still a placeholder — used to warn in dev and by the tests. */
export function hasUnfilledOperatorDetails(): boolean {
  return [OPERATOR.name, OPERATOR.registration, OPERATOR.address, OPERATOR.email].some((value) => value.startsWith("["));
}

/**
 * Bump on any material change to the policy or the consent text. It's stored
 * next to each user's consent timestamp, so it's always possible to say which
 * version of the text a given person actually agreed to.
 */
export const PRIVACY_POLICY_VERSION = "2026-09-26";

/** Human-readable date the current version took effect (dd.mm.yyyy for the Russian text). */
export const PRIVACY_POLICY_EFFECTIVE_DATE = { ru: "26.09.2026", en: "26 September 2026" } as const;
