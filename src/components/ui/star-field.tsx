import type { CSSProperties } from "react";
import { createSeededRandom } from "@/lib/rng";
import { cn } from "@/lib/utils";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  /** Drift path, in percent of the field — see the star-float keyframes in globals.css. */
  driftX: number;
  driftY: number;
  driftDuration: number;
  driftDelay: number;
}

const STAR_COUNT = 80;

// Fixed seed, computed once at module load — identical on server and client,
// so this never causes a hydration mismatch despite "looking" random.
function generateStars(): Star[] {
  const random = createSeededRandom("mystara-star-field-v2");
  return Array.from({ length: STAR_COUNT }, (_, id) => {
    const size = random() * 1.6 + 0.5;
    // Bigger stars read as "closer" — a simple parallax: they drift farther
    // and faster than the small, distant-looking ones.
    const depth = (size - 0.5) / 1.6;
    const angle = random() * Math.PI * 2;
    const distance = 4 + depth * 12; // percent of the field
    return {
      id,
      x: Number((random() * 100).toFixed(2)),
      y: Number((random() * 100).toFixed(2)),
      size: Number(size.toFixed(2)),
      delay: Number((random() * 6).toFixed(2)),
      duration: Number((random() * 3 + 3).toFixed(2)),
      opacity: Number((random() * 0.5 + 0.3).toFixed(2)),
      driftX: Number((Math.cos(angle) * distance).toFixed(2)),
      driftY: Number((Math.sin(angle) * distance).toFixed(2)),
      driftDuration: Number((55 - depth * 30 + random() * 10).toFixed(2)),
      driftDelay: Number((random() * -40).toFixed(2)), // negative = already mid-flight on load, not all starting in sync
    };
  });
}

const STARS = generateStars();

interface StarFieldProps {
  className?: string;
}

export function StarField({ className }: StarFieldProps) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {STARS.map((star) => (
        <div
          key={star.id}
          className="absolute motion-safe:animate-star-float"
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              "--drift-x": `${star.driftX}%`,
              "--drift-y": `${star.driftY}%`,
              animationDuration: `${star.driftDuration}s`,
              animationDelay: `${star.driftDelay}s`,
            } as CSSProperties
          }
        >
          <span
            className="block rounded-full bg-silver-200 motion-safe:animate-twinkle"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
