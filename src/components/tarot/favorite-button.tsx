"use client";

import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type FavoriteType = "CARD" | "SPREAD";

interface FavoriteRecord {
  type: FavoriteType;
  targetId: string;
}

interface FavoriteButtonProps {
  type: FavoriteType;
  targetId: string;
}

/**
 * Self-contained: reads its own session + favorite status client-side so the
 * card/spread detail pages that host it can stay statically generated
 * (see generateStaticParams in those pages) rather than becoming dynamic
 * just to check "is this favorited".
 */
export function FavoriteButton({ type, targetId }: FavoriteButtonProps) {
  const t = useTranslation();
  const { status } = useSession();
  const [favorited, setFavorited] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    fetch("/api/favorites")
      .then((response) => (response.ok ? response.json() : { favorites: [] }))
      .then((data: { favorites?: FavoriteRecord[] }) => {
        if (cancelled) return;
        setFavorited(Boolean(data.favorites?.some((f) => f.type === type && f.targetId === targetId)));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [status, type, targetId]);

  if (status === "loading") {
    return null;
  }

  if (status !== "authenticated") {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">
          <Star className="h-4 w-4" />
          {t.common.signInToFavorite}
        </Link>
      </Button>
    );
  }

  async function toggle() {
    const next = !favorited;
    setFavorited(next);
    setError(false);
    setPending(true);
    try {
      const response = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId }),
      });
      if (!response.ok) throw new Error("request_failed");
    } catch {
      setFavorited(!next);
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button variant={favorited ? "primary" : "outline"} size="sm" onClick={toggle} disabled={pending || !loaded}>
        <Star className={cn("h-4 w-4", favorited && "fill-current")} />
        {favorited ? t.common.favoritedCta : t.common.favoriteCta}
      </Button>
      {error && <p className="mt-1 text-xs text-red-400">{t.common.favoriteUpdateError}</p>}
    </div>
  );
}
