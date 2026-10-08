import { getLifePathMeaning } from "./life-path-meanings.data";
import type { LifePathNumber, NumerologyNumberType } from "./types";

type Locale = "en" | "ru";

interface NumberTypeInfo {
  label: string;
  subtitle: string;
  labelRu: string;
  subtitleRu: string;
}

export const NUMBER_TYPE_INFO: Record<NumerologyNumberType, NumberTypeInfo> = {
  lifePath: {
    label: "Life Path",
    subtitle: "The overall shape of your journey",
    labelRu: "Жизненный путь",
    subtitleRu: "Общий контур вашего пути",
  },
  birthday: {
    label: "Birthday Number",
    subtitle: "A natural talent you carry",
    labelRu: "Число дня рождения",
    subtitleRu: "Природный талант, который вы несёте",
  },
  expression: {
    label: "Expression Number",
    subtitle: "What you're here to do",
    labelRu: "Число выражения",
    subtitleRu: "Для чего вы здесь",
  },
  soulUrge: {
    label: "Soul Urge Number",
    subtitle: "What you inwardly want",
    labelRu: "Число души",
    subtitleRu: "Чего вы желаете внутри",
  },
  personality: {
    label: "Personality Number",
    subtitle: "How others read you at first",
    labelRu: "Число личности",
    subtitleRu: "Как вас видят с первого взгляда",
  },
  maturity: {
    label: "Maturity Number",
    subtitle: "Who you grow into later in life",
    labelRu: "Число зрелости",
    subtitleRu: "Кем вы становитесь позже в жизни",
  },
};

export function getNumberTypeLabels(type: NumerologyNumberType, locale: Locale): { label: string; subtitle: string } {
  const info = NUMBER_TYPE_INFO[type];
  return locale === "ru" ? { label: info.labelRu, subtitle: info.subtitleRu } : { label: info.label, subtitle: info.subtitle };
}

/**
 * Составляет описание для каждого типа числа из уже богатого содержимого числа жизненного пути
 * (заголовок + ключевые слова), а не пишет вручную ~60 новых длинных записей: *основной* смысл числа
 * традиционно излагается один раз, а затем применяется в контексте (выражение, число души и т.д.
 * опираются на одну и ту же суть, обращённую к другому вопросу); это и соответствует тому, как
 * нумерология обычно подаётся, и намного проще поддерживать.
 *
 * В русских предложениях ключевые слова и архетип взяты в «…», чтобы их не приходилось склонять:
 * тот же приём, что в шаблонах младших арканов.
 */
export function describeNumberForType(number: LifePathNumber, type: NumerologyNumberType, locale: Locale = "en"): string {
  const meaning = getLifePathMeaning(number, locale);
  const [firstKeyword, secondKeyword] = meaning.keywords;

  if (locale === "ru") {
    const essence = meaning.title;
    switch (type) {
      case "lifePath":
        return meaning.description;
      case "birthday":
        return `Природный дар, который проходит через всю вашу жизнь: «${firstKeyword}» и «${secondKeyword}» — в духе архетипа «${essence}».`;
      case "expression":
        return `Возможно, вы здесь, чтобы нести в мир темы «${firstKeyword}» и «${secondKeyword}» — энергия архетипа «${essence}» проявляется в том, что вы делаете.`;
      case "soulUrge":
        return `В глубине души вас тянет к темам «${firstKeyword}» и «${secondKeyword}» — это внутренняя мотивация архетипа «${essence}».`;
      case "personality":
        return `С первого взгляда окружающие, скорее всего, видят в вас архетип «${essence}» — «${firstKeyword}», «${secondKeyword}» — ещё до того, как узнают вас глубже.`;
      case "maturity":
        return `Позже в жизни этот расклад может указывать на постепенное вхождение в архетип «${essence}» — темы «${firstKeyword}» и «${secondKeyword}» проявляются всё отчётливее.`;
      default:
        return meaning.description;
    }
  }

  const essence = meaning.title.replace(/^The /, "");
  switch (type) {
    case "lifePath":
      return meaning.description;
    case "birthday":
      return `A natural gift running through your life: ${firstKeyword} and ${secondKeyword}, in the spirit of ${essence}.`;
    case "expression":
      return `This may suggest you're here to bring ${firstKeyword} and ${secondKeyword} into the world — the energy of ${essence} showing up in what you do.`;
    case "soulUrge":
      return `Underneath it all, there's a pull toward ${firstKeyword} and ${secondKeyword} — the inward motivation of ${essence}.`;
    case "personality":
      return `On first impression, people likely read ${essence} in you — ${firstKeyword}, ${secondKeyword} — before they know you any deeper.`;
    case "maturity":
      return `Later in life, this reading may suggest a settling into ${essence} — ${firstKeyword} and ${secondKeyword} coming more fully into focus.`;
    default:
      return meaning.description;
  }
}
