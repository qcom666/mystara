/**
 * Асцендент и MC: два угла, из которых строятся дома по системе целых знаков. Стандартные формулы
 * сферической астрономии (RAMC → эклиптическая долгота), те же, что в практически любой реализации
 * астрологических расчётов:
 *
 *   RAMC = местное звёздное время в градусах прямого восхождения
 *   MC  = atan2( sin(RAMC), cos(RAMC)·cos(ε) )
 *   Asc = atan2( cos(RAMC), −(sin(ε)·tan(φ) + cos(ε)·sin(RAMC)) )
 *
 * где ε — наклон эклиптики, φ — широта наблюдателя. Обе формулы можно независимо вывести из стандартного
 * преобразования эклиптических координат в экваториальные для точки с эклиптической широтой 0 (MC)
 * и высотой 0 (асцендент), и обе сводятся к очевидно верному частному случаю Asc = RAMC + 90° при
 * ε = 0 и φ = 0 (без наклона эклиптики восходящая точка отстоит от меридиана на четверть круга,
 * как на экваторе).
 *
 * То же упрощение «ΔT пренебрежимо мала», что и в ephemeris.ts: звёздное время считается по обычной
 * юлианской дате по UT, а не по JDE через таблицу ΔT.
 */
import base from "astronomia/base";
import nutation from "astronomia/nutation";
import sidereal from "astronomia/sidereal";

export interface ChartAngles {
  /** Эклиптическая долгота асцендента, градусы [0, 360). */
  ascendantDeg: number;
  /** Эклиптическая долгота MC, градусы [0, 360). */
  midheavenDeg: number;
}

function toDeg360(rad: number): number {
  const deg = (rad * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

/**
 * @param jdUt юлианская дата момента рождения по UT (не JDE; см. описание модуля).
 * @param latitudeDeg географическая широта наблюдателя, градусы, на север положительная.
 * @param longitudeDeg географическая долгота наблюдателя, градусы, на восток положительная.
 */
export function calculateChartAngles(jdUt: number, latitudeDeg: number, longitudeDeg: number): ChartAngles {
  const gstSeconds = sidereal.apparent(jdUt); // [0, 86400)
  const gstDeg = gstSeconds / 240; // 86400 с = 360°, поэтому 1 с = 1/240°
  const ramcDeg = ((gstDeg + longitudeDeg) % 360 + 360) % 360;
  const ramcRad = (ramcDeg * Math.PI) / 180;

  const epsilon = nutation.meanObliquity(jdUt);
  const [sEps, cEps] = base.sincos(epsilon);
  const phiRad = (latitudeDeg * Math.PI) / 180;

  const midheavenRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * cEps);
  const ascendantRad = Math.atan2(Math.cos(ramcRad), -(sEps * Math.tan(phiRad) + cEps * Math.sin(ramcRad)));

  return { ascendantDeg: toDeg360(ascendantRad), midheavenDeg: toDeg360(midheavenRad) };
}
