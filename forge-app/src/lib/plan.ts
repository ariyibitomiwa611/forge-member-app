import { type DayLog, type Journey, type Logs, type Scale, type SessionKey, type TrainingDays, DEFAULT_JOURNEY, JOURNEYS, SESSIONS } from "./data";
import { DAY_MS, MONTHS, WD, addDays, avg, mondayOf, parseIso, toIso } from "./dates";

/** Everything needed to know what a member should do on a given day. */
export interface PlanCtx {
  journey: Journey;
  td: TrainingDays;
  start: Date; // Monday of week 1
}

export const journeyById = (id: string | null): Journey =>
  JOURNEYS.find((j) => j.id === id) ?? JOURNEYS.find((j) => j.id === DEFAULT_JOURNEY)!;

export const todayIso = () => toIso(new Date());
export const today = () => parseIso(todayIso());

/** Planned minutes for week `w` (1-based): progressive build with a cutback every 4th week and a taper. */
export const weekMinutes = (j: Journey, w: number) => {
  const [lo, hi] = j.vol;
  if (w >= j.weeks) return Math.round((lo * 0.85) / 5) * 5;
  const frac = (w - 1) / (j.weeks - 1);
  let base = lo + (hi - lo) * Math.pow(frac, 0.85);
  if (w % 4 === 0) base *= 0.72;
  return Math.round(base / 5) * 5;
};

export const sessionMinutes = (j: Journey, w: number, key: SessionKey) =>
  Math.round((weekMinutes(j, w) * SESSIONS[key].share) / 5) * 5;

/** 0-based week index of a date within the plan (negative before it starts). */
export const weekIndexOf = (d: Date, start: Date) =>
  Math.floor(Math.round((parseIso(toIso(d)).getTime() - start.getTime()) / DAY_MS) / 7);

export const sessionKeyFor = (d: Date, p: PlanCtx): SessionKey | null => {
  const w = weekIndexOf(d, p.start);
  if (w < 0 || w >= p.journey.weeks) return null;
  return p.td[d.getDay()] ?? null;
};

export const weekMonday = (p: PlanCtx, w: number) => addDays(p.start, w * 7);

export const planEnd = (p: PlanCtx) => addDays(p.start, p.journey.weeks * 7 - 1);

/** Week the member is in now, clamped to the plan so screens always have a week to show. */
export const currentWeek = (p: PlanCtx) => {
  const raw = weekIndexOf(today(), p.start);
  return { raw, clamped: Math.max(0, Math.min(p.journey.weeks - 1, raw)) };
};

export const totalMinutes = (l: DayLog | undefined) =>
  l ? (l.minutes || 0) + l.extras.reduce((s, e) => s + (e.minutes || 0), 0) : 0;

export function weekStats(wIdx: number, logs: Logs, p: PlanCtx) {
  const mon = weekMonday(p, wIdx);
  const feels: Scale[] = [];
  const sleeps: number[] = [];
  let done = 0;
  let planned = 0;
  for (let i = 0; i < 7; i++) {
    const dt = addDays(mon, i);
    if (sessionKeyFor(dt, p)) planned++;
    const l = logs[toIso(dt)];
    if (l?.ran) {
      done++;
      if (l.feel) feels.push(l.feel);
      if (l.sleep) sleeps.push(l.sleep);
    }
  }
  return { done, planned, avgFeel: avg(feels), avgSleep: avg(sleeps), feels };
}

/** The coach's plain-language read of a week. */
export function weekText(stats: ReturnType<typeof weekStats>, isSunday: boolean) {
  const { done, planned, avgFeel, avgSleep } = stats;
  if (done === 0)
    return "Nothing logged here yet — this page fills itself as you go. When you record a day, this is where the week starts to speak.";
  const parts: string[] = [];
  if (done >= planned && planned > 0) parts.push("Every session in this week, and none of them forced.");
  else parts.push(`${done} of ${planned} sessions down — the ones that happened are what matter.`);
  if (avgFeel >= 4) parts.push("Your legs have been reading light; the base is doing its quiet work.");
  else if (avgFeel >= 3) parts.push("Steady effort, nothing overreached — exactly the register this phase wants.");
  else if (avgFeel > 0) parts.push("A heavier week in the body. Worth letting the easy days stay genuinely easy.");
  if (avgSleep >= 7.5) parts.push("Sleep held above seven and a half, which is half the training right there.");
  else if (avgSleep > 0 && avgSleep < 6.6) parts.push("Sleep dipped a little — the plan can wait for you, it doesn't run away.");
  if (isSunday)
    parts.push("A full field note lands each Sunday: this is where the week is gathered up and set down before the next begins.");
  return parts.join(" ");
}

/** Weekly group call: Sundays at 7pm (member's local time). */
export function nextGroupCall(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0);
  const add = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + add);
  if (d.getTime() < now.getTime() - 60 * 60 * 1000) d.setDate(d.getDate() + 7); // call over → next week
  return { date: d, label: `${WD[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · 7:00pm` };
}

export const shortDate = (d: Date) => `${WD[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** Monday a new journey should start on: this week's Monday, or next week's. */
export const startMonday = (when: "this" | "next") => {
  const m = mondayOf(today());
  return when === "this" ? m : addDays(m, 7);
};
