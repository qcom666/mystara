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
  /** Траектория дрейфа в процентах от поля; см. keyframes star-float в globals.css. */
  driftX: number;
  driftY: number;
  driftDuration: number;
  driftDelay: number;
}

const STAR_COUNT = 80;

// Фиксированное зерно, считается один раз при загрузке модуля: на сервере и на клиенте одинаково,
// поэтому, несмотря на «случайный» вид, не вызывает ошибку гидратации.
function generateStars(): Star[] {
  const random = createSeededRandom("mystara-star-field-v2");
  return Array.from({ length: STAR_COUNT }, (_, id) => {
    const size = random() * 1.6 + 0.5;
    // Большие звёзды кажутся «ближе»: простой параллакс, они дрейфуют дальше и быстрее мелких, дальних.
    const depth = (size - 0.5) / 1.6;
    const angle = random() * Math.PI * 2;
    const distance = 4 + depth * 12; // в процентах от поля
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
      driftDelay: Number((random() * -40).toFixed(2)), // отрицательное значение: на момент загрузки звезда уже в полёте, а не все стартуют одновременно
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
