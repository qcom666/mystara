import { prisma } from "@/lib/db";

export type FavoriteType = "CARD" | "SPREAD";

export async function addFavorite(userId: string, type: FavoriteType, targetId: string) {
  return prisma.favorite.upsert({
    where: { userId_type_targetId: { userId, type, targetId } },
    create: { userId, type, targetId },
    update: {},
  });
}

export async function removeFavorite(userId: string, type: FavoriteType, targetId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, type, targetId } });
}

export async function listFavorites(userId: string) {
  return prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}
