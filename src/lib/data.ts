export type SessionKey = "form" | "rehearse" | "endure";
export type Screen = "home" | "calendar" | "plan";
export type Theme = "dark" | "light";
export type Scale = 1 | 2 | 3 | 4 | 5;

/** Day of week (0 = Sun … 6 = Sat) → session held that day. */
export type TrainingDays = Partial<Record<number, SessionKey>>;

export interface Extra {
  name: string;
  minutes: number;
  feel: Scale | null;
}

export interface DayLog {
  ran: string | null;
  minutes: number;
  feel: Scale | null;
  sleep: number | null;
  readiness: Scale | null;
  med: boolean;
  breath: boolean;
  extras: Extra[];
}

export type Logs = Record<string, DayLog>;

export interface Journey {
  id: string;
  name: string;
  dist: string;
  weeks: number;
  vol: [number, number];
  blurb: string;
}

export interface Profile {
  id: string;
  displayName: string;
  journeyId: string | null;
  /** ISO date of the Monday the journey began. */
  planStart: string | null;
  trainingDays: TrainingDays;
}

export const FEEL_COLOR = ["", "#7d8aa6", "#6f93a3", "#67a596", "#7cb494", "#8ec9a4"];
export const FEEL_WORD = ["", "Heavy", "Working", "Steady", "Good", "Flying"];

export const JOURNEYS: Journey[] = [
  { id: "first-light", name: "First light", dist: "5K", weeks: 6, vol: [90, 140], blurb: "A gentle way in, built around consistency rather than comparison." },
  { id: "threshold", name: "The threshold", dist: "10K", weeks: 8, vol: [110, 180], blurb: "For runners ready to build rhythm, resilience and a little more range." },
  { id: "long-view", name: "The long view", dist: "21.1K", weeks: 12, vol: [130, 220], blurb: "A patient build, discovering what sustained effort teaches." },
  { id: "full-field", name: "The full field", dist: "42.2K", weeks: 16, vol: [150, 280], blurb: "A considered marathon build, for the process as much as the finish." },
  { id: "beyond-map", name: "Beyond the map", dist: "50K+", weeks: 20, vol: [180, 360], blurb: "A spacious framework for trail days and long horizons." },
];

export const SESSIONS: Record<SessionKey, { label: string; name: string; share: number; note: string; runName: string }> = {
  form: {
    label: "FORM",
    name: "The architecture",
    share: 0.25,
    note: "Technique, drills, easy running. The architecture everything else stands on.",
    runName: "Easy + drills",
  },
  rehearse: {
    label: "REHEARSE",
    name: "Race rehearsal",
    share: 0.3,
    note: "Rehearse race pace in small, controlled doses. Learn what it feels like before it counts.",
    runName: "Tempo intervals",
  },
  endure: {
    label: "ENDURE",
    name: "Long language",
    share: 0.45,
    note: "Time on feet, easy and conversational. The long, patient language of endurance.",
    runName: "Long steady",
  },
};

export const SESSION_ORDER: SessionKey[] = ["form", "rehearse", "endure"];

export const MED_NAMES = ["Body scan, 10 min", "Settling the breath, 8 min", "Open awareness, 12 min", "Before the run, 6 min"];
export const BREATH_NAMES = ["Box breathing, 5 min", "Coherent breath, 6 min", "Down-regulate, 4 min", "Nasal only, 7 min"];

export const APPS = [
  { id: "strava", name: "Strava" },
  { id: "oura", name: "Oura" },
  { id: "apple", name: "Apple Watch" },
];

export type TipKey = "feel" | "readiness" | "sleep" | "meditation" | "breathwork" | "recovery";

export const TIPS: Record<TipKey, string> = {
  feel: "How the session sat in your body afterwards — 1 heavy, 5 flying. Your own read, not a device's.",
  readiness: "How ready you felt to train that day — 1 drained, 5 fresh. A gut check you log yourself.",
  sleep: "Hours you slept the night before. Sleep is where training turns into fitness.",
  meditation: "Meditation sessions you've done this week — you've done this many of the 4 woven into the plan.",
  breathwork: "Breathwork sessions done this week, out of the 5 in the plan.",
  recovery: "Your average readiness across the week, out of 5 — the softer signal of how recovery is going.",
};

export const REST_LINES = [
  "A quiet day is a training day too. What you built this week settles into the legs now.",
  "Nothing to complete today. The adaptations happen while you're still — let them.",
  "Rest is where the work becomes fitness. Read something, walk slow, sleep long.",
];

export const DEFAULT_JOURNEY = "first-light";
export const DEFAULT_TRAINING_DAYS: TrainingDays = { 2: "form", 4: "rehearse", 6: "endure" };

export const emptyLog = (): DayLog => ({
  ran: null,
  minutes: 0,
  feel: null,
  sleep: null,
  readiness: null,
  med: false,
  breath: false,
  extras: [],
});
