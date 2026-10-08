import { AnthropicAIProvider } from "./providers/anthropic-provider";
import { MockAIProvider } from "./providers/mock-provider";
import { getInterpretationDisclaimer, type AIInterpretationProvider, type AIInterpretationRequest, type AIInterpretationResult, type InterpretationLocale } from "./types";

const mockProvider = new MockAIProvider();

/**
 * Единственное место, где решается, какая LLM (если есть) стоит за толкованиями. Больше нигде в коде
 * @anthropic-ai/sdk напрямую не импортируется: замена или добавление провайдера затрагивает только
 * этот файл и `providers/`.
 */
export function getAIInterpretationProvider(): AIInterpretationProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return new AnthropicAIProvider(apiKey, process.env.ANTHROPIC_MODEL);
  }
  return mockProvider;
}

// Вывод провайдера, который уже содержит оговорку (на любом языке), не трогаем; в остальных случаях
// дописываем стандартную оговорку для этого языка.
const DISCLAIMER_MARKERS = ["reflective", "not a guaranteed", "рефлексивн", "не гарантированн"];

function withDisclaimer(result: AIInterpretationResult, locale: InterpretationLocale): AIInterpretationResult {
  const lower = result.overall.toLowerCase();
  if (DISCLAIMER_MARKERS.some((marker) => lower.includes(marker))) {
    return result;
  }
  return { ...result, overall: `${result.overall} ${getInterpretationDisclaimer(locale)}` };
}

/**
 * Серверная точка входа (вызывается из /api/ai/interpret). Если настроенный провайдер выбросил ошибку,
 * переключается на Mock-провайдер, так что сбойная или недоступная LLM не ломает весь расклад.
 */
export async function generateInterpretation(request: AIInterpretationRequest): Promise<AIInterpretationResult> {
  const provider = getAIInterpretationProvider();
  const locale = request.locale ?? "en";

  if (provider.id === "mock") {
    return withDisclaimer(await provider.generate(request), locale);
  }

  try {
    return withDisclaimer(await provider.generate(request), locale);
  } catch (error) {
    console.error(`[ai-interpretation] provider "${provider.id}" failed, falling back to mock:`, error);
    return withDisclaimer(await mockProvider.generate(request), locale);
  }
}

export type { AIInterpretationRequest, AIInterpretationResult } from "./types";
