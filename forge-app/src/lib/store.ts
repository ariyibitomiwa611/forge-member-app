import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type DayLog,
  type Logs,
  type Profile,
  type Scale,
  type Screen,
  type SessionKey,
  type Theme,
  type TrainingDays,
  SESSIONS,
  emptyLog,
} from "./data";
import { parseIso, toIso } from "./dates";
import * as api from "./api";
import { type PlanCtx, journeyById, sessionKeyFor, startMonday, todayIso } from "./plan";

// ---------- theme (per device) ----------

const THEME_KEY = "forge_theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as Theme) || "dark";
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return { theme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

// ---------- toast ----------

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);
  return { toast, showToast: show };
}

// ---------- drafts ----------

export interface RunDraft {
  ran: string;
  minutes: string;
  sleep: string;
  feel: Scale;
  readiness: Scale;
}

export interface ElseDraft {
  name: string;
  minutes: string;
  sleep: string;
  feel: Scale | 0;
  readiness: Scale | 0;
}

const num = (s: string, max: number) => {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
};

// ---------- member data ----------

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

export function useMemberData(userId: string, showToast: (m: string) => void) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<Logs>({});
  const [screen, setScreen] = useState<Screen>("home");
  const [selDate, setSelDate] = useState(todayIso);
  const logsRef = useRef(logs);
  logsRef.current = logs;

  const reload = useCallback(async () => {
    setLoad({ status: "loading" });
    try {
      const [p, l] = await Promise.all([api.fetchProfile(userId), api.fetchLogs(userId)]);
      setProfile(p);
      setLogs(l);
      setLoad({ status: "ready" });
    } catch (e) {
      setLoad({ status: "error", message: e instanceof Error ? e.message : "Couldn't load your data." });
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const plan: PlanCtx | null = useMemo(
    () =>
      profile?.journeyId && profile.planStart
        ? { journey: journeyById(profile.journeyId), td: profile.trainingDays, start: parseIso(profile.planStart) }
        : null,
    [profile],
  );

  const failed = (e: unknown) => {
    console.error(e);
    showToast("Couldn't save that. Check your connection and try again.");
  };

  /** Optimistic update of one day, then persist; roll back on failure. */
  const writeLog = (date: string, fn: (prev: DayLog) => DayLog) => {
    const before = logsRef.current[date];
    const next = fn(before ?? emptyLog());
    setLogs((l) => ({ ...l, [date]: next }));
    api.saveLog(userId, date, next).catch((e) => {
      setLogs((l) => {
        const copy = { ...l };
        if (before) copy[date] = before;
        else delete copy[date];
        return copy;
      });
      failed(e);
    });
  };

  const writeProfile = (patch: Partial<Omit<Profile, "id">>, okMsg?: string) => {
    const before = profile;
    setProfile((p) => (p ? { ...p, ...patch } : p));
    return api
      .updateProfile(userId, patch)
      .then(() => okMsg && showToast(okMsg))
      .catch((e) => {
        setProfile(before);
        failed(e);
        throw e;
      });
  };

  const actions = {
    goto: (s: Screen) => setScreen(s),
    selectDay: (iso: string) => {
      setSelDate(iso);
      setScreen("home");
    },

    saveRun: (date: string, d: RunDraft) => {
      const key = plan ? sessionKeyFor(parseIso(date), plan) : null;
      writeLog(date, (prev) => ({
        ...prev,
        ran: d.ran.trim() || (key ? SESSIONS[key].runName : "Run"),
        minutes: Math.round(num(d.minutes, 1440)),
        feel: d.feel,
        sleep: d.sleep === "" ? null : Math.round(num(d.sleep, 24) * 10) / 10,
        readiness: d.readiness,
      }));
    },

    saveElse: (date: string, d: ElseDraft) =>
      writeLog(date, (prev) => {
        const next: DayLog = { ...prev, extras: [...prev.extras] };
        if (d.name.trim())
          next.extras.push({ name: d.name.trim(), minutes: Math.round(num(d.minutes, 1440)), feel: d.feel || null });
        if (d.sleep !== "") next.sleep = Math.round(num(d.sleep, 24) * 10) / 10;
        if (d.readiness) next.readiness = d.readiness;
        if (d.feel && !next.feel) next.feel = d.feel;
        return next;
      }),

    toggleSoft: (date: string, field: "med" | "breath") => writeLog(date, (prev) => ({ ...prev, [field]: !prev[field] })),

    startJourney: (journeyId: string, when: "this" | "next", displayName?: string) =>
      writeProfile({
        journeyId,
        planStart: toIso(startMonday(when)),
        ...(displayName !== undefined ? { displayName } : {}),
      }).then(() => setSelDate(todayIso())),

    switchJourney: (journeyId: string) => {
      void writeProfile({ journeyId, planStart: toIso(startMonday("this")) }, "Journey switched. Week 1 starts this Monday.").catch(() => {});
      setSelDate(todayIso());
    },

    moveSession: (key: SessionKey, dow: number) => {
      if (!profile) return;
      const td: TrainingDays = { ...profile.trainingDays };
      const curDow = Number(Object.keys(td).find((k) => td[Number(k)] === key));
      if (curDow === dow) return;
      const occupant = td[dow];
      delete td[curDow];
      if (occupant) td[curDow] = occupant;
      td[dow] = key;
      void writeProfile({ trainingDays: td }).catch(() => {});
    },

    reload,
  };

  return { load, profile, plan, logs, screen, selDate, actions };
}

export type Member = ReturnType<typeof useMemberData>;
