import { logWarning } from "@/lib/logger";

/**
 * Шрифты для картинок ImageResponse. Встроенный шрифт не умеет кириллицу, а положить файлы шрифтов в сборку
 * нельзя без превышения лимита размера, поэтому нужные глифы скачиваются у Google Fonts при генерации:
 * параметр `text` возвращает крошечный файл ровно с теми символами, что есть на картинке. Без браузерного
 * User-Agent Google отдаёт TTF, который понимает ImageResponse. Результат кэшируется в памяти экземпляра.
 */

export interface LoadedFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal";
}

const cache = new Map<string, Promise<ArrayBuffer | null>>();
const MAX_CACHE = 200;

async function fetchFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
  try {
    const css = await (await fetch(url, { signal: AbortSignal.timeout(4000) })).text();
    const source = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
    if (!source) return null;
    const response = await fetch(source, { signal: AbortSignal.timeout(4000) });
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** Загружает шрифт с глифами для `text`; при сбое возвращает null (картинка соберётся встроенным шрифтом). */
export async function loadFont(family: string, weight: LoadedFont["weight"], text: string): Promise<LoadedFont | null> {
  const glyphs = [...new Set(text)].sort().join("");
  const key = `${family}|${weight}|${glyphs}`;
  let pending = cache.get(key);
  if (!pending) {
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string);
    pending = fetchFont(family, weight, glyphs);
    cache.set(key, pending);
  }
  const data = await pending;
  if (!data) {
    cache.delete(key);
    logWarning("share-fonts", "font download failed, falling back to the built-in font", { family });
    return null;
  }
  return { name: family, data, weight, style: "normal" };
}
