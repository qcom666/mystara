import julian from "astronomia/julian";
import { getZodiacSignByLongitude } from "../domain/zodiac-signs.data";
import { moonPhaseFromElongation, type SkyOfDay } from "./daily-horoscope";
import { getBodyPositions } from "./ephemeris";

/**
 * Небо московского дня для гороскопа: знак и фаза Луны и ретроградность Меркурия на полдень по Москве
 * (09:00 UTC). Только для сервера: эфемериды тяжёлые и в клиентский бандл не попадают.
 */
export function getSkyOfDay(day: string): SkyOfDay {
  const [year, month, date] = day.split("-").map(Number);
  const jde = julian.CalendarGregorianToJD(year, month, date + 9 / 24);
  const positions = getBodyPositions(jde);
  const longitude = (id: string) => positions.find((body) => body.id === id)?.longitudeDeg ?? 0;
  const moon = longitude("moon");
  return {
    day,
    moonSign: getZodiacSignByLongitude(moon).sign.id,
    moonPhase: moonPhaseFromElongation(moon - longitude("sun")),
    mercuryRetrograde: positions.find((body) => body.id === "mercury")?.isRetrograde === true,
  };
}
