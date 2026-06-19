const DAY_MS = 24 * 60 * 60 * 1000;

export function nowIso(): string {
  return new Date().toISOString();
}

export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

export function startOfTodayIso(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  return start.toISOString();
}

export function addDays(inputIso: string, days: number): string {
  const base = new Date(inputIso);
  return new Date(base.getTime() + days * DAY_MS).toISOString();
}

export function startOfMonthIso(inputIso = nowIso()): string {
  const now = new Date(inputIso);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return start.toISOString();
}

export function getUtcDayOfMonth(inputIso = nowIso()): number {
  return new Date(inputIso).getUTCDate();
}

export function getUtcDaysInMonth(inputIso = nowIso()): number {
  const now = new Date(inputIso);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
}
