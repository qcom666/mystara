import { AnthropicAIProvider } from "./providers/anthropic-provider";
import { MockAIProvider } from "./providers/mock-provider";
import { getInterpretationDisclaimer, type AIInterpretationProvider, type AIInterpretationRequest, type AIInterpretationResult, type InterpretationLocale } from "./types";

const mockProvider = new MockAIProvider();

/**
 * The only place that decides which LLM (if any) backs interpretations.
 * Nothing else in the codebase imports @anthropic-ai/sdk directly — swapping
 * or adding a provider is a change confined to this file + `providers/`.
 */
export function getAIInterpretationProvider(): AIInterpretationProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return new AnthropicAIProvider(apiKey, process.env.ANTHROPIC_MODEL);
  }
  return mockProvider;
}

// Provider output that already carries a disclaimer (in either language) is
// left alone; anything else gets the locale's standard one appended.
const DISCLAIMER_MARKERS = ["reflective", "not a guaranteed", "рефлексивн", "не гарантированн"];

function withDisclaimer(result: AIInterpretationResult, locale: InterpretationLocale): AIInterpretationResult {
  const lower = result.overall.toLowerCase();
  if (DISCLAIMER_MARKERS.some((marker) => lower.includes(marker))) {
    return result;
  }
  return { ...result, overall: `${result.overall} ${getInterpretationDisclaimer(locale)}` };
}

/**
 * Server-only entry point (called from /api/ai/interpret). Falls back to the
 * Mock provider if the configured provider throws, so a flaky/unavailable
 * LLM never fails the whole reading (see PROJECT_ARCHITECTURE.md §24).
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
