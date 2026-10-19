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
}

interface SkyLayer {
  id: string;
  stars: Star[];
  /** За сколько секунд слой проходит ширину экрана: дальние звёзды движутся медленнее ближних. */
  secondsPerScreen: number;
}

/**
 * Небо медленно плывёт вправо, как будто звёзды идут по кругу: ушедшие за правый край снова выплывают слева.
 * Каждый слой — две одинаковые полосы шириной в экран, стоящие рядом; слой сдвигается ровно на ширину полосы
 * и начинает заново, поэтому стык не виден. Три слоя с разными звёздами и скоростями (дальние мелкие —
 * медленно, ближние крупные — быстрее) дают объём и прячут повтор узора.
 */
const LAYERS: readonly { id: string; count: number; minSize: number; maxSize: number; secondsPerScreen: number }[] = [
  { id: "far", count: 44, minSize: 0.5, maxSize: 1.1, secondsPerScreen: 360 },
  { id: "mid", count: 26, minSize: 0.9, maxSize: 1.6, secondsPerScreen: 240 },
  { id: "near", count: 12, minSize: 1.4, maxSize: 2.2, secondsPerScreen: 160 },
];

// Фиксированное зерно, считается один раз при загрузке модуля: на сервере и на клиенте одинаково,
// поэтому, несмотря на «случайный» вид, не вызывает ошибку гидратации.
function generateLayers(): SkyLayer[] {
  return LAYERS.map((layer) => {
    const random = createSeededRandom(`mystara-star-field-v3-${layer.id}`);
    const stars = Array.from({ length: layer.count }, (_, id) => ({
      id,
      x: Number((random() * 100).toFixed(2)),
      y: Number((random() * 100).toFixed(2)),
      size: Number((layer.minSize + random() * (layer.maxSize - layer.minSize)).toFixed(2)),
      delay: Number((random() * 6).toFixed(2)),
      duration: Number((random() * 3 + 3).toFixed(2)),
      opacity: Number((random() * 0.5 + 0.3).toFixed(2)),
    }));
    return { id: layer.id, stars, secondsPerScreen: layer.secondsPerScreen };
  });
}

const SKY = generateLayers();

function StarStrip({ stars, offset }: { stars: Star[]; offset: "left-0" | "left-1/2" }) {
  return (
    <div className={cn("absolute inset-y-0 w-1/2", offset)}>
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute block rounded-full bg-silver-200 motion-safe:animate-twinkle"
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

interface StarFieldProps {
  className?: string;
}

export function StarField({ className }: StarFieldProps) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {SKY.map((layer) => (
        <div
          key={layer.id}
          // Слой шириной в два экрана, начинается за левым краем; сдвиг на половину своей ширины = на экран.
          className="absolute inset-y-0 -left-full w-[200%] will-change-transform motion-safe:animate-sky-drift"
          style={{ animationDuration: `${layer.secondsPerScreen}s` } as CSSProperties}
        >
          <StarStrip stars={layer.stars} offset="left-0" />
          <StarStrip stars={layer.stars} offset="left-1/2" />
        </div>
      ))}
    </div>
  );
}
