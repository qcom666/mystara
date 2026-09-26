import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FavoritesView, type FavoritesData } from "@/components/tarot/favorites-view";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { listFavorites } from "@/lib/repositories/favorite.repository";
import { getCardById } from "@/modules/tarot/domain/deck";
import { getSpreadById } from "@/modules/tarot/domain/spreads.data";

export const metadata: Metadata = { title: "My Favorites" };

export default async function FavoritesPage() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isDatabaseConfigured()) {
    return <FavoritesView data={{ status: "unconfigured" }} />;
  }

  const favorites = await listFavorites(session.user.id);
  const data: FavoritesData = {
    status: "ready",
    favoriteCards: favorites
      .filter((favorite) => favorite.type === "CARD")
      .map((favorite) => getCardById(favorite.targetId))
      .filter((card) => card !== undefined),
    favoriteSpreads: favorites
      .filter((favorite) => favorite.type === "SPREAD")
      .map((favorite) => getSpreadById(favorite.targetId))
      .filter((spread) => spread !== undefined),
  };

  return <FavoritesView data={data} />;
}
