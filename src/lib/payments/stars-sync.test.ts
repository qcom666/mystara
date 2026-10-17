import { describe, expect, it, vi } from "vitest";
import { fetchIncomingStarPayments, groupUnrecordedCharges } from "./stars-sync";

const page = (transactions: unknown[]) => new Response(JSON.stringify({ ok: true, result: { transactions } }), { status: 200 });

describe("история транзакций Звёзд", () => {
  const since = new Date("2026-10-15T00:00:00Z");
  const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

  it("берёт только оплаты счетов пользователями после указанного момента", async () => {
    const fetchImpl = vi.fn(async () =>
      page([
        { id: "old", amount: 150, date: at("2026-10-10T00:00:00Z"), source: { type: "user", transaction_type: "invoice_payment", invoice_payload: "p0" } },
        { id: "c1", amount: 150, date: at("2026-10-16T00:00:00Z"), source: { type: "user", transaction_type: "invoice_payment", invoice_payload: "p1", user: { id: 42 } } },
        { id: "gift", amount: 50, date: at("2026-10-16T00:00:00Z"), source: { type: "user", transaction_type: "gift_purchase" } },
        { id: "fragment", amount: 10, date: at("2026-10-16T00:00:00Z"), source: { type: "fragment" } },
        { id: "c1", amount: 150, date: at("2026-10-17T00:00:00Z"), receiver: { type: "user" } },
      ]),
    );
    await expect(fetchIncomingStarPayments("t", since, fetchImpl as never)).resolves.toEqual([
      { chargeId: "c1", purchaseId: "p1", amount: 150, paidAt: new Date("2026-10-16T00:00:00Z"), telegramUserId: "42", subscriptionPeriod: null },
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("читает историю постранично, пока страница полная", async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ id: `x${i}`, amount: 1, date: at("2026-10-16T00:00:00Z"), source: { type: "user", invoice_payload: `q${i}` } }));
    const fetchImpl = vi.fn().mockResolvedValueOnce(page(full)).mockResolvedValueOnce(page([]));
    const result = await fetchIncomingStarPayments("t", since, fetchImpl as never);
    expect(result).toHaveLength(100);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(JSON.parse((fetchImpl.mock.calls[1] as unknown as [string, { body: string }])[1].body)).toEqual({ offset: 100, limit: 100 });
  });

  it("списания по подписке берутся все, с периодом подписки", async () => {
    const source = { type: "user", transaction_type: "invoice_payment", invoice_payload: "sub1", subscription_period: 2_592_000, user: { id: 42 } };
    const fetchImpl = vi.fn(async () =>
      page([
        { id: "c1", amount: 150, date: at("2026-10-15T10:00:00Z"), source },
        { id: "c2", amount: 150, date: at("2026-10-16T10:00:00Z"), source },
      ]),
    );
    const result = await fetchIncomingStarPayments("t", since, fetchImpl as never);
    expect(result?.map((payment) => [payment.chargeId, payment.purchaseId, payment.subscriptionPeriod])).toEqual([
      ["c1", "sub1", 2_592_000],
      ["c2", "sub1", 2_592_000],
    ]);
  });

  it("ошибка Telegram — null, а не пустой список (чтобы не закрыть покупки по ошибке)", async () => {
    await expect(fetchIncomingStarPayments("t", since, (async () => new Response("{}", { status: 502 })) as never)).resolves.toBeNull();
  });
});

describe("какие списания выдавать при сверке", () => {
  const payment = (chargeId: string, purchaseId: string, iso: string) => ({
    chargeId,
    purchaseId,
    amount: 150,
    paidAt: new Date(iso),
    telegramUserId: "42",
    subscriptionPeriod: 2_592_000,
  });

  it("по каждому счёту — ещё не записанные списания от старых к новым, без повторов", () => {
    const grouped = groupUnrecordedCharges(
      [
        payment("renewal-2", "sub1", "2026-12-01T00:00:00Z"),
        payment("first", "sub1", "2026-10-02T00:00:00Z"),
        payment("renewal-1", "sub1", "2026-11-01T00:00:00Z"),
        payment("renewal-1", "sub1", "2026-11-01T00:00:00Z"),
        payment("other", "p2", "2026-11-05T00:00:00Z"),
      ],
      new Set(["first"]),
    );
    expect(grouped.get("sub1")?.map((item) => item.chargeId)).toEqual(["renewal-1", "renewal-2"]);
    expect(grouped.get("p2")?.map((item) => item.chargeId)).toEqual(["other"]);
  });
});
