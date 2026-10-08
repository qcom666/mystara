import type { ActorProfile } from "./types";

/**
 * Небольшой отобранный набор известных актёров с реальными, публично известными датами рождения: знак
 * зодиака и число жизненного пути считаются из этой даты во время работы (см. actor-match.service.ts)
 * и никогда не вводятся вручную, поэтому не могут незаметно разойтись с логикой расчёта.
 *
 * Это развлекательное содержимое («занимательный факт»), а не утверждение о перечисленных людях:
 * везде, где оно показано, оно так и подаётся (см. FunFactCard).
 */
export const ACTORS: ActorProfile[] = [
  { name: "Leonardo DiCaprio", nameRu: "Леонардо ДиКаприо", birthDate: "1974-11-11", archetypeTags: ["visionary", "dreamer"] },
  { name: "Emma Watson", nameRu: "Эмма Уотсон", birthDate: "1990-04-15", archetypeTags: ["sage", "leader"] },
  { name: "Zendaya", nameRu: "Зендея", birthDate: "1996-09-01", archetypeTags: ["pioneer", "romantic"] },
  { name: "Tom Holland", nameRu: "Том Холланд", birthDate: "1996-06-01", archetypeTags: ["dreamer", "protector"] },
  { name: "Dwayne Johnson", nameRu: "Дуэйн Джонсон", birthDate: "1972-05-02", archetypeTags: ["leader", "protector"] },
  { name: "Scarlett Johansson", nameRu: "Скарлетт Йоханссон", birthDate: "1984-11-22", archetypeTags: ["transformer", "rebel"] },
  { name: "Timothée Chalamet", nameRu: "Тимоти Шаламе", birthDate: "1995-12-27", archetypeTags: ["dreamer", "rebel"] },
  { name: "Margot Robbie", nameRu: "Марго Робби", birthDate: "1990-07-02", archetypeTags: ["trickster", "pioneer"] },
  { name: "Keanu Reeves", nameRu: "Киану Ривз", birthDate: "1964-09-02", archetypeTags: ["sage", "protector"] },
  { name: "Zoe Saldana", nameRu: "Зои Салдана", birthDate: "1978-06-19", archetypeTags: ["pioneer", "transformer"] },
  { name: "Ryan Gosling", nameRu: "Райан Гослинг", birthDate: "1980-11-12", archetypeTags: ["romantic", "dreamer"] },
  { name: "Meryl Streep", nameRu: "Мерил Стрип", birthDate: "1949-06-22", archetypeTags: ["sage", "transformer"] },
  { name: "Denzel Washington", nameRu: "Дензел Вашингтон", birthDate: "1954-12-28", archetypeTags: ["leader", "sage"] },
  { name: "Jennifer Lawrence", nameRu: "Дженнифер Лоуренс", birthDate: "1990-08-15", archetypeTags: ["rebel", "trickster"] },
  { name: "Robert Downey Jr.", nameRu: "Роберт Дауни-младший", birthDate: "1965-04-04", archetypeTags: ["trickster", "transformer"] },
  { name: "Tom Hanks", nameRu: "Том Хэнкс", birthDate: "1956-07-09", archetypeTags: ["healer", "sage"] },
  { name: "Natalie Portman", nameRu: "Натали Портман", birthDate: "1981-06-09", archetypeTags: ["sage", "seeker"] },
  { name: "Chris Hemsworth", nameRu: "Крис Хемсворт", birthDate: "1983-08-11", archetypeTags: ["protector", "leader"] },
  { name: "Anya Taylor-Joy", nameRu: "Аня Тейлор-Джой", birthDate: "1996-04-16", archetypeTags: ["seeker", "visionary"] },
  { name: "Michael B. Jordan", nameRu: "Майкл Б. Джордан", birthDate: "1987-02-09", archetypeTags: ["leader", "romantic"] },
];
