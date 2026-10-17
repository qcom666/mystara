/**
 * Решение, действует ли ещё выданная сессия (JWT): пользователь должен существовать в этой базе, не быть
 * удалённым, а номер поколения сессий в токене совпадать с текущим. Токены, выданные до появления номера,
 * считаются поколением 0, поэтому после выкатки уже вошедшие пользователи не вылетают.
 */
export interface SessionUserState {
  deletedAt: Date | null;
  sessionVersion: number;
}

export function isSessionStillValid(tokenVersion: unknown, user: SessionUserState | null): boolean {
  if (!user || user.deletedAt) return false;
  const version = typeof tokenVersion === "number" ? tokenVersion : 0;
  return version === user.sessionVersion;
}
