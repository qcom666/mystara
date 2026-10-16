import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth-tokens";

export type TokenPurpose = "reset" | "verify";

/**
 * Создаёт одноразовый токен и возвращает его открытый вид (для письма). На один идентификатор действует
 * один токен: новый запрос отменяет предыдущий. В базе лежит только хеш.
 */
export async function issueToken(purpose: TokenPurpose, subject: string, ttlMs: number): Promise<string> {
  const identifier = `${purpose}:${subject}`;
  const token = generateToken();
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({ data: { identifier, token: hashToken(token), expires: new Date(Date.now() + ttlMs) } }),
  ]);
  return token;
}

/**
 * Проверяет токен и тут же гасит его (использовать можно один раз, даже если срок не вышел). Возвращает
 * то, что было записано при выдаче (`subject`), или null, если токен неверный, чужого назначения,
 * просрочен или уже использован.
 */
export async function consumeToken(purpose: TokenPurpose, token: string): Promise<string | null> {
  const hashed = hashToken(token);
  return prisma.$transaction(async (tx) => {
    const row = await tx.verificationToken.findUnique({ where: { token: hashed } });
    if (!row || !row.identifier.startsWith(`${purpose}:`)) return null;
    const removed = await tx.verificationToken.deleteMany({ where: { token: hashed } });
    if (removed.count === 0) return null;
    if (row.expires.getTime() <= Date.now()) return null;
    return row.identifier.slice(purpose.length + 1);
  });
}
