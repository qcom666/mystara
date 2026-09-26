import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getCardKeywords, getCardMeanings, getCardName } from "@/modules/tarot/domain/deck";
import { getPositionLabel, getPositionMeaning, getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { AIInterpretationProvider, AIInterpretationRequest, AIInterpretationResult } from "../types";

const RESULT_SCHEMA = z.object({
  summary: z.string(),
  overall: z.string(),
  themes: z.array(z.string()),
  advice: z.array(z.string()),
  challenges: z.array(z.string()),
  cardInterpretations: z.array(
    z.object({
      positionId: z.string(),
      cardId: z.string(),
      interpretation: z.string(),
    }),
  ),
});

const TOOL_NAME = "record_tarot_interpretation";

const INTERPRETATION_TOOL: Anthropic.Tool = {
  name: TOOL_NAME,
  description: "Records a structured interpretation of a tarot reading.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "One-sentence summary of the reading." },
      overall: { type: "string", description: "2-4 sentence overall interpretation." },
      themes: { type: "array", items: { type: "string" }, description: "3-5 short theme keywords." },
      advice: { type: "array", items: { type: "string" }, description: "1-3 concrete, hedged pieces of advice." },
      challenges: { type: "array", items: { type: "string" }, description: "1-3 potential challenges to watch for." },
      cardInterpretations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            positionId: { type: "string" },
            cardId: { type: "string" },
            interpretation: { type: "string", description: "1-2 sentence interpretation of this card in this position." },
          },
          required: ["positionId", "cardId", "interpretation"],
        },
      },
    },
    required: ["summary", "overall", "themes", "advice", "challenges", "cardInterpretations"],
  },
};

const SYSTEM_PROMPT = `You are a thoughtful, emotionally intelligent tarot reading assistant embedded in a tarot app.
Ground every interpretation in the traditional card meanings provided in the input JSON — do not invent alternate meanings.
Tone: warm, symbolic, reflective, concise. Use hedged language such as "this may suggest", "symbolically, this can represent", "one possible interpretation is" — never state outcomes as certain or guaranteed.
Never present the reading as a guaranteed prediction of future events, and never give definitive financial, medical, or legal advice — reframe those topics symbolically and emotionally instead.
Always respond by calling the ${TOOL_NAME} tool exactly once with your full response — never respond in plain text.`;

const LANGUAGE_INSTRUCTION: Record<"en" | "ru", string> = {
  en: "Write every string in your response in English.",
  ru: "Write every string in your response in natural, fluent Russian (русский язык), including summary, overall, themes, advice, challenges, and every card interpretation. The input JSON is already in Russian; keep card and position names exactly as given.",
};

/**
 * Real LLM-backed provider. Only ever instantiated server-side by the
 * factory in ai-interpretation.service.ts when ANTHROPIC_API_KEY is set —
 * the key never reaches client code (see PROJECT_ARCHITECTURE.md §8).
 */
export class AnthropicAIProvider implements AIInterpretationProvider {
  readonly id = "anthropic";
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    if (!apiKey) {
      throw new Error("AnthropicAIProvider requires an API key.");
    }
    this.client = new Anthropic({ apiKey });
    this.model = model || "claude-sonnet-5";
  }

  async generate(request: AIInterpretationRequest): Promise<AIInterpretationResult> {
    const { question, spread, cards } = request;
    const locale = request.locale ?? "en";

    const userPayload = {
      question,
      spread: { name: getSpreadName(spread, locale), description: getSpreadDescription(spread, locale) },
      cards: cards.map((drawn) => {
        const meanings = getCardMeanings(drawn.card, locale);
        return {
          position: getPositionLabel(drawn.position, locale),
          positionMeaning: getPositionMeaning(drawn.position, locale),
          cardId: drawn.card.id,
          cardName: getCardName(drawn.card, locale),
          orientation: drawn.orientation,
          keywords: getCardKeywords(drawn.card, locale),
          meaning: drawn.orientation === "upright" ? meanings.upright : meanings.reversed,
          loveMeaning: meanings.love,
          careerMeaning: meanings.career,
          financeMeaning: meanings.finance,
          spiritualMeaning: meanings.spiritual,
        };
      }),
    };

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: `${SYSTEM_PROMPT}\n${LANGUAGE_INSTRUCTION[locale]}`,
      tools: [INTERPRETATION_TOOL],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [{ role: "user", content: `Tarot reading data (JSON):\n\n${JSON.stringify(userPayload, null, 2)}` }],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse) {
      throw new Error("Anthropic response did not include the expected tool_use block.");
    }

    const parsed = RESULT_SCHEMA.parse(toolUse.input);

    return {
      provider: this.id,
      ...parsed,
      generatedAt: new Date().toISOString(),
    };
  }
}
