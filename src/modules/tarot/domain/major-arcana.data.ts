import { MAJOR_ARCANA_RU } from "./major-arcana.ru.data";
import type { TarotCard } from "./types";

type MajorArcanaSource = Omit<TarotCard, "keywordsRu" | "meaningsRu">;

/**
 * 22 старших аркана. Написаны вручную (не по шаблону), потому что это самые заметные и часто
 * упоминаемые карты продукта (витрина на главной, SEO-страницы карт, «большие» позиции большинства
 * раскладов). Русские ключевые слова и значения лежат в `major-arcana.ru.data.ts` и подмешиваются ниже.
 */
const MAJOR_ARCANA_SOURCE: MajorArcanaSource[] = [
  {
    id: "the-fool",
    name: "The Fool",
    nameRu: "Шут",
    arcana: "major",
    suit: null,
    number: 0,
    image: null,
    keywords: ["beginnings", "innocence", "spontaneity", "leap of faith"],
    description:
      "A traveler steps toward a cliff's edge, gazing skyward, unburdened and unafraid of what comes next.",
    descriptionRu: "Путник делает шаг к краю обрыва, глядя в небо — лёгкий и бесстрашный перед тем, что ждёт впереди.",
    meanings: {
      upright:
        "A fresh start with an open heart — this reading may suggest it's time to take the leap, even without every answer in hand.",
      reversed:
        "Hesitation, recklessness, or a step taken without any preparation at all — the balance between courage and care may be off right now.",
      love: "A new connection or a relationship entering a lighter, more spontaneous chapter.",
      career: "An unconventional opportunity or a first step into unfamiliar professional territory.",
      finance: "A willingness to take a chance — worth pairing with at least a little caution.",
      spiritual: "Trust in the unknown; symbolically, this card can represent the soul at the very start of its journey.",
      yesNo: "yes-if-cautious",
    },
  },
  {
    id: "the-magician",
    name: "The Magician",
    nameRu: "Маг",
    arcana: "major",
    suit: null,
    number: 1,
    image: null,
    keywords: ["manifestation", "willpower", "resourcefulness", "action"],
    description:
      "One hand points to the sky, the other to the earth, with every tool of the suits laid out on the table before them.",
    descriptionRu: "Одна рука указывает в небо, другая — на землю, а на столе перед фигурой разложены инструменты всех четырёх мастей.",
    meanings: {
      upright:
        "One possible interpretation is that you already hold every tool you need — this can be a moment to act, not wait.",
      reversed:
        "Scattered energy, untapped potential, or a gap between talent and follow-through.",
      love: "Conscious, intentional connection — communicating clearly about what you want.",
      career: "A moment of real agency; skills and resources are aligned to make something happen.",
      finance: "Resourcefulness pays off, provided intention stays honest rather than manipulative.",
      spiritual: "The point where inner will meets outer world — symbolically, the spark of creation itself.",
      yesNo: "yes",
    },
  },
  {
    id: "the-high-priestess",
    name: "The High Priestess",
    nameRu: "Верховная Жрица",
    arcana: "major",
    suit: null,
    number: 2,
    image: null,
    keywords: ["intuition", "mystery", "the subconscious", "stillness"],
    description:
      "Seated between two pillars of light and shadow, she guards a veil embroidered with pomegranates — knowledge not yet ready to be spoken.",
    descriptionRu:
      "Восседая между двумя колоннами света и тени, она хранит завесу с вышитыми гранатами — знание, ещё не готовое быть произнесённым.",
    meanings: {
      upright:
        "This reading may suggest listening inward before asking anyone else — intuition may already know the answer.",
      reversed:
        "Disconnection from intuition, secrets kept too long, or information being withheld.",
      love: "Feelings not yet spoken aloud; a connection with an undercurrent of the unsaid.",
      career: "Trust a hunch, but verify quietly before acting on it publicly.",
      finance: "A situation not fully visible yet — patience before committing may serve well.",
      spiritual: "The threshold between the conscious and subconscious mind; symbolically, sacred inner knowing.",
      yesNo: "maybe",
    },
  },
  {
    id: "the-empress",
    name: "The Empress",
    nameRu: "Императрица",
    arcana: "major",
    suit: null,
    number: 3,
    image: null,
    keywords: ["abundance", "nurturing", "creativity", "nature"],
    description:
      "Resting in a lush field beneath a canopy of stars, crowned with grain and comfort, she embodies growth in full bloom.",
    descriptionRu:
      "Она покоится на пышном поле под звёздным пологом, увенчанная колосьями и изобилием, — воплощение роста в полном расцвете.",
    meanings: {
      upright:
        "Abundance, creativity, and care coming to fruition — a season where nurturing something (a project, a relationship, yourself) pays off.",
      reversed:
        "Creative block, self-neglect, or smothering care that has tipped into control.",
      love: "Warmth, sensuality, and nurturing affection; possibly a season of growth in a relationship.",
      career: "Creative work flourishes; a good period for building rather than tearing down.",
      finance: "Material comfort and steady growth, though possibly through indulgence worth watching.",
      spiritual: "Symbolically, the fertile, generative force of nature itself — creation as devotion.",
      yesNo: "yes",
    },
  },
  {
    id: "the-emperor",
    name: "The Emperor",
    nameRu: "Император",
    arcana: "major",
    suit: null,
    number: 4,
    image: null,
    keywords: ["structure", "authority", "stability", "discipline"],
    description:
      "Enthroned on stone carved with rams' heads, armor beneath his robe, he rules through order rather than impulse.",
    descriptionRu:
      "Восседая на троне из камня с резными бараньими головами, в доспехах под мантией, он правит порядком, а не порывом.",
    meanings: {
      upright:
        "Structure and discipline may be exactly what's needed — this can be a card of steady, earned authority.",
      reversed:
        "Rigidity, control for its own sake, or structure that has become a cage rather than a support.",
      love: "A relationship benefiting from clearer boundaries or commitment, or a partner who leads with stability.",
      career: "Leadership, structure, or a step into greater responsibility.",
      finance: "Discipline and planning likely serve better right now than improvisation.",
      spiritual: "Symbolically, order imposed on chaos — the architecture that lets growth stand upright.",
      yesNo: "yes",
    },
  },
  {
    id: "the-hierophant",
    name: "The Hierophant",
    nameRu: "Иерофант",
    arcana: "major",
    suit: null,
    number: 5,
    image: null,
    keywords: ["tradition", "belief systems", "mentorship", "conformity"],
    description:
      "Seated between two pillars, two keys crossed at his feet, he is a bridge between the sacred and the everyday.",
    descriptionRu: "Сидя между двумя колоннами, у его ног скрещены два ключа — он мост между священным и повседневным.",
    meanings: {
      upright:
        "Guidance through tradition, mentorship, or an established path — this may be a moment where structure and shared wisdom help more than going it alone.",
      reversed:
        "Questioning inherited beliefs, or feeling boxed in by an institution, tradition, or others' expectations.",
      love: "A conventional relationship milestone, or values around commitment coming into focus.",
      career: "Mentorship, formal training, or working well within an established system.",
      finance: "Conventional, well-tested approaches likely outperform improvisation here.",
      spiritual: "Symbolically, the container that holds a tradition — ritual, teaching, shared meaning.",
      yesNo: "maybe",
    },
  },
  {
    id: "the-lovers",
    name: "The Lovers",
    nameRu: "Влюблённые",
    arcana: "major",
    suit: null,
    number: 6,
    image: null,
    keywords: ["connection", "values", "choice", "alignment"],
    description:
      "Two figures stand beneath a watching angel, a sun blazing behind them — union witnessed, and a choice freely made.",
    descriptionRu:
      "Две фигуры стоят под взглядом ангела, а позади них пылает солнце — союз, засвидетельствованный свыше, и свободно сделанный выбор.",
    meanings: {
      upright:
        "A meaningful connection, or a choice that asks you to act from your real values rather than pressure from outside.",
      reversed:
        "Misalignment, a values conflict, or a relationship out of balance.",
      love: "A deep, values-aligned connection — or a fork in the road that this reading may suggest is worth naming honestly.",
      career: "A choice between paths; consider which one actually reflects what you value.",
      finance: "A decision best made jointly, or one that should follow your values rather than pressure.",
      spiritual: "Symbolically, the union of complementary forces — choice as an act of integrity.",
      yesNo: "yes",
    },
  },
  {
    id: "the-chariot",
    name: "The Chariot",
    nameRu: "Колесница",
    arcana: "major",
    suit: null,
    number: 7,
    image: null,
    keywords: ["willpower", "momentum", "focus", "control"],
    description:
      "A figure rides out in armor, reins in hand, driving two opposing sphinxes forward through sheer force of will.",
    descriptionRu:
      "Фигура в доспехах выезжает вперёд, держа поводья, и одной лишь силой воли направляет двух противоборствующих сфинксов.",
    meanings: {
      upright:
        "Determination and focused will driving real momentum — opposing forces held together and pointed in one direction.",
      reversed:
        "Loss of direction, or willpower spent fighting internal conflict instead of moving forward.",
      love: "Pursuing a relationship with real intention, or navigating conflicting feelings toward a decision.",
      career: "Ambition and focus pushing a project or goal forward, provided the direction is actually right.",
      finance: "Discipline and drive can produce real progress here.",
      spiritual: "Symbolically, the will directing opposing inner forces toward a single purpose.",
      yesNo: "yes",
    },
  },
  {
    id: "strength",
    name: "Strength",
    nameRu: "Сила",
    arcana: "major",
    suit: null,
    number: 8,
    image: null,
    keywords: ["courage", "compassion", "inner resolve", "patience"],
    description:
      "A figure calmly closes a lion's jaw with bare hands — not through force, but through quiet, patient courage.",
    descriptionRu: "Фигура спокойно смыкает пасть льва голыми руками — не силой, а тихим, терпеливым мужеством.",
    meanings: {
      upright:
        "Gentle strength and patience succeed where force would fail — this reading may point to courage that comes from compassion, not domination.",
      reversed:
        "Self-doubt, or strength turning into either harshness or collapse under pressure.",
      love: "Patience and gentleness holding a relationship steady through a difficult moment.",
      career: "Quiet persistence and composure under pressure outperform aggression right now.",
      finance: "Restraint and steady nerve serve better than a forceful, impulsive move.",
      spiritual: "Symbolically, the taming of instinct through compassion rather than suppression.",
      yesNo: "yes",
    },
  },
  {
    id: "the-hermit",
    name: "The Hermit",
    nameRu: "Отшельник",
    arcana: "major",
    suit: null,
    number: 9,
    image: null,
    keywords: ["introspection", "solitude", "inner guidance", "withdrawal"],
    description:
      "Alone on a mountain peak, a lantern held aloft, he lights a small circle of the path — enough to take the next step.",
    descriptionRu:
      "В одиночестве на горной вершине он держит фонарь, освещающий лишь небольшой круг пути — ровно столько, чтобы сделать следующий шаг.",
    meanings: {
      upright:
        "A season for stepping back and looking inward; the answer may come from solitude rather than another opinion.",
      reversed:
        "Isolation that has gone on too long, or avoiding a question that solitude alone won't answer.",
      love: "A need for space, reflection, or time apart before the next step becomes clear.",
      career: "Independent, focused work; a good period for research over collaboration.",
      finance: "A time to quietly review and reflect rather than act.",
      spiritual: "Symbolically, the inward-turned lantern — wisdom found through deliberate withdrawal.",
      yesNo: "maybe",
    },
  },
  {
    id: "wheel-of-fortune",
    name: "Wheel of Fortune",
    nameRu: "Колесо Фортуны",
    arcana: "major",
    suit: null,
    number: 10,
    image: null,
    keywords: ["cycles", "fate", "turning points", "change"],
    description:
      "A great wheel turns in the sky, carrying symbolic figures up and down — the ceaseless rhythm of change itself.",
    descriptionRu:
      "Огромное колесо вращается в небе, вознося и опуская символические фигуры — неустанный ритм самих перемен.",
    meanings: {
      upright:
        "A turning point arriving on its own timing — this card can represent change that's less about control and more about how you meet it.",
      reversed:
        "A run of resistance or a cycle that feels stuck — worth remembering the wheel keeps turning regardless.",
      love: "A relationship entering a new phase, shaped by circumstance as much as choice.",
      career: "An unexpected shift — a chance worth watching for rather than forcing.",
      finance: "Fortune's timing is not fully within your control right now — plan for both directions.",
      spiritual: "Symbolically, the cyclical nature of fate — nothing stays fixed forever, for better or worse.",
      yesNo: "maybe",
    },
  },
  {
    id: "justice",
    name: "Justice",
    nameRu: "Справедливость",
    arcana: "major",
    suit: null,
    number: 11,
    image: null,
    keywords: ["fairness", "truth", "accountability", "cause and effect"],
    description:
      "Seated between two pillars, sword upright and scales balanced, she weighs the situation without flinching from the truth.",
    descriptionRu:
      "Восседая между двумя колоннами, с прямым мечом и уравновешенными весами, она взвешивает ситуацию, не отступая перед правдой.",
    meanings: {
      upright:
        "Fairness, truth, and consequence catching up with a situation — this can point to a moment where honesty serves you best.",
      reversed:
        "An imbalance, an unfair situation, or avoidance of accountability that's likely to resurface.",
      love: "A relationship needing honesty or a fair rebalancing of give-and-take.",
      career: "A decision, negotiation, or evaluation where being straightforward pays off.",
      finance: "Contracts, agreements, or debts likely need a clear-eyed look right now.",
      spiritual: "Symbolically, cause and effect made visible — the karmic ledger balancing itself.",
      yesNo: "yes-if-cautious",
    },
  },
  {
    id: "the-hanged-man",
    name: "The Hanged Man",
    nameRu: "Повешенный",
    arcana: "major",
    suit: null,
    number: 12,
    image: null,
    keywords: ["surrender", "new perspective", "pause", "letting go"],
    description:
      "Suspended upside-down from a living tree, his expression is calm rather than pained — a willing pause, not a punishment.",
    descriptionRu:
      "Подвешенный вниз головой на живом дереве, он выглядит скорее спокойным, чем страдающим, — добровольная пауза, а не наказание.",
    meanings: {
      upright:
        "A deliberate pause that reveals a different point of view — sometimes the most useful move is to stop pushing.",
      reversed:
        "Needless delay, martyrdom, or resisting a perspective shift that would actually help.",
      love: "A relationship on hold, or seeing a partner from an entirely new angle.",
      career: "A stalled project may need a change in perspective rather than more effort.",
      finance: "Not the moment for a big move — better to wait and see clearly first.",
      spiritual: "Symbolically, surrender as a form of insight — letting go to see what was hidden.",
      yesNo: "no",
    },
  },
  {
    id: "death",
    name: "Death",
    nameRu: "Смерть",
    arcana: "major",
    suit: null,
    number: 13,
    image: null,
    keywords: ["transformation", "endings", "transition", "release"],
    description:
      "A skeletal rider moves calmly through a changing landscape as the old world gives way to what comes after — endings that clear space for something new.",
    descriptionRu:
      "Скелет-всадник спокойно движется сквозь меняющийся пейзаж, пока старый мир уступает место тому, что придёт следом, — завершения, освобождающие место для нового.",
    meanings: {
      upright:
        "A significant ending that makes room for transformation — rarely literal, almost always about release and renewal.",
      reversed:
        "Resistance to a necessary change, or an ending being dragged out longer than it needs to be.",
      love: "A relationship or relationship pattern reaching a natural close, opening space for what's next.",
      career: "The end of a role, project, or approach — likely a necessary one.",
      finance: "A financial chapter closing; may be uncomfortable but is likely clearing the way forward.",
      spiritual: "Symbolically, transformation through release — nothing new grows without something else ending.",
      yesNo: "no",
    },
  },
  {
    id: "temperance",
    name: "Temperance",
    nameRu: "Умеренность",
    arcana: "major",
    suit: null,
    number: 14,
    image: null,
    keywords: ["balance", "patience", "moderation", "integration"],
    description:
      "An angel pours water between two cups, one foot on land and one in the stream — blending opposites into something whole.",
    descriptionRu:
      "Ангел переливает воду из чаши в чашу, стоя одной ногой на земле, а другой в потоке, — смешивая противоположности в единое целое.",
    meanings: {
      upright:
        "Balance and patient blending of opposites — this reading may suggest the middle path serves better than an extreme.",
      reversed:
        "Imbalance, excess, or impatience pulling things out of proportion.",
      love: "A relationship finding its equilibrium through compromise and patience.",
      career: "Steady, moderate progress; combining skills or approaches works better than picking just one.",
      finance: "Moderation and gradual, well-blended planning over any drastic move.",
      spiritual: "Symbolically, alchemy — the patient integration of opposing elements into harmony.",
      yesNo: "yes",
    },
  },
  {
    id: "the-devil",
    name: "The Devil",
    nameRu: "Дьявол",
    arcana: "major",
    suit: null,
    number: 15,
    image: null,
    keywords: ["attachment", "restriction", "temptation", "shadow"],
    description:
      "Two figures stand chained before a horned figure, yet the chains around their necks hang loose enough to remove.",
    descriptionRu:
      "Две фигуры стоят на цепи перед рогатым существом, но цепи на их шеях висят достаточно свободно, чтобы их можно было снять.",
    meanings: {
      upright:
        "A pattern, habit, or relationship that feels binding — this card can represent restriction that is more chosen than it first appears.",
      reversed:
        "Breaking free from a limiting pattern, or finally recognizing a form of self-imposed bondage.",
      love: "An intense, possibly codependent or unhealthy attachment worth examining honestly.",
      career: "Feeling trapped by a job or situation that may have more exit options than it seems.",
      finance: "Watch for overspending, debt, or material attachment driving decisions.",
      spiritual: "Symbolically, the shadow self — desires and fears that bind until they're brought into the light.",
      yesNo: "no",
    },
  },
  {
    id: "the-tower",
    name: "The Tower",
    nameRu: "Башня",
    arcana: "major",
    suit: null,
    number: 16,
    image: null,
    keywords: ["sudden change", "upheaval", "revelation", "collapse"],
    description:
      "Lightning splits a tower's crown as its occupants fall — a structure built on a shaky foundation coming down fast.",
    descriptionRu:
      "Молния раскалывает вершину башни, и её обитатели падают вниз — строение на шатком основании стремительно рушится.",
    meanings: {
      upright:
        "A sudden, disruptive change that breaks down something unstable — often shocking, but frequently clearing away what couldn't have lasted anyway.",
      reversed:
        "Disaster narrowly avoided, or a collapse delayed rather than prevented.",
      love: "An abrupt, revealing shake-up — painful, but possibly exposing a truth that needed to surface.",
      career: "An unexpected disruption to a role or plan, likely demanding a real rebuild rather than a patch.",
      finance: "A sudden setback — building a more resilient foundation afterward matters most.",
      spiritual: "Symbolically, necessary destruction — the collapse of false structures to reveal truth.",
      yesNo: "no",
    },
  },
  {
    id: "the-star",
    name: "The Star",
    nameRu: "Звезда",
    arcana: "major",
    suit: null,
    number: 17,
    image: null,
    keywords: ["hope", "renewal", "inspiration", "healing"],
    description:
      "Beneath a sky full of stars, a figure kneels at the water's edge, pouring water onto both land and pool — quiet renewal after a storm.",
    descriptionRu:
      "Под звёздным небом фигура преклоняет колени у кромки воды, возливая её на землю и в водоём, — тихое обновление после бури.",
    meanings: {
      upright:
        "Hope and healing after a difficult stretch — this reading may suggest calmer, more inspired ground ahead.",
      reversed:
        "Discouragement, or a loss of faith in a better outcome that's likely temporary.",
      love: "Renewed hope, healing, and a gentler, more optimistic phase.",
      career: "Inspiration returning after a rough patch; a good time to dream a little bigger again.",
      finance: "A slow, hopeful improvement rather than a dramatic one.",
      spiritual: "Symbolically, faith restored — a guiding light after passing through darkness.",
      yesNo: "yes",
    },
  },
  {
    id: "the-moon",
    name: "The Moon",
    nameRu: "Луна",
    arcana: "major",
    suit: null,
    number: 18,
    image: null,
    keywords: ["uncertainty", "illusion", "intuition", "the unconscious"],
    description:
      "Beneath a moon dripping light, a path winds between two towers, past a wolf, a dog, and a lone crawling creature — familiar shapes made strange in dim light.",
    descriptionRu:
      "Под луной, источающей свет, тропа вьётся между двумя башнями мимо волка, собаки и одинокого ползущего существа — знакомые силуэты, ставшие странными в тусклом свете.",
    meanings: {
      upright:
        "Things may not be entirely as they appear — this can be a time to move carefully and trust intuition over surface impressions.",
      reversed:
        "Confusion lifting, or a hidden truth finally coming into clearer light.",
      love: "Mixed signals or unspoken anxieties that deserve a closer, calmer look.",
      career: "An unclear situation at work — more information may be needed before deciding anything.",
      finance: "Uncertainty or incomplete information — this may not be the moment for a big financial leap.",
      spiritual: "Symbolically, the unconscious mind — dreams, fears, and intuition surfacing after dark.",
      yesNo: "no",
    },
  },
  {
    id: "the-sun",
    name: "The Sun",
    nameRu: "Солнце",
    arcana: "major",
    suit: null,
    number: 19,
    image: null,
    keywords: ["joy", "vitality", "clarity", "success"],
    description:
      "A child rides bareheaded and joyful beneath a wide, radiant sun, sunflowers rising behind a low garden wall.",
    descriptionRu:
      "Ребёнок едет верхом с непокрытой головой и радостью под широким сияющим солнцем, а за невысокой садовой оградой поднимаются подсолнухи.",
    meanings: {
      upright:
        "Clarity, joy, and things generally going well — this card can represent a genuinely bright, energized period.",
      reversed:
        "Clouded joy, temporary setbacks, or success that hasn't quite arrived yet.",
      love: "Warmth, openness, and genuine happiness in a connection.",
      career: "Recognition, success, or simply enjoying the work again.",
      finance: "A positive, clear-headed period for growth.",
      spiritual: "Symbolically, enlightenment and vitality — the self at its most unguarded and alive.",
      yesNo: "yes",
    },
  },
  {
    id: "judgement",
    name: "Judgement",
    nameRu: "Суд",
    arcana: "major",
    suit: null,
    number: 20,
    image: null,
    keywords: ["reckoning", "renewal", "self-evaluation", "awakening"],
    description:
      "Figures rise from open graves as an angel sounds a trumpet overhead — a call to reckon honestly and rise renewed.",
    descriptionRu:
      "Фигуры восстают из разверзшихся могил, пока ангел трубит в трубу над ними, — призыв честно подвести итог и восстать обновлённым.",
    meanings: {
      upright:
        "A moment of honest self-evaluation and awakening — this reading may point toward a decision that's been waiting to be made.",
      reversed:
        "Self-judgment that's too harsh, or avoiding a reckoning that's overdue.",
      love: "A relationship being evaluated honestly, possibly leading to renewed commitment or a clear ending.",
      career: "A career reckoning — evaluating whether the current path still fits who you've become.",
      finance: "Reviewing past decisions honestly before moving forward.",
      spiritual: "Symbolically, rebirth through honest reckoning — an awakening that follows self-examination.",
      yesNo: "yes",
    },
  },
  {
    id: "the-world",
    name: "The World",
    nameRu: "Мир",
    arcana: "major",
    suit: null,
    number: 21,
    image: null,
    keywords: ["completion", "wholeness", "fulfillment", "integration"],
    description:
      "A figure dances within a laurel wreath, four symbolic creatures watching from each corner — a cycle completed, whole and integrated.",
    descriptionRu:
      "Фигура танцует в лавровом венке, а из каждого угла за ней наблюдают четыре символических существа — завершённый цикл, целостный и объединённый.",
    meanings: {
      upright:
        "Completion and integration — this can be a card of finishing a meaningful chapter and feeling genuinely whole.",
      reversed:
        "Something left unfinished, or a sense of being close to completion but not quite there.",
      love: "A relationship reaching a fulfilling milestone or a satisfying sense of wholeness.",
      career: "A project or goal reaching real completion — a natural point to acknowledge before starting the next one.",
      finance: "A goal achieved or a financial cycle brought to a satisfying close.",
      spiritual: "Symbolically, wholeness — the end of one cycle that is, at the same time, the doorway to the next.",
      yesNo: "yes",
    },
  },
];

export const MAJOR_ARCANA: TarotCard[] = MAJOR_ARCANA_SOURCE.map((card) => {
  const ru = MAJOR_ARCANA_RU[card.id];
  if (!ru) throw new Error(`Missing Russian content for Major Arcana card "${card.id}"`);
  return { ...card, keywordsRu: ru.keywords, meaningsRu: ru.meanings };
});
