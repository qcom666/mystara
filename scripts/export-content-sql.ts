/**
 * Выгружает встроенное содержимое сайта (карты, расклады, знаки зодиака, нумерологию, справочники
 * астрологии, города, знаменитостей) в виде SQL для базы `mystara`, чтобы тексты в базе совпадали
 * с тем, что показывает сайт. Запуск из корня проекта:
 *
 *   npx tsx scripts/export-content-sql.ts > db/mystara/mystara_content.sql
 *
 * Результат идемпотентен (UPDATE / INSERT ... ON CONFLICT) и заканчивается проверками: если в какой-то
 * таблице окажется неверное число строк, транзакция отменяется.
 */
import { FULL_DECK } from "@/modules/tarot/domain/deck";
import { SPREADS } from "@/modules/tarot/domain/spreads.data";
import { ZODIAC_SIGNS } from "@/modules/astrology/domain/zodiac-signs.data";
import { SECT_PROFILES } from "@/modules/astrology/domain/sect.data";
import { PLANETS, SIGN_RULER } from "@/modules/astrology/domain/planets.data";
import { HOUSE_THEMES } from "@/modules/astrology/domain/houses.data";
import { ASPECT_DEFINITIONS } from "@/modules/astrology/domain/aspects.data";
import { CITIES } from "@/modules/astrology/domain/cities.data";
import { LIFE_PATH_MEANINGS } from "@/modules/numerology/domain/life-path-meanings.data";
import { describeNumberForType, getNumberTypeLabels } from "@/modules/numerology/domain/number-type-framing";
import type { LifePathNumber, NumerologyNumberType } from "@/modules/numerology/domain/types";
import { ACTORS } from "@/modules/fun-facts/domain/actors.data";
import { MAJOR_ARCANA_ARCHETYPES } from "@/modules/fun-facts/domain/major-arcana-archetypes.data";

const q = (value: string | null | undefined): string => (value == null ? "NULL" : `'${value.replace(/'/g, "''")}'`);
const arr = (items: readonly string[]): string => (items.length ? `ARRAY[${items.map(q).join(", ")}]::text[]` : "'{}'::text[]");
const json = (value: unknown): string => `${q(JSON.stringify(value))}::jsonb`;
const num = (value: number): string => String(value);

const out: string[] = [];
const line = (text = "") => out.push(text);

line("-- =====================================================================");
line("--  MYSTARA — содержимое сайта (сгенерировано scripts/export-content-sql.ts)");
line("--  Не править руками: изменения в src/modules/**, затем перегенерировать:");
line("--    npx tsx scripts/export-content-sql.ts > db/mystara/mystara_content.sql");
line("-- =====================================================================");
line();
line("BEGIN;");
line();

// ---- Карты таро: идентификаторы как в seed (старшие: номер + 1; младшие: 22 + масть * 14 + номер) ----
line("-- Карты таро (78): тексты на двух языках, ключевые слова, толкования");
const suitIndex = { wands: 0, cups: 1, swords: 2, pentacles: 3 } as const;
for (const card of FULL_DECK) {
  const id = card.arcana === "major" ? card.number + 1 : 22 + suitIndex[card.suit as keyof typeof suitIndex] * 14 + card.number;
  const { yesNo, ...meaningsEn } = card.meanings;
  line(
    `UPDATE tarot_cards SET slug = ${q(card.id)}, name_en = ${q(card.name)}, keywords_ru = ${arr(card.keywordsRu)}, keywords_en = ${arr(card.keywords)}, ` +
      `description_ru = ${q(card.descriptionRu)}, description_en = ${q(card.description)}, ` +
      `meaning_upright = ${q(card.meaningsRu.upright)}, meaning_reversed = ${q(card.meaningsRu.reversed)}, ` +
      `meaning_upright_en = ${q(card.meanings.upright)}, meaning_reversed_en = ${q(card.meanings.reversed)}, ` +
      `meanings_ru = ${json(card.meaningsRu)}, meanings_en = ${json(meaningsEn)}, yes_no = ${q(yesNo)} ` +
      `WHERE id = ${id} AND num = ${card.number};`,
  );
}
line();

// ---- Расклады: три совпадают с расклады из seed (сопоставлены по смыслу), остальные добавляются ----
line("-- Расклады: совпадающие с seed обновляются, остальные добавляются");
const existingCodeBySlug: Record<string, string> = { "three-card": "three_cards", "yes-no": "yes_no", "celtic-cross": "celtic_cross" };
let sortOrder = 60;
for (const spread of SPREADS) {
  const details = spread.positions.map((p) => ({ id: p.id, order: p.order, label_ru: p.labelRu, label_en: p.label, meaning_ru: p.meaningRu, meaning_en: p.meaning }));
  const existing = existingCodeBySlug[spread.slug];
  if (existing) {
    line(
      `UPDATE tarot_spreads SET slug = ${q(spread.slug)}, name_en = ${q(spread.name)}, description_en = ${q(spread.description)}, ` +
        `category = ${q(spread.category)}, difficulty = ${q(spread.difficulty)}, position_details = ${json(details)} WHERE code = ${q(existing)};`,
    );
  } else {
    const code = spread.slug.replace(/-/g, "_");
    line(
      `INSERT INTO tarot_spreads (code, slug, name_ru, name_en, description, description_en, cards_count, positions, position_details, category, difficulty, price, premium_only, sort_order) VALUES ` +
        `(${q(code)}, ${q(spread.slug)}, ${q(spread.nameRu)}, ${q(spread.name)}, ${q(spread.descriptionRu)}, ${q(spread.description)}, ${spread.cardCount}, ` +
        `${json(spread.positions.map((p) => p.labelRu))}, ${json(details)}, ${q(spread.category)}, ${q(spread.difficulty)}, 0, ${spread.isPremium}, ${sortOrder}) ` +
        `ON CONFLICT (code) DO UPDATE SET slug = EXCLUDED.slug, name_en = EXCLUDED.name_en, description_en = EXCLUDED.description_en, ` +
        `category = EXCLUDED.category, difficulty = EXCLUDED.difficulty, position_details = EXCLUDED.position_details;`,
    );
    sortOrder += 10;
  }
}
line();

// ---- Знаки зодиака ----
line("-- Знаки зодиака");
for (const sign of ZODIAC_SIGNS) {
  line(
    `UPDATE zodiac_signs SET name_en = ${q(sign.name)}, modality = ${q(sign.modality)}, ruling_planet = ${q(SIGN_RULER[sign.id])}, ` +
      `keywords_ru = ${arr(sign.keywordsRu)}, keywords_en = ${arr(sign.keywords)}, description_ru = ${q(sign.descriptionRu)}, description_en = ${q(sign.description)}, ` +
      `strengths_ru = ${arr(sign.strengthsRu)}, strengths_en = ${arr(sign.strengths)}, challenges_ru = ${arr(sign.challengesRu)}, challenges_en = ${arr(sign.challenges)} ` +
      `WHERE code = ${q(sign.id)};`,
  );
}
line();

// ---- Справочники астрологии ----
line("-- Планеты, дома, аспекты, дневная/ночная карта");
for (const p of PLANETS) {
  line(
    `INSERT INTO planets (id, symbol, name_ru, name_en, nature_ru, nature_en) VALUES (${q(p.id)}, ${q(p.symbol)}, ${q(p.nameRu)}, ${q(p.name)}, ${q(p.natureRu)}, ${q(p.nature)}) ` +
      `ON CONFLICT (id) DO UPDATE SET symbol = EXCLUDED.symbol, name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en, nature_ru = EXCLUDED.nature_ru, nature_en = EXCLUDED.nature_en;`,
  );
}
for (const h of HOUSE_THEMES) {
  line(
    `INSERT INTO houses (number, title_ru, title_en, theme_ru, theme_en) VALUES (${h.number}, ${q(h.titleRu)}, ${q(h.title)}, ${q(h.themeRu)}, ${q(h.theme)}) ` +
      `ON CONFLICT (number) DO UPDATE SET title_ru = EXCLUDED.title_ru, title_en = EXCLUDED.title_en, theme_ru = EXCLUDED.theme_ru, theme_en = EXCLUDED.theme_en;`,
  );
}
for (const a of ASPECT_DEFINITIONS) {
  line(
    `INSERT INTO aspects (type, angle_deg, orb_deg, symbol, label_ru, label_en, meaning_ru, meaning_en) VALUES (${q(a.type)}, ${a.angleDeg}, ${a.orbDeg}, ${q(a.symbol)}, ${q(a.labelRu)}, ${q(a.label)}, ${q(a.meaningRu)}, ${q(a.meaning)}) ` +
      `ON CONFLICT (type) DO UPDATE SET angle_deg = EXCLUDED.angle_deg, orb_deg = EXCLUDED.orb_deg, symbol = EXCLUDED.symbol, label_ru = EXCLUDED.label_ru, label_en = EXCLUDED.label_en, meaning_ru = EXCLUDED.meaning_ru, meaning_en = EXCLUDED.meaning_en;`,
  );
}
for (const s of Object.values(SECT_PROFILES)) {
  line(
    `INSERT INTO sect_profiles (id, title_ru, title_en, description_ru, description_en, favored_planets, keynote_ru, keynote_en) VALUES (${q(s.id)}, ${q(s.titleRu)}, ${q(s.title)}, ${q(s.descriptionRu)}, ${q(s.description)}, ${arr(s.favoredPlanets.map((p) => p.toLowerCase()))}, ${q(s.keynoteRu)}, ${q(s.keynote)}) ` +
      `ON CONFLICT (id) DO UPDATE SET title_ru = EXCLUDED.title_ru, title_en = EXCLUDED.title_en, description_ru = EXCLUDED.description_ru, description_en = EXCLUDED.description_en, favored_planets = EXCLUDED.favored_planets, keynote_ru = EXCLUDED.keynote_ru, keynote_en = EXCLUDED.keynote_en;`,
  );
}
line();

// ---- Города ----
line("-- Города для выбора места рождения");
for (const c of CITIES) {
  line(
    `INSERT INTO cities (id, name_ru, name_en, country_ru, country_en, latitude, longitude, timezone) VALUES (${q(c.id)}, ${q(c.nameRu)}, ${q(c.name)}, ${q(c.countryRu)}, ${q(c.country)}, ${c.latitude}, ${c.longitude}, ${q(c.timezone)}) ` +
      `ON CONFLICT (id) DO UPDATE SET name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en, country_ru = EXCLUDED.country_ru, country_en = EXCLUDED.country_en, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, timezone = EXCLUDED.timezone;`,
  );
}
line();

// ---- Нумерология ----
line("-- Нумерология: число жизненного пути и остальные числа профиля");
const numbers: LifePathNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
const kindByType: Record<NumerologyNumberType, string> = {
  lifePath: "life_path",
  birthday: "birthday",
  expression: "destiny",
  soulUrge: "soul",
  personality: "personality",
  maturity: "maturity",
};
for (const n of numbers) {
  const m = LIFE_PATH_MEANINGS[n];
  for (const type of Object.keys(kindByType) as NumerologyNumberType[]) {
    const labelRu = getNumberTypeLabels(type, "ru").label;
    const labelEn = getNumberTypeLabels(type, "en").label;
    const isLifePath = type === "lifePath";
    const title = isLifePath ? m.titleRu : `${labelRu} ${n}: ${m.titleRu}`;
    const titleEn = isLifePath ? m.title : `${labelEn} ${n}: ${m.title}`;
    const body = isLifePath ? m.descriptionRu : describeNumberForType(n, type, "ru");
    const bodyEn = isLifePath ? m.description : describeNumberForType(n, type, "en");
    line(
      `INSERT INTO numerology_meanings (kind, number, title, body, title_en, body_en, keywords_ru, keywords_en, strengths_ru, strengths_en, challenges_ru, challenges_en) VALUES ` +
        `(${q(kindByType[type])}, ${num(n)}, ${q(title)}, ${q(body)}, ${q(titleEn)}, ${q(bodyEn)}, ${arr(m.keywordsRu)}, ${arr(m.keywords)}, ${arr(m.strengthsRu)}, ${arr(m.strengths)}, ${arr(m.challengesRu)}, ${arr(m.challenges)}) ` +
        `ON CONFLICT (kind, number) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, title_en = EXCLUDED.title_en, body_en = EXCLUDED.body_en, ` +
        `keywords_ru = EXCLUDED.keywords_ru, keywords_en = EXCLUDED.keywords_en, strengths_ru = EXCLUDED.strengths_ru, strengths_en = EXCLUDED.strengths_en, ` +
        `challenges_ru = EXCLUDED.challenges_ru, challenges_en = EXCLUDED.challenges_en;`,
    );
  }
}
line();

// ---- Знаменитости и архетипы ----
line("-- «На кого вы похожи»: знаменитости (знак зодиака считает триггер) и архетипы старших арканов");
for (const a of ACTORS) {
  line(
    `INSERT INTO celebrities (name_en, name_ru, birth_date, archetype_tags) VALUES (${q(a.name)}, ${q(a.nameRu)}, ${q(a.birthDate)}, ${arr(a.archetypeTags)}) ` +
      `ON CONFLICT (name_en) DO UPDATE SET name_ru = EXCLUDED.name_ru, birth_date = EXCLUDED.birth_date, archetype_tags = EXCLUDED.archetype_tags;`,
  );
}
let archetypeRows = 0;
for (const [slug, tags] of Object.entries(MAJOR_ARCANA_ARCHETYPES)) {
  for (const tag of tags) {
    line(`INSERT INTO card_archetypes (card_id, tag) SELECT id, ${q(tag)} FROM tarot_cards WHERE slug = ${q(slug)} ON CONFLICT DO NOTHING;`);
    archetypeRows++;
  }
}
line();

// ---- Самопроверки: при любом расхождении откатываем всю транзакцию ----
const expectations: [string, number, string][] = [
  ["tarot_cards with slug", FULL_DECK.length, "SELECT count(*) FROM tarot_cards WHERE slug IS NOT NULL AND name_en IS NOT NULL AND meaning_upright IS NOT NULL AND meaning_upright_en IS NOT NULL"],
  ["tarot_spreads with slug", SPREADS.length, "SELECT count(*) FROM tarot_spreads WHERE slug IS NOT NULL AND name_en IS NOT NULL AND jsonb_array_length(position_details) > 0"],
  ["zodiac_signs filled", ZODIAC_SIGNS.length, "SELECT count(*) FROM zodiac_signs WHERE name_en IS NOT NULL AND description_ru IS NOT NULL AND ruling_planet IS NOT NULL"],
  ["numerology_meanings", numbers.length * Object.keys(kindByType).length, "SELECT count(*) FROM numerology_meanings"],
  ["planets", PLANETS.length, "SELECT count(*) FROM planets"],
  ["houses", HOUSE_THEMES.length, "SELECT count(*) FROM houses"],
  ["aspects", ASPECT_DEFINITIONS.length, "SELECT count(*) FROM aspects"],
  ["sect_profiles", Object.keys(SECT_PROFILES).length, "SELECT count(*) FROM sect_profiles"],
  ["cities", CITIES.length, "SELECT count(*) FROM cities"],
  ["celebrities", ACTORS.length, "SELECT count(*) FROM celebrities WHERE zodiac_sign_id IS NOT NULL"],
  ["card_archetypes", archetypeRows, "SELECT count(*) FROM card_archetypes"],
];
line("DO $$");
line("DECLARE n integer;");
line("BEGIN");
for (const [label, expected, query] of expectations) {
  line(`    ${query} INTO n;`);
  line(`    IF n <> ${expected} THEN RAISE EXCEPTION 'content check failed: ${label}: expected ${expected}, got %', n; END IF;`);
}
line("END");
line("$$;");
line();
line("COMMIT;");

process.stdout.write(out.join("\n") + "\n");
