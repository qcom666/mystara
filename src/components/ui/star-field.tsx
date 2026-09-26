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
}

const STAR_COUNT = 80;

// Fixed seed, computed once at module load — identical on server and client,
// so this never causes a hydration mismatch despite "looking" random.
function generateStars(): Star[] {
  const random = createSeededRandom("mystara-star-field-v1");
  return Array.from({ length: STAR_COUNT }, (_, id) => ({
    id,
    x: Number((random() * 100).toFixed(2)),
    y: Number((random() * 100).toFixed(2)),
    size: Number((random() * 1.6 + 0.5).toFixed(2)),
    delay: Number((random() * 6).toFixed(2)),
    duration: Number((random() * 3 + 3).toFixed(2)),
    opacity: Number((random() * 0.5 + 0.3).toFixed(2)),
  }));
}

const STARS = generateStars();

interface StarFieldProps {
  className?: string;
}

export function StarField({ className }: StarFieldProps) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {STARS.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-silver-200 motion-safe:animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
