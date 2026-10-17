import { describe, expect, it } from "vitest";
import { FUNNEL, sanitizeEvent, STORED_EVENTS } from "./analytics-events";

describe("sanitizeEvent", () => {
  it("оставляет только разрешённые поля", () => {
    expect(sanitizeEvent({ name: "reading_started", spreadId: "three-card", hasQuestion: true, question: "Сменить ли работу?" })).toEqual({
      name: "reading_started",
      props: { spreadId: "three-card", hasQuestion: true },
    });
  });

  it("выбрасывает идентификаторы людей и раскладов", () => {
    expect(sanitizeEvent({ name: "reading_saved", readingId: "cmv123" })).toEqual({ name: "reading_saved", props: {} });
    expect(sanitizeEvent({ name: "telegram_session_started", telegramId: "7356529652" })).toEqual({ name: "telegram_session_started", props: {} });
    expect(sanitizeEvent({ name: "signup_completed", userId: "u1" })).toEqual({ name: "signup_completed", props: {} });
  });

  it("отвергает неизвестные события и странные значения", () => {
    expect(sanitizeEvent({ name: "card_drawn", cardId: "the-fool" })).toBeNull();
    expect(sanitizeEvent({ name: "__proto__" })).toBeNull();
    expect(sanitizeEvent(null)).toBeNull();
    expect(sanitizeEvent({ name: "reading_shared", spreadId: "<script>alert(1)</script>", channel: "image" })).toEqual({
      name: "reading_shared",
      props: { channel: "image" },
    });
  });

  it("каждый шаг воронки есть в белом списке", () => {
    for (const name of FUNNEL) expect(Object.hasOwn(STORED_EVENTS, name)).toBe(true);
  });
});
