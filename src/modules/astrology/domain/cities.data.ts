/**
 * A curated list of cities for the natal-chart birth-place picker — not a
 * geocoding service. This deliberately avoids calling any third-party
 * geocoding/timezone API: birth date + time + place is sensitive personal
 * data, and sending it to an external service would be exactly the kind of
 * cross-border transfer PROJECT_ARCHITECTURE.md §14b already flags as
 * unresolved. A bundled, hand-checked list has no such exposure.
 *
 * Kept deliberately smaller than it could be: every entry's IANA timezone id
 * is one this was written with real confidence in. Russia in particular has
 * a long, quirky history of regional timezone changes — rather than guess,
 * cities whose current zone wasn't confidently known were left out. Anyone
 * whose city isn't listed can enter coordinates and pick a timezone by hand
 * (see NatalChartInputForm) — the honest fallback already established for
 * "we don't have real data for that" elsewhere in this module (sect: "not sure").
 *
 * `timezone` is an IANA zone id (e.g. "Europe/Moscow") — luxon resolves the
 * correct historical UTC offset for that zone at the birth instant, so
 * historical DST rules are handled correctly without a lookup table here.
 */
export interface City {
  id: string;
  name: string;
  nameRu: string;
  country: string;
  countryRu: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const CITIES: City[] = [
  // --- Russia ---
  { id: "moscow", name: "Moscow", nameRu: "Москва", country: "Russia", countryRu: "Россия", latitude: 55.75, longitude: 37.62, timezone: "Europe/Moscow" },
  {
    id: "saint-petersburg",
    name: "Saint Petersburg",
    nameRu: "Санкт-Петербург",
    country: "Russia",
    countryRu: "Россия",
    latitude: 59.94,
    longitude: 30.31,
    timezone: "Europe/Moscow",
  },
  { id: "kaliningrad", name: "Kaliningrad", nameRu: "Калининград", country: "Russia", countryRu: "Россия", latitude: 54.71, longitude: 20.51, timezone: "Europe/Kaliningrad" },
  { id: "voronezh", name: "Voronezh", nameRu: "Воронеж", country: "Russia", countryRu: "Россия", latitude: 51.66, longitude: 39.2, timezone: "Europe/Moscow" },
  { id: "krasnodar", name: "Krasnodar", nameRu: "Краснодар", country: "Russia", countryRu: "Россия", latitude: 45.04, longitude: 38.98, timezone: "Europe/Moscow" },
  { id: "sochi", name: "Sochi", nameRu: "Сочи", country: "Russia", countryRu: "Россия", latitude: 43.6, longitude: 39.73, timezone: "Europe/Moscow" },
  { id: "rostov-on-don", name: "Rostov-on-Don", nameRu: "Ростов-на-Дону", country: "Russia", countryRu: "Россия", latitude: 47.24, longitude: 39.71, timezone: "Europe/Moscow" },
  {
    id: "nizhny-novgorod",
    name: "Nizhny Novgorod",
    nameRu: "Нижний Новгород",
    country: "Russia",
    countryRu: "Россия",
    latitude: 56.33,
    longitude: 44.0,
    timezone: "Europe/Moscow",
  },
  { id: "kazan", name: "Kazan", nameRu: "Казань", country: "Russia", countryRu: "Россия", latitude: 55.8, longitude: 49.11, timezone: "Europe/Moscow" },
  { id: "volgograd", name: "Volgograd", nameRu: "Волгоград", country: "Russia", countryRu: "Россия", latitude: 48.71, longitude: 44.5, timezone: "Europe/Volgograd" },
  { id: "samara", name: "Samara", nameRu: "Самара", country: "Russia", countryRu: "Россия", latitude: 53.2, longitude: 50.15, timezone: "Europe/Samara" },
  { id: "ufa", name: "Ufa", nameRu: "Уфа", country: "Russia", countryRu: "Россия", latitude: 54.74, longitude: 55.97, timezone: "Asia/Yekaterinburg" },
  {
    id: "yekaterinburg",
    name: "Yekaterinburg",
    nameRu: "Екатеринбург",
    country: "Russia",
    countryRu: "Россия",
    latitude: 56.84,
    longitude: 60.61,
    timezone: "Asia/Yekaterinburg",
  },
  { id: "chelyabinsk", name: "Chelyabinsk", nameRu: "Челябинск", country: "Russia", countryRu: "Россия", latitude: 55.16, longitude: 61.4, timezone: "Asia/Yekaterinburg" },
  { id: "perm", name: "Perm", nameRu: "Пермь", country: "Russia", countryRu: "Россия", latitude: 58.01, longitude: 56.23, timezone: "Asia/Yekaterinburg" },
  { id: "tyumen", name: "Tyumen", nameRu: "Тюмень", country: "Russia", countryRu: "Россия", latitude: 57.15, longitude: 65.53, timezone: "Asia/Yekaterinburg" },
  { id: "omsk", name: "Omsk", nameRu: "Омск", country: "Russia", countryRu: "Россия", latitude: 54.99, longitude: 73.37, timezone: "Asia/Omsk" },
  { id: "novosibirsk", name: "Novosibirsk", nameRu: "Новосибирск", country: "Russia", countryRu: "Россия", latitude: 55.03, longitude: 82.92, timezone: "Asia/Novosibirsk" },
  { id: "krasnoyarsk", name: "Krasnoyarsk", nameRu: "Красноярск", country: "Russia", countryRu: "Россия", latitude: 56.01, longitude: 92.85, timezone: "Asia/Krasnoyarsk" },
  { id: "irkutsk", name: "Irkutsk", nameRu: "Иркутск", country: "Russia", countryRu: "Россия", latitude: 52.29, longitude: 104.3, timezone: "Asia/Irkutsk" },
  { id: "yakutsk", name: "Yakutsk", nameRu: "Якутск", country: "Russia", countryRu: "Россия", latitude: 62.03, longitude: 129.73, timezone: "Asia/Yakutsk" },
  { id: "khabarovsk", name: "Khabarovsk", nameRu: "Хабаровск", country: "Russia", countryRu: "Россия", latitude: 48.48, longitude: 135.08, timezone: "Asia/Vladivostok" },
  { id: "vladivostok", name: "Vladivostok", nameRu: "Владивосток", country: "Russia", countryRu: "Россия", latitude: 43.12, longitude: 131.9, timezone: "Asia/Vladivostok" },
  {
    id: "petropavlovsk-kamchatsky",
    name: "Petropavlovsk-Kamchatsky",
    nameRu: "Петропавловск-Камчатский",
    country: "Russia",
    countryRu: "Россия",
    latitude: 53.02,
    longitude: 158.65,
    timezone: "Asia/Kamchatka",
  },

  // --- CIS ---
  { id: "kyiv", name: "Kyiv", nameRu: "Киев", country: "Ukraine", countryRu: "Украина", latitude: 50.45, longitude: 30.52, timezone: "Europe/Kyiv" },
  { id: "minsk", name: "Minsk", nameRu: "Минск", country: "Belarus", countryRu: "Беларусь", latitude: 53.9, longitude: 27.57, timezone: "Europe/Minsk" },
  { id: "almaty", name: "Almaty", nameRu: "Алматы", country: "Kazakhstan", countryRu: "Казахстан", latitude: 43.24, longitude: 76.9, timezone: "Asia/Almaty" },
  { id: "astana", name: "Astana", nameRu: "Астана", country: "Kazakhstan", countryRu: "Казахстан", latitude: 51.13, longitude: 71.43, timezone: "Asia/Almaty" },
  { id: "tashkent", name: "Tashkent", nameRu: "Ташкент", country: "Uzbekistan", countryRu: "Узбекистан", latitude: 41.31, longitude: 69.24, timezone: "Asia/Tashkent" },
  { id: "bishkek", name: "Bishkek", nameRu: "Бишкек", country: "Kyrgyzstan", countryRu: "Киргизия", latitude: 42.87, longitude: 74.59, timezone: "Asia/Bishkek" },
  { id: "dushanbe", name: "Dushanbe", nameRu: "Душанбе", country: "Tajikistan", countryRu: "Таджикистан", latitude: 38.56, longitude: 68.78, timezone: "Asia/Dushanbe" },
  { id: "ashgabat", name: "Ashgabat", nameRu: "Ашхабад", country: "Turkmenistan", countryRu: "Туркменистан", latitude: 37.95, longitude: 58.38, timezone: "Asia/Ashgabat" },
  { id: "baku", name: "Baku", nameRu: "Баку", country: "Azerbaijan", countryRu: "Азербайджан", latitude: 40.41, longitude: 49.87, timezone: "Asia/Baku" },
  { id: "yerevan", name: "Yerevan", nameRu: "Ереван", country: "Armenia", countryRu: "Армения", latitude: 40.18, longitude: 44.51, timezone: "Asia/Yerevan" },
  { id: "tbilisi", name: "Tbilisi", nameRu: "Тбилиси", country: "Georgia", countryRu: "Грузия", latitude: 41.72, longitude: 44.79, timezone: "Asia/Tbilisi" },
  { id: "chisinau", name: "Chisinau", nameRu: "Кишинёв", country: "Moldova", countryRu: "Молдова", latitude: 47.01, longitude: 28.86, timezone: "Europe/Chisinau" },

  // --- Europe ---
  { id: "london", name: "London", nameRu: "Лондон", country: "United Kingdom", countryRu: "Великобритания", latitude: 51.51, longitude: -0.13, timezone: "Europe/London" },
  { id: "paris", name: "Paris", nameRu: "Париж", country: "France", countryRu: "Франция", latitude: 48.86, longitude: 2.35, timezone: "Europe/Paris" },
  { id: "berlin", name: "Berlin", nameRu: "Берлин", country: "Germany", countryRu: "Германия", latitude: 52.52, longitude: 13.4, timezone: "Europe/Berlin" },
  { id: "madrid", name: "Madrid", nameRu: "Мадрид", country: "Spain", countryRu: "Испания", latitude: 40.42, longitude: -3.7, timezone: "Europe/Madrid" },
  { id: "rome", name: "Rome", nameRu: "Рим", country: "Italy", countryRu: "Италия", latitude: 41.9, longitude: 12.5, timezone: "Europe/Rome" },
  { id: "amsterdam", name: "Amsterdam", nameRu: "Амстердам", country: "Netherlands", countryRu: "Нидерланды", latitude: 52.37, longitude: 4.9, timezone: "Europe/Amsterdam" },
  { id: "vienna", name: "Vienna", nameRu: "Вена", country: "Austria", countryRu: "Австрия", latitude: 48.21, longitude: 16.37, timezone: "Europe/Vienna" },
  { id: "warsaw", name: "Warsaw", nameRu: "Варшава", country: "Poland", countryRu: "Польша", latitude: 52.23, longitude: 21.01, timezone: "Europe/Warsaw" },
  { id: "prague", name: "Prague", nameRu: "Прага", country: "Czechia", countryRu: "Чехия", latitude: 50.08, longitude: 14.44, timezone: "Europe/Prague" },
  { id: "stockholm", name: "Stockholm", nameRu: "Стокгольм", country: "Sweden", countryRu: "Швеция", latitude: 59.33, longitude: 18.07, timezone: "Europe/Stockholm" },
  { id: "helsinki", name: "Helsinki", nameRu: "Хельсинки", country: "Finland", countryRu: "Финляндия", latitude: 60.17, longitude: 24.94, timezone: "Europe/Helsinki" },
  { id: "oslo", name: "Oslo", nameRu: "Осло", country: "Norway", countryRu: "Норвегия", latitude: 59.91, longitude: 10.75, timezone: "Europe/Oslo" },
  { id: "copenhagen", name: "Copenhagen", nameRu: "Копенгаген", country: "Denmark", countryRu: "Дания", latitude: 55.68, longitude: 12.57, timezone: "Europe/Copenhagen" },
  { id: "athens", name: "Athens", nameRu: "Афины", country: "Greece", countryRu: "Греция", latitude: 37.98, longitude: 23.73, timezone: "Europe/Athens" },
  { id: "lisbon", name: "Lisbon", nameRu: "Лиссабон", country: "Portugal", countryRu: "Португалия", latitude: 38.72, longitude: -9.14, timezone: "Europe/Lisbon" },
  { id: "dublin", name: "Dublin", nameRu: "Дублин", country: "Ireland", countryRu: "Ирландия", latitude: 53.35, longitude: -6.26, timezone: "Europe/Dublin" },
  { id: "brussels", name: "Brussels", nameRu: "Брюссель", country: "Belgium", countryRu: "Бельгия", latitude: 50.85, longitude: 4.35, timezone: "Europe/Brussels" },
  { id: "zurich", name: "Zurich", nameRu: "Цюрих", country: "Switzerland", countryRu: "Швейцария", latitude: 47.37, longitude: 8.54, timezone: "Europe/Zurich" },
  { id: "istanbul", name: "Istanbul", nameRu: "Стамбул", country: "Turkey", countryRu: "Турция", latitude: 41.01, longitude: 28.98, timezone: "Europe/Istanbul" },

  // --- Americas ---
  { id: "new-york", name: "New York", nameRu: "Нью-Йорк", country: "United States", countryRu: "США", latitude: 40.71, longitude: -74.01, timezone: "America/New_York" },
  { id: "los-angeles", name: "Los Angeles", nameRu: "Лос-Анджелес", country: "United States", countryRu: "США", latitude: 34.05, longitude: -118.24, timezone: "America/Los_Angeles" },
  { id: "chicago", name: "Chicago", nameRu: "Чикаго", country: "United States", countryRu: "США", latitude: 41.88, longitude: -87.63, timezone: "America/Chicago" },
  { id: "toronto", name: "Toronto", nameRu: "Торонто", country: "Canada", countryRu: "Канада", latitude: 43.65, longitude: -79.38, timezone: "America/Toronto" },
  { id: "vancouver", name: "Vancouver", nameRu: "Ванкувер", country: "Canada", countryRu: "Канада", latitude: 49.28, longitude: -123.12, timezone: "America/Vancouver" },
  { id: "mexico-city", name: "Mexico City", nameRu: "Мехико", country: "Mexico", countryRu: "Мексика", latitude: 19.43, longitude: -99.13, timezone: "America/Mexico_City" },
  { id: "sao-paulo", name: "São Paulo", nameRu: "Сан-Паулу", country: "Brazil", countryRu: "Бразилия", latitude: -23.55, longitude: -46.63, timezone: "America/Sao_Paulo" },
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    nameRu: "Буэнос-Айрес",
    country: "Argentina",
    countryRu: "Аргентина",
    latitude: -34.6,
    longitude: -58.38,
    timezone: "America/Argentina/Buenos_Aires",
  },

  // --- Asia & the Middle East ---
  { id: "beijing", name: "Beijing", nameRu: "Пекин", country: "China", countryRu: "Китай", latitude: 39.9, longitude: 116.4, timezone: "Asia/Shanghai" },
  { id: "shanghai", name: "Shanghai", nameRu: "Шанхай", country: "China", countryRu: "Китай", latitude: 31.23, longitude: 121.47, timezone: "Asia/Shanghai" },
  { id: "tokyo", name: "Tokyo", nameRu: "Токио", country: "Japan", countryRu: "Япония", latitude: 35.68, longitude: 139.69, timezone: "Asia/Tokyo" },
  { id: "seoul", name: "Seoul", nameRu: "Сеул", country: "South Korea", countryRu: "Южная Корея", latitude: 37.57, longitude: 126.98, timezone: "Asia/Seoul" },
  { id: "delhi", name: "Delhi", nameRu: "Дели", country: "India", countryRu: "Индия", latitude: 28.61, longitude: 77.21, timezone: "Asia/Kolkata" },
  { id: "mumbai", name: "Mumbai", nameRu: "Мумбаи", country: "India", countryRu: "Индия", latitude: 19.08, longitude: 72.88, timezone: "Asia/Kolkata" },
  { id: "bangkok", name: "Bangkok", nameRu: "Бангкок", country: "Thailand", countryRu: "Таиланд", latitude: 13.76, longitude: 100.5, timezone: "Asia/Bangkok" },
  { id: "singapore", name: "Singapore", nameRu: "Сингапур", country: "Singapore", countryRu: "Сингапур", latitude: 1.35, longitude: 103.82, timezone: "Asia/Singapore" },
  {
    id: "dubai",
    name: "Dubai",
    nameRu: "Дубай",
    country: "United Arab Emirates",
    countryRu: "ОАЭ",
    latitude: 25.2,
    longitude: 55.27,
    timezone: "Asia/Dubai",
  },
  { id: "tel-aviv", name: "Tel Aviv", nameRu: "Тель-Авив", country: "Israel", countryRu: "Израиль", latitude: 32.08, longitude: 34.78, timezone: "Asia/Jerusalem" },
  { id: "cairo", name: "Cairo", nameRu: "Каир", country: "Egypt", countryRu: "Египет", latitude: 30.04, longitude: 31.24, timezone: "Africa/Cairo" },

  // --- Oceania ---
  { id: "sydney", name: "Sydney", nameRu: "Сидней", country: "Australia", countryRu: "Австралия", latitude: -33.87, longitude: 151.21, timezone: "Australia/Sydney" },
  { id: "melbourne", name: "Melbourne", nameRu: "Мельбурн", country: "Australia", countryRu: "Австралия", latitude: -37.81, longitude: 144.96, timezone: "Australia/Melbourne" },
  { id: "auckland", name: "Auckland", nameRu: "Окленд", country: "New Zealand", countryRu: "Новая Зеландия", latitude: -36.85, longitude: 174.76, timezone: "Pacific/Auckland" },
];

const CITIES_BY_ID = new Map(CITIES.map((city) => [city.id, city]));

export function getCityById(id: string): City | undefined {
  return CITIES_BY_ID.get(id);
}

export function localizeCity(city: City, locale: "en" | "ru"): { name: string; country: string } {
  return locale === "ru" ? { name: city.nameRu, country: city.countryRu } : { name: city.name, country: city.country };
}
