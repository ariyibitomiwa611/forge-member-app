import { BREATH_NAMES, FEEL_COLOR, FEEL_WORD, MED_NAMES, REST_LINES, SESSIONS } from "../lib/data";
import { WD, WD_LETTER, addDays, mondayOf, parseIso, toIso } from "../lib/dates";
import { planEnd, sessionKeyFor, sessionMinutes, shortDate, todayIso, weekIndexOf, weekStats, weekText } from "../lib/plan";
import type { AppCtx } from "../lib/context";
import { Dot } from "../components/ui";
import type { ModalKind } from "../modals/Modals";

export function HomeScreen({ app, openModal }: { app: AppCtx; openModal: (m: ModalKind) => void }) {
  const { plan, logs, selDate, actions, profile } = app;
  const isoToday = todayIso();
  const selD = parseIso(selDate);
  const wIdx = weekIndexOf(selD, plan.start);
  const inPlan = wIdx >= 0 && wIdx < plan.journey.weeks;
  const sk = sessionKeyFor(selD, plan);
  const log = logs[selDate];
  const runLogged = !!log?.ran;
  const isFuture = selDate > isoToday;
  const isToday = selDate === isoToday;
  const isSunday = selD.getDay() === 0;
  const dayWord = isToday ? "today" : WD[selD.getDay()].toLowerCase();
  const firstName = (profile.displayName || "").split(" ")[0];

  const mon = mondayOf(selD);
  const strip = Array.from({ length: 7 }, (_, i) => {
    const dt = addDays(mon, i);
    const k = toIso(dt);
    const kk = sessionKeyFor(dt, plan);
    const col = kk ? `var(--${kk})` : "var(--ink-3)";
    return { dt, k, kk, col, done: !!logs[k]?.ran };
  });

  const stats = weekStats(wIdx, logs, plan);
  const medOn = !!log?.med;
  const breathOn = !!log?.breath;
  const softIdx = Math.max(0, wIdx);

  let restTitle = isToday ? `Rest up${firstName ? `, ${firstName}` : ""}.` : "A rest day.";
  let restLine = REST_LINES[selD.getDate() % REST_LINES.length];
  if (wIdx < 0) {
    restTitle = "Not long now.";
    restLine = `${plan.journey.name} begins ${shortDate(plan.start)}. Until then, run easy and sleep well — the first week will meet you where you are.`;
  } else if (!inPlan) {
    restTitle = "Journey complete.";
    restLine = `${plan.journey.name} wrapped up ${shortDate(planEnd(plan))}. Pick your next distance from the Plan tab whenever you're ready.`;
  }

  return (
    <div className="page">
      <div className="strip">
        {strip.map(({ dt, k, kk, col, done }) => (
          <button
            type="button"
            key={k}
            className={k === selDate ? "strip-day selected" : "strip-day"}
            aria-pressed={k === selDate}
            aria-label={dt.toDateString()}
            onClick={() => actions.selectDay(k)}
          >
            <span className="strip-wd">{WD_LETTER[dt.getDay()]}</span>
            <span className={k === isoToday ? "strip-num is-today" : "strip-num"}>{dt.getDate()}</span>
            <Dot size={6} color={kk && done ? col : "transparent"} outline={kk ? col : "transparent"} />
          </button>
        ))}
      </div>

      <div className="cols">
        <div className="col col-l">
          {sk ? (
            <div className="card">
              <div className="session-tag" style={{ color: `var(--${sk})` }}>
                <Dot size={9} color={`var(--${sk})`} />
                <span>{SESSIONS[sk].label}</span>
              </div>
              <div className="big-title">{SESSIONS[sk].name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14 }}>
                <span className="big-num">{sessionMinutes(plan.journey, wIdx + 1, sk)}</span>
                <span className="muted" style={{ fontSize: 14 }}>minutes</span>
              </div>
              <div className="body-text">{SESSIONS[sk].note}</div>
            </div>
          ) : (
            <div className="card" style={{ padding: "30px 26px" }}>
              <div className="label" style={{ letterSpacing: "0.24em", marginBottom: 14 }}>Rest</div>
              <div className="big-title">{restTitle}</div>
              <div className="body-text" style={{ lineHeight: 1.6 }}>{restLine}</div>
            </div>
          )}

          {!isFuture && !runLogged && (sk || !inPlan) && (
            <button type="button" className="btn-primary" onClick={() => openModal("log")}>
              Record {sk ? dayWord : "a run"}
            </button>
          )}

          {sk && isFuture && <div className="future-note">You'll record this on the day. Nothing expires.</div>}

          {runLogged && log && (
            <div className="card-md">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span className="faint" style={{ fontSize: 12 }}>Recorded</span>
                <button type="button" className="link-btn" onClick={() => openModal("log")}>Edit</button>
              </div>
              <div style={{ fontSize: 16, fontWeight: 400 }}>{log.ran}</div>
              <div className="stats">
                <div className="stat"><span className="stat-v">{log.minutes}</span><span className="stat-k">minutes</span></div>
                <div className="stat" style={{ gap: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Dot size={9} color={log.feel ? FEEL_COLOR[log.feel] : "var(--ink-3)"} />
                    <span style={{ fontSize: 15, fontWeight: 400 }}>{log.feel ? FEEL_WORD[log.feel] : "—"}</span>
                  </span>
                  <span className="stat-k">how it felt</span>
                </div>
                <div className="stat"><span className="stat-v">{log.sleep ?? "—"}</span><span className="stat-k">hrs sleep</span></div>
                <div className="stat"><span className="stat-v">{log.readiness ?? "—"}</span><span className="stat-k">readiness</span></div>
              </div>
            </div>
          )}

          {!isFuture && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SoftCard kicker="Meditation" name={MED_NAMES[softIdx % MED_NAMES.length]} on={medOn} onClick={() => actions.toggleSoft(selDate, "med")} />
              <SoftCard kicker="Breathwork" name={BREATH_NAMES[softIdx % BREATH_NAMES.length]} on={breathOn} onClick={() => actions.toggleSoft(selDate, "breath")} />
            </div>
          )}
        </div>

        <div className="col col-r">
          <div className="card-soft">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="label">{isSunday ? "The week, gathered" : "What your week is saying"}</span>
              {isSunday && (
                <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 600 }}>
                  Field note
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.6 }}>{weekText(stats, isSunday)}</div>
            {stats.feels.length > 1 && (
              <div className="spark" aria-label="How each run felt this week">
                {stats.feels.map((f, i) => (
                  <span key={i} title={FEEL_WORD[f]} style={{ height: 8 + f * 5, background: FEEL_COLOR[f] }} />
                ))}
              </div>
            )}
            <div className="faint" style={{ fontSize: 12, marginTop: 12, fontWeight: 400 }}>— Your coach</div>
          </div>

          {!isFuture && (
            <button type="button" className="btn-ghost" onClick={() => openModal("else")}>+ Log something else</button>
          )}

          {log && log.extras.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {log.extras.map((e, i) => (
                <div className="extra-row" key={i}>
                  <span style={{ fontSize: 14, fontWeight: 400 }}>{e.name}</span>
                  <span className="faint" style={{ fontSize: 13 }}>{e.minutes} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SoftCard({ kicker, name, on, onClick }: { kicker: string; name: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" className="soft-card" aria-pressed={on} onClick={onClick}>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
        <span className="kicker">{kicker}</span>
        <span className="name">{name}</span>
      </span>
      <span className={on ? "check on" : "check"} aria-hidden="true">{on ? "✓" : ""}</span>
    </button>
  );
}
