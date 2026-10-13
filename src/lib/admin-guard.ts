import { notFound } from "next/navigation";
import { isAdminAccount } from "./admin";
import { auth } from "./auth";
import { isDatabaseConfigured, prisma } from "./db";

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
}

/**
 * Администратор текущего запроса или null. Права проверяются на сервере при КАЖДОМ обращении к странице
 * или API админ-панели по актуальным спискам в окружении; признак `session.user.isAdmin`, который видит
 * браузер, нужен только чтобы показать ссылку и ничего не разрешает.
 */
export async function getAdmin(): Promise<AdminUser | null> {
  if (!isDatabaseConfigured()) return null;
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, telegramId: true } });
  if (!user || !isAdminAccount(user)) return null;
  return { id: user.id, name: user.name, email: user.email };
}

/**
 * Для страниц админ-панели: не-администратор видит обычную страницу «не найдено», как будто панели нет.
 * Вызывается в каждой странице, а не только в общей раскладке: раскладка не перерисовывается при
 * переходах внутри панели, и полагаться на неё одну нельзя.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) notFound();
  return admin;
}
