import { createClient } from "@supabase/supabase-js";
import { type DayLog, type Logs, type Profile, type TrainingDays, DEFAULT_TRAINING_DAYS } from "./data";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? "http://localhost:54321", anonKey ?? "missing-anon-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// ---------- row <-> app mapping ----------

interface ProfileRow {
  id: string;
  display_name: string | null;
  journey_id: string | null;
  plan_start: string | null;
  training_days: TrainingDays | null;
}

interface LogRow {
  day: string;
  ran: string | null;
  minutes: number;
  feel: number | null;
  sleep: number | string | null;
  readiness: number | null;
  med: boolean;
  breath: boolean;
  extras: DayLog["extras"] | null;
}

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  displayName: r.display_name ?? "",
  journeyId: r.journey_id,
  planStart: r.plan_start,
  trainingDays: r.training_days ?? DEFAULT_TRAINING_DAYS,
});

const toLog = (r: LogRow): DayLog => ({
  ran: r.ran,
  minutes: r.minutes ?? 0,
  feel: (r.feel as DayLog["feel"]) ?? null,
  sleep: r.sleep == null ? null : Number(r.sleep),
  readiness: (r.readiness as DayLog["readiness"]) ?? null,
  med: r.med,
  breath: r.breath,
  extras: r.extras ?? [],
});

// ---------- queries ----------

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, journey_id, plan_start, training_days")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Your profile wasn't created. Check the database setup step in DEPLOY.md.");
  return toProfile(data as ProfileRow);
}

export async function updateProfile(userId: string, patch: Partial<Omit<Profile, "id">>) {
  const row: Partial<ProfileRow> = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.journeyId !== undefined) row.journey_id = patch.journeyId;
  if (patch.planStart !== undefined) row.plan_start = patch.planStart;
  if (patch.trainingDays !== undefined) row.training_days = patch.trainingDays;
  const { error } = await supabase.from("profiles").update(row).eq("id", userId);
  if (error) throw error;
}

export async function fetchLogs(userId: string): Promise<Logs> {
  const logs: Logs = {};
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("day_logs")
      .select("day, ran, minutes, feel, sleep, readiness, med, breath, extras")
      .eq("user_id", userId)
      .order("day")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of data as LogRow[]) logs[r.day] = toLog(r);
    if (!data || data.length < PAGE) break;
  }
  return logs;
}

export async function saveLog(userId: string, day: string, log: DayLog) {
  const { error } = await supabase.from("day_logs").upsert({
    user_id: userId,
    day,
    ran: log.ran,
    minutes: log.minutes,
    feel: log.feel,
    sleep: log.sleep,
    readiness: log.readiness,
    med: log.med,
    breath: log.breath,
    extras: log.extras,
  });
  if (error) throw error;
}
