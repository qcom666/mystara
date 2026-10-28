import type { CSSProperties } from "react";
import { createSeededRandom } from "@/lib/rng";
import { cn } from "@/lib/utils";

interface SkyLayerConfig {
  id: "far" | "mid" | "near";
  count: number;
  minSize: number;
  maxSize: number;
  /** За сколько секунд слой проходит ширину экрана: дальние звёзды движутся медленнее ближних. */
  secondsPerScreen: number;
}

/**
 * Небо медленно плывёт вправо, как будто звёзды идут по кругу: ушедшие за правый край снова выплывают слева.
 * Каждый слой — две одинаковые полосы шириной в экран, стоящие рядом; слой сдвигается ровно на ширину полосы
 * и начинает заново, поэтому стык не виден. Три слоя с разными звёздами и скоростями (дальние мелкие —
 * медленно, ближние крупные — быстрее) дают объём и прячут повтор узора.
 */
const LAYERS: readonly SkyLayerConfig[] = [
  { id: "far", count: 44, minSize: 0.5, maxSize: 1.1, secondsPerScreen: 170 },
  { id: "mid", count: 26, minSize: 0.9, maxSize: 1.6, secondsPerScreen: 110 },
  { id: "near", count: 12, minSize: 1.4, maxSize: 2.2, secondsPerScreen: 70 },
];

/**
 * Звёзды слоя делятся на несколько групп, которые мерцают каждая в своём ритме. Звезда — не отдельный элемент,
 * а одна из теней (box-shadow) элемента группы: так на весь фон приходится около двух десятков элементов и
 * анимаций вместо трёх сотен, а мерцание (opacity) и дрейф (transform) целиком крутит видеокарта.
 */
const TWINKLE_GROUPS = [
  { duration: 3.4, delay: 0 },
  { duration: 4.6, delay: 1.3 },
  { duration: 5.8, delay: 2.6 },
  { duration: 4.1, delay: 3.4 },
] as const;

interface SkyLayer {
  id: SkyLayerConfig["id"];
  secondsPerScreen: number;
  /** Готовое значение box-shadow для каждой группы мерцания. */
  groups: string[];
}

// Фиксированное зерно, считается один раз при загрузке модуля: на сервере и на клиенте одинаково,
// поэтому, несмотря на «случайный» вид, не вызывает ошибку гидратации.
function generateLayers(): SkyLayer[] {
  return LAYERS.map((layer) => {
    const random = createSeededRandom(`mystara-star-field-v3-${layer.id}`);
    const groups: string[][] = TWINKLE_GROUPS.map(() => []);
    for (let index = 0; index < layer.count; index += 1) {
      const x = (random() * 100).toFixed(2);
      const y = (random() * 100).toFixed(2);
      const size = layer.minSize + random() * (layer.maxSize - layer.minSize);
      // Остальные числа зерна (задержка, длительность) раньше шли в стиль каждой звезды; читаем их, чтобы
      // узор неба остался прежним.
      random();
      random();
      const alpha = (random() * 0.5 + 0.3).toFixed(2);
      // Элемент группы — круг в 1 px: тень с разбросом (size - 1) / 2 даёт звезду нужного размера.
      const spread = ((size - 1) / 2).toFixed(2);
      groups[index % groups.length].push(`${x}vw ${y}vh 0 ${spread}px rgb(231 233 240 / ${alpha})`);
    }
    return { id: layer.id, secondsPerScreen: layer.secondsPerScreen, groups: groups.map((stars) => stars.join(", ")) };
  });
}

const SKY = generateLayers();

/**
 * Падающие звёзды: росчерк через небо. У каждой свой цикл и траектория, поэтому появляются вразнобой,
 * в среднем раз в 3–4 секунды то одна, то другая. Полёт занимает 10 % цикла (с 86 % до 96 %, см. keyframes
 * shooting-star); отрицательная задержка начинает цикл с середины, чтобы первые кометы пролетели в первые
 * секунды на странице (примерно на 2-й, 5-й, 9-й и 12-й), а не после полной паузы.
 */
const SHOOTING_STARS = [
  { top: "12%", left: "8%", duration: 10, delay: -6.6, angle: 18, x: "46vw", y: "15vw" },
  { top: "28%", left: "52%", duration: 13, delay: -5.7, angle: 24, x: "38vw", y: "17vw" },
  { top: "6%", left: "34%", duration: 16, delay: -4.8, angle: 14, x: "52vw", y: "13vw" },
  { top: "44%", left: "16%", duration: 19, delay: -3.8, angle: 21, x: "40vw", y: "16vw" },
] as const;

function StarStrip({ groups, offset }: { groups: string[]; offset: "left-0" | "left-1/2" }) {
  return (
    <div className={cn("absolute inset-y-0 w-1/2", offset)}>
      {groups.map((shadow, index) => (
        <span
          key={index}
          className="star-twinkle absolute left-0 top-0 block h-px w-px rounded-full"
          style={{ boxShadow: shadow, animationDuration: `${TWINKLE_GROUPS[index].duration}s`, animationDelay: `${TWINKLE_GROUPS[index].delay}s` }}
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
      {SHOOTING_STARS.map((star) => (
        <span
          key={`${star.top}-${star.left}`}
          className="shooting-star absolute h-px w-28 origin-left rounded-full bg-gradient-to-r from-transparent via-silver-200/70 to-white opacity-0 motion-safe:animate-shooting-star"
          style={
            {
              top: star.top,
              left: star.left,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
              "--shoot-angle": `${star.angle}deg`,
              "--shoot-x": star.x,
              "--shoot-y": star.y,
            } as CSSProperties
          }
        />
      ))}
      {SKY.map((layer) => (
        <div
          key={layer.id}
          data-sky-layer={layer.id}
          // Слой шириной в два экрана, начинается за левым краем; сдвиг на половину своей ширины = на экран.
          className="absolute inset-y-0 -left-full w-[200%] will-change-transform motion-safe:animate-sky-drift"
          style={{ animationDuration: `${layer.secondsPerScreen}s` } as CSSProperties}
        >
          <StarStrip groups={layer.groups} offset="left-0" />
          <StarStrip groups={layer.groups} offset="left-1/2" />
        </div>
      ))}
    </div>
  );
}
