import { useState } from "react";
import { APPS, SESSION_ORDER, type TipKey } from "../lib/data";
import { WD, addDays, avg, clamp, mondayOf, toIso } from "../lib/dates";
import { currentWeek, nextGroupCall, today, totalMinutes, weekMinutes, weekMonday } from "../lib/plan";
import type { AppCtx } from "../lib/context";
import { InfoTip } from "../components/ui";
import type { ModalKind } from "../modals/Modals";

const RING_R = 30;
const RING_C = 2 * Math.PI * RING_R;

export function PlanScreen({ app, openModal }: { app: AppCtx; openModal: (m: ModalKind) => void }) {
  const { plan, logs, toast } = app;
  const { journey: j, td } = plan;
  const [hoverBar, setHoverBar] = useState<number | null>(null);
  const { raw: rawWeek, clamped: curWeek } = currentWeek(plan);
  const notStarted = rawWeek < 0;
  const finished = rawWeek >= j.weeks;
  const weeksBehind = notStarted ? 0 : finished ? j.weeks : curWeek;

  // ---- weekly bars ----
  let maxV = 0;
  for (let w = 1; w <= j.weeks; w++) maxV = Math.max(maxV, weekMinutes(j, w));
  const scale = 126 / maxV;
  const bars = Array.from({ length: j.weeks }, (_, w) => {
    const wm = weekMonday(plan, w);
    const planned = weekMinutes(j, w + 1);
    let actual = 0;
    let sessions = 0;
    for (let i = 0; i < 7; i++) {
      const l = logs[toIso(addDays(wm, i))];
      actual += totalMinutes(l);
      if (l?.ran) sessions++;
    }
    return { w, planned, actual, sessions, future: w > rawWeek };
  });

  let caption = "Hover a week to see what you did.";
  if (hoverBar != null) {
    const b = bars[hoverBar];
    caption = b.future
      ? `Week ${hoverBar + 1} · ${b.planned} min planned`
      : `Week ${hoverBar + 1} · ${b.actual} of ${b.planned} min · ${b.sessions} session${b.sessions === 1 ? "" : "s"}`;
  }

  // ---- softer-side rings (current week) ----
  const cwMon = mondayOf(today());
  let medC = 0;
  let brC = 0;
  const rd: number[] = [];
  for (let i = 0; i < 7; i++) {
    const l = logs[toIso(addDays(cwMon, i))];
    if (!l) continue;
    if (l.med) medC++;
    if (l.breath) brC++;
    if (l.readiness) rd.push(l.readiness);
  }
  const rings: { pct: number; color: string; label: string; sub: string; tip: TipKey }[] = [
    { pct: medC / 4, color: "var(--endure)", label: "Meditation", sub: `${medC} / 4`, tip: "meditation" },
    { pct: brC / 5, color: "var(--form)", label: "Breathwork", sub: `${brC} / 5`, tip: "breathwork" },
    { pct: avg(rd) / 5, color: "var(--rehearse)", label: "Recovery", sub: rd.length ? `${avg(rd).toFixed(1)} / 5` : "—", tip: "recovery" },
  ];

  // ---- adherence ----
  let plannedSoFar = 0;
  let actualSoFar = 0;
  for (let w = 0; w < weeksBehind; w++) {
    plannedSoFar += weekMinutes(j, w + 1);
    const wm = weekMonday(plan, w);
    for (let i = 0; i < 7; i++) actualSoFar += totalMinutes(logs[toIso(addDays(wm, i))]);
  }
  const adh = plannedSoFar ? Math.round((actualSoFar / plannedSoFar) * 100) : 100;
  const adherenceLine = notStarted
    ? `Week 1 begins ${WD[plan.start.getDay()]} ${plan.start.getDate()}. Nothing to chase yet.`
    : weeksBehind === 0
      ? "Your first week. Every minute you record from here shows up on the chart below."
      : adh >= 97
      ? `Right on the plan as it was drawn — ${adh}% of the minutes, without chasing them.`
      : adh >= 85
        ? `${adh}% of the minutes so far. A little under the line, which is often the wiser side of it.`
          : `You've run your own version of the plan — ${adh}% of the drawn minutes. The shape still holds.`;
  const call = nextGroupCall();

  const dayOf = (key: string) => {
    const d = Object.keys(td).find((k) => td[Number(k)] === key);
    return d === undefined ? "—" : WD[Number(d)];
  };

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 30, fontWeight: 300 }}>{finished ? "Complete" : `Week ${curWeek + 1}`}</span>
          <span className="muted" style={{ fontSize: 15 }}>of {j.weeks}</span>
        </div>
        <div className="progress"><span style={{ width: `${Math.round((weeksBehind / j.weeks) * 100)}%` }} /></div>
        <div className="faint" style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12 }}>
          <span>{weeksBehind} behind you</span>
          <span>{finished ? 0 : j.weeks - weeksBehind - (notStarted ? 0 : 1)} ahead</span>
        </div>
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 14 }}>{adherenceLine}</div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="label">Weekly minutes</span>
          <span className="legend">
            <span><i style={{ background: "var(--accent)" }} />done</span>
            <span><i style={{ background: "var(--surface-2)" }} />planned</span>
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 400, marginTop: 10, minHeight: 18, color: hoverBar != null ? "var(--ink)" : "var(--ink-3)" }} aria-live="polite">
          {caption}
        </div>
        <div className="bars">
          {bars.map((b) => {
            const isCur = b.w === rawWeek;
            const hov = hoverBar === b.w;
            return (
              <button
                type="button"
                key={b.w}
                className="bar"
                aria-label={`Week ${b.w + 1}`}
                onMouseEnter={() => setHoverBar(b.w)}
                onMouseLeave={() => setHoverBar(null)}
                onFocus={() => setHoverBar(b.w)}
                onBlur={() => setHoverBar(null)}
              >
                <div className={hov ? "bar-track hover" : "bar-track"} style={{ height: Math.max(4, Math.round(b.planned * scale)) }}>
                  <span
                    className="bar-fill"
                    style={{ height: Math.round(Math.min(b.actual, b.planned * 1.15) * scale), opacity: isCur ? 1 : 0.78 }}
                  />
                </div>
                <span className={isCur || hov ? "bar-n hi" : "bar-n"}>{b.w + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div className="label" style={{ marginBottom: 6 }}>The softer side · this week</div>
        <div className="rings">
          {rings.map((r) => (
            <div className="ring" key={r.label}>
              <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
                <circle cx="38" cy="38" r={RING_R} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
                <circle
                  cx="38" cy="38" r={RING_R} fill="none" stroke={r.color} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={RING_C.toFixed(1)}
                  strokeDashoffset={(RING_C * (1 - clamp(r.pct, 0, 1))).toFixed(1)}
                  transform="rotate(-90 38 38)"
                />
              </svg>
              <span className="tip-wrap">
                <span style={{ fontSize: 12, fontWeight: 400 }}>{r.label}</span>
                <InfoTip tip={r.tip} />
              </span>
              <span className="faint" style={{ fontSize: 11 }}>{r.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="label" style={{ padding: "0 2px 10px" }}>Manage the plan</div>
        <div className="list">
          <button type="button" className="list-row" onClick={() => openModal("days")}>
            <span>Training days</span>
            <span className="faint" style={{ fontSize: 13 }}>{SESSION_ORDER.map(dayOf).join(" · ")} ›</span>
          </button>
          <button type="button" className="list-row" onClick={() => openModal("journey")}>
            <span>Switch journey</span>
            <span className="faint" style={{ fontSize: 13 }}>{j.name} ›</span>
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
          <div className="label" style={{ padding: "0 2px 10px" }}>Connected apps</div>
          <div className="list">
            {APPS.map((a) => (
              <div className="list-row" key={a.id} style={{ padding: "16px 20px" }}>
                <span>{a.name}</span>
                <button type="button" className="btn-pill" onClick={() => toast(`${a.name} sync is coming soon.`)}>
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div className="label" style={{ padding: "0 2px 10px" }}>Your coach</div>
          <button type="button" className="coach-card" onClick={() => openModal("coach")}>
            <div style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.4 }}>The weekly group call is the heart of this.</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>Next call {call.label} · tap for details</div>
          </button>
        </div>
      </div>
    </div>
  );
}
