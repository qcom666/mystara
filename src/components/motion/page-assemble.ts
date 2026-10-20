/**
 * «Сборка» страницы при переходе в раздел: видимые на первом экране куски интерфейса (заголовки, тексты,
 * панели, карточки, кнопки, пункты списков, картинки) вылетают с разных сторон — из глубины, развёрнутыми и
 * размытыми — и по очереди встают на свои места; в это время от центра расходится золотое кольцо, а к центру
 * слетаются искры. Работает на любой странице без её правки (вызывается из app/template.tsx).
 *
 * Сделано на Web Animations API, а не на framer: анимации живут на самих элементах, не перерисовывают React и
 * после окончания снимаются, возвращая элементу его собственные transform, filter и opacity. Не трогаем то,
 * что уже анимирует framer (`data-reveal` на элементе, внутри или у предка), элементы с собственной
 * CSS-анимацией (вращение, мерцание) и закреплённые. Ниже первого экрана работает обычное проявление при
 * прокрутке. При «уменьшить движение» ничего не происходит.
 */

/**
 * Рамки проявляются целиком, а их содержимое влетает в них отдельными кусками: панели, ряды вкладок и
 * ссылки-карточки (ссылка, кнопка или пункт списка, внутри которых заголовок, текст или картинка).
 */
const FRAMES = ".glass-panel,[role='tablist']";
const CARD_LIKE = "a,button,li";
const CARD_CONTENT = "h1,h2,h3,h4,p,.glass-panel,img,svg[role='img']";
const PIECES = "h1,h2,h3,h4,p,li,label,input,textarea,select,button,a,img,svg,hr";
const CANDIDATES = `${FRAMES},${PIECES}`;
/** CSS-проявление при прокрутке на первом экране уже завершено, поэтому его можно перекрыть. */
const ALLOWED_ANIMATIONS = new Set(["none", "scroll-reveal", "scroll-reveal-step"]);
const MAX_PIECES = 64;
/** Последний кусок стартует не позже этого: на страницах с большим числом элементов шаг сжимается. */
const MAX_STAGGER_MS = 900;
const SPARKS = 16;

interface Piece {
  el: HTMLElement;
  rect: DOMRect;
  style: CSSStyleDeclaration;
  frame: boolean;
}

function pickPieces(root: HTMLElement): Piece[] {
  const rootTop = root.getBoundingClientRect().top;
  // Меряем от начала страницы, а не от окна: прокрутка наверх при переходе случается уже после этого.
  const limit = window.innerHeight * 1.1;
  const picked: Piece[] = [];

  for (const el of root.querySelectorAll<HTMLElement>(CANDIDATES)) {
    if (picked.length >= MAX_PIECES) break;
    const frame = el.matches(FRAMES) || (el.matches(CARD_LIKE) && el.querySelector(CARD_CONTENT) !== null);
    // Предки идут раньше потомков: кусок внутри уже выбранного куска (ссылка в абзаце, значок в кнопке) несёт
    // предок. Внутри рамок куски выбираем отдельно — так содержимое панели собирается внутри неё; рамку в рамке
    // не проявляем повторно, чтобы размытия не накладывались.
    if (picked.some((piece) => (!piece.frame || frame) && piece.el.contains(el))) continue;
    if (el.closest("[data-reveal],[data-no-assemble]") || el.querySelector("[data-reveal]")) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || rect.top - rootTop > limit) continue;
    const style = getComputedStyle(el);
    if (style.position === "fixed" || style.position === "sticky" || style.visibility === "hidden" || style.opacity === "0") continue;
    if (!ALLOWED_ANIMATIONS.has(style.animationName.split(",")[0].trim())) continue;
    picked.push({ el, rect, style, frame });
  }

  // Порядок сборки — по строкам сверху вниз, в строке слева направо.
  return picked.sort((a, b) => Math.round(a.rect.top / 40) - Math.round(b.rect.top / 40) || a.rect.left - b.rect.left);
}

/** Золотое кольцо от центра и искры, слетающиеся к центру, — «заклинание», которое собирает страницу. */
function castFlare(): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  const ring = document.createElement("div");
  ring.className = "page-assemble-ring";
  ring.setAttribute("aria-hidden", "true");
  document.body.appendChild(ring);
  nodes.push(ring);
  ring
    .animate(
      [
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.15)" },
        { opacity: 1, offset: 0.25 },
        { opacity: 0, transform: "translate(-50%, -50%) scale(2.6)" },
      ],
      { duration: 1200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    )
    .finished.then(() => ring.remove(), () => ring.remove());

  const width = window.innerWidth;
  const height = window.innerHeight;
  for (let index = 0; index < SPARKS; index += 1) {
    const spark = document.createElement("div");
    spark.className = "page-assemble-spark";
    spark.setAttribute("aria-hidden", "true");
    document.body.appendChild(spark);
    nodes.push(spark);
    // Искры стартуют по кругу за пределами центра и летят к нему, по спирали.
    const angle = (index / SPARKS) * Math.PI * 2;
    const radius = Math.max(width, height) * (0.45 + (index % 3) * 0.08);
    const fromX = Math.cos(angle) * radius;
    const fromY = Math.sin(angle) * radius;
    const midX = Math.cos(angle + 0.6) * radius * 0.35;
    const midY = Math.sin(angle + 0.6) * radius * 0.35;
    spark
      .animate(
        [
          { opacity: 0, transform: `translate(${fromX}px, ${fromY}px) scale(1)` },
          { opacity: 1, offset: 0.3 },
          { opacity: 0.9, transform: `translate(${midX}px, ${midY}px) scale(0.9)`, offset: 0.7 },
          { opacity: 0, transform: "translate(0px, 0px) scale(0.2)" },
        ],
        { duration: 900 + (index % 4) * 120, delay: (index % 5) * 30, easing: "cubic-bezier(0.55, 0, 0.3, 1)", fill: "backwards" },
      )
      .finished.then(() => spark.remove(), () => spark.remove());
  }
  return nodes;
}

/** Собирает страницу; возвращает отмену (уход со страницы до конца сборки). */
export function assemblePage(root: HTMLElement): () => void {
  if (typeof root.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  // Пустой набор (страница целиком анимирует себя сама, как главная) всё равно получает кольцо и искры.
  const pieces = pickPieces(root);

  const viewportWidth = window.innerWidth;
  // На длинных страницах (каталог карт) шаг сжимается, но не до одновременного старта: каскад должен читаться.
  const step = Math.min(70, Math.max(18, MAX_STAGGER_MS / pieces.length));
  const animations = pieces.map(({ el, rect, style, frame }, index) => {
    const baseTransform = style.transform === "none" ? "" : ` ${style.transform}`;
    const baseFilter = style.filter === "none" ? "" : ` ${style.filter}`;
    const opacity = Number(style.opacity);
    const timing: KeyframeAnimationOptions = { duration: 850, delay: 80 + index * step, easing: "cubic-bezier(0.2, 0.9, 0.25, 1.06)", fill: "backwards" };
    if (frame) {
      // Рамка не летит издалека, а «материализуется» на своём месте: из глубины, чуть больше и размытой.
      return el.animate(
        [
          { opacity: 0, transform: `perspective(1200px) translate3d(0px, 34px, -60px) rotateX(10deg) scale(1.06)${baseTransform}`, filter: `blur(14px)${baseFilter}` },
          { opacity, transform: `perspective(1200px) translate3d(0px, 0px, 0px) rotateX(0deg) scale(1)${baseTransform}`, filter: `blur(0px)${baseFilter}` },
        ],
        { ...timing, duration: 950 },
      );
    }
    // Куски слева прилетают слева, справа — справа: интерфейс сходится к своему месту из разлёта.
    const fromCenter = (rect.left + rect.width / 2 - viewportWidth / 2) / (viewportWidth / 2);
    const wide = rect.width > viewportWidth * 0.5;
    // На узком экране разлёт пропорционально меньше: телефону хватает и половины.
    const spread = Math.min(1, viewportWidth / 1000);
    const dx = ((wide ? fromCenter * 30 : fromCenter * 140) + ((index % 3) - 1) * 26) * spread;
    const dy = 70 + (index % 4) * 22;
    const rotate = ((index % 5) - 2) * 3;
    return el.animate(
      [
        {
          opacity: 0,
          transform: `perspective(900px) translate3d(${dx.toFixed(1)}px, ${dy}px, -140px) rotateX(22deg) rotate(${rotate}deg) scale(0.84)${baseTransform}`,
          filter: `blur(12px)${baseFilter}`,
        },
        {
          opacity,
          transform: `perspective(900px) translate3d(0px, 0px, 0px) rotateX(0deg) rotate(0deg) scale(1)${baseTransform}`,
          filter: `blur(0px)${baseFilter}`,
        },
      ],
      timing,
    );
  });

  const flare = castFlare();

  return () => {
    animations.forEach((animation) => animation.cancel());
    flare.forEach((node) => node.remove());
  };
}
