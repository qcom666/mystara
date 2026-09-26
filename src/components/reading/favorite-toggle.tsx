"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface FavoriteToggleProps {
  readingId: string;
  initialFavorite: boolean;
}

export function FavoriteToggle({ readingId, initialFavorite }: FavoriteToggleProps) {
  const t = useTranslation();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !isFavorite;
    setIsFavorite(next);
    setPending(true);
    try {
      const response = await fetch(`/api/readings/${readingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!response.ok) throw new Error("failed");
    } catch {
      setIsFavorite(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant={isFavorite ? "primary" : "outline"} size="sm" onClick={toggle} disabled={pending}>
      <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
      {isFavorite ? t.common.favoritedCta : t.common.favoriteCta}
    </Button>
  );
}
