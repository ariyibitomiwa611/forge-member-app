import { useEffect, useRef } from "react";
import { FEEL_COLOR, FEEL_WORD, SESSIONS } from "../lib/data";
import { MONTHS, WD_LETTER, addDays, toIso } from "../lib/dates";
import { currentWeek, sessionKeyFor, todayIso, weekMinutes, weekMonday } from "../lib/plan";
import type { AppCtx } from "../lib/context";
import { Dot } from "../components/ui";

export function CalendarScreen({ app }: { app: AppCtx }) {
  const { plan, logs, actions } = app;
  const { journey } = plan;
  const { raw: curWeek } = currentWeek(plan);
  const isoToday = todayIso();
  const currentRef = useRef<HTMLDivElement>(null);

  // Open on the current week rather than week 1.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <div className="page">
      <div className="muted" style={{ fontSize: 13, lineHeight: 1.5, padding: "0 2px 18px" }}>
        Scrolling through this should feel like turning pages of a training diary. Tap any day to open it.
      </div>
      {Array.from({ length: journey.weeks }, (_, w) => {
        const wm = weekMonday(plan, w);
        const sun = addDays(wm, 6);
        const isCur = w === curWeek;
        return (
          <div className="week-block" key={w} ref={isCur ? currentRef : undefined} style={{ scrollMarginTop: 24 }}>
            <div className="week-head">
              <span style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: isCur ? "var(--accent)" : "var(--ink-2)" }}>
                Week {w + 1}
              </span>
              <span className="faint" style={{ fontSize: 12 }}>
                {wm.getDate()} {wm.getMonth() !== sun.getMonth() ? MONTHS[wm.getMonth()] + " " : ""}– {sun.getDate()} {MONTHS[sun.getMonth()]} · {weekMinutes(journey, w + 1)} min
              </span>
            </div>
            <div className="week-rows">
              {Array.from({ length: 7 }, (_, i) => {
                const dt = addDays(wm, i);
                const k = toIso(dt);
                const kk = sessionKeyFor(dt, plan);
                const l = logs[k];
                const isTod = k === isoToday;
                const future = k > isoToday;
                const plan_ = kk ? `${SESSIONS[kk].label[0]}${SESSIONS[kk].label.slice(1).toLowerCase()} · ${SESSIONS[kk].name}` : "Rest";

                let status = "";
                let statusColor = "var(--ink-3)";
                if (kk) {
                  if (l?.ran) {
                    status = l.feel ? FEEL_WORD[l.feel] : "Logged";
                    if (l.feel) statusColor = FEEL_COLOR[l.feel];
                  } else if (!future) status = "—";
                } else if (l?.extras.length) {
                  status = `${l.extras[0].minutes} min`;
                } else if (!future) {
                  status = "rest";
                }

                return (
                  <button type="button" key={k} className={isTod ? "cal-row today" : "cal-row"} onClick={() => actions.selectDay(k)}>
                    <span style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                      <span className="cal-date">
                        <span className="faint" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>{WD_LETTER[dt.getDay()]}</span>
                        <span className={isTod ? "is-today" : undefined} style={{ fontSize: 14, fontWeight: 400 }}>{dt.getDate()}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                        <Dot size={7} color={kk ? `var(--${kk})` : "var(--line)"} />
                        <span className="cal-plan" style={{ color: kk ? "var(--ink)" : "var(--ink-3)" }}>{plan_}</span>
                      </span>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 400, color: statusColor, flex: "none" }}>{status}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
