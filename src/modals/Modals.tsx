import { useEffect, useState } from "react";
import { FEEL_COLOR, JOURNEYS, SESSIONS, SESSION_ORDER, type Scale } from "../lib/data";
import { WD, WD_LETTER, parseIso } from "../lib/dates";
import type { ElseDraft, RunDraft } from "../lib/store";
import type { AppCtx } from "../lib/context";
import { nextGroupCall, todayIso } from "../lib/plan";
import { downloadCallInvite } from "../lib/ics";
import { FieldLabel, ScalePicker, Dot } from "../components/ui";

export type ModalKind = "log" | "else" | "journey" | "days" | "coach";

const feelColor = (v: Scale) => FEEL_COLOR[v];

export function ModalLayer({ kind, app, onClose }: { kind: ModalKind; app: AppCtx; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-layer">
      <div className="modal-scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true">
        {kind === "log" && <LogRun app={app} onClose={onClose} />}
        {kind === "else" && <LogElse app={app} onClose={onClose} />}
        {kind === "journey" && <SwitchJourney app={app} onClose={onClose} />}
        {kind === "days" && <TrainingDays app={app} />}
        {kind === "coach" && <Coach app={app} />}
      </div>
    </div>
  );
}

const dayWord = (iso: string) => (iso === todayIso() ? "today" : WD[parseIso(iso).getDay()].toLowerCase());

function LogRun({ app, onClose }: { app: AppCtx; onClose: () => void }) {
  const prev = app.logs[app.selDate];
  const [d, setD] = useState<RunDraft>({
    ran: prev?.ran ?? "",
    minutes: prev?.minutes ? String(prev.minutes) : "",
    sleep: prev?.sleep != null ? String(prev.sleep) : "",
    feel: prev?.feel ?? 3,
    readiness: prev?.readiness ?? 3,
  });
  const set = (patch: Partial<RunDraft>) => setD((x) => ({ ...x, ...patch }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        app.actions.saveRun(app.selDate, d);
        onClose();
      }}
    >
      <div className="modal-title">Record {dayWord(app.selDate)}</div>
      <div className="modal-sub">Whatever happened. Nothing here judges.</div>

      <FieldLabel><label htmlFor="ran">What you ran</label></FieldLabel>
      <input id="ran" className="input" value={d.ran} onChange={(e) => set({ ran: e.target.value })} placeholder="Easy trail, tempo intervals…" />

      <div className="row-2">
        <div>
          <FieldLabel><label htmlFor="mins">Minutes</label></FieldLabel>
          <input id="mins" className="input" inputMode="numeric" value={d.minutes} onChange={(e) => set({ minutes: e.target.value })} />
        </div>
        <div>
          <FieldLabel tip="sleep"><label htmlFor="sleep">Sleep (hrs)</label></FieldLabel>
          <input id="sleep" className="input" inputMode="decimal" value={d.sleep} onChange={(e) => set({ sleep: e.target.value })} />
        </div>
      </div>

      <FieldLabel tip="feel">How it felt</FieldLabel>
      <ScalePicker label="How it felt" value={d.feel} onChange={(feel) => set({ feel })} colorFor={feelColor} />

      <FieldLabel tip="readiness">Readiness</FieldLabel>
      <ScalePicker label="Readiness" value={d.readiness} onChange={(readiness) => set({ readiness })} />

      <button type="submit" className="btn-primary">Save the day</button>
    </form>
  );
}

function LogElse({ app, onClose }: { app: AppCtx; onClose: () => void }) {
  const prev = app.logs[app.selDate];
  const [d, setD] = useState<ElseDraft>({
    name: "",
    minutes: "",
    sleep: prev?.sleep != null ? String(prev.sleep) : "",
    feel: 0,
    readiness: 0,
  });
  const set = (patch: Partial<ElseDraft>) => setD((x) => ({ ...x, ...patch }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        app.actions.saveElse(app.selDate, d);
        onClose();
      }}
    >
      <div className="modal-title">Log something else</div>
      <div className="modal-sub">An extra activity, your sleep, or how you're feeling. Fill in only what you've got.</div>

      <div className="section-label">Activity</div>
      <FieldLabel><label htmlFor="what">What was it</label></FieldLabel>
      <input id="what" className="input" value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Club run, easy jog…" />
      <FieldLabel><label htmlFor="emins">Minutes</label></FieldLabel>
      <input id="emins" className="input" inputMode="numeric" value={d.minutes} onChange={(e) => set({ minutes: e.target.value })} />

      <div className="section-label ruled">How you're doing</div>
      <FieldLabel><label htmlFor="esleep">Sleep (hrs)</label></FieldLabel>
      <input id="esleep" className="input" inputMode="decimal" value={d.sleep} onChange={(e) => set({ sleep: e.target.value })} />

      <FieldLabel tip="feel">How you feel</FieldLabel>
      <ScalePicker label="How you feel" value={d.feel} onChange={(feel) => set({ feel })} colorFor={feelColor} />

      <FieldLabel tip="readiness">Readiness</FieldLabel>
      <ScalePicker label="Readiness" value={d.readiness} onChange={(readiness) => set({ readiness })} />

      <button type="submit" className="btn-primary">Save it</button>
    </form>
  );
}

function SwitchJourney({ app, onClose }: { app: AppCtx; onClose: () => void }) {
  const [pending, setPending] = useState<string | null>(null);
  const target = JOURNEYS.find((j) => j.id === pending);

  if (target) {
    return (
      <div>
        <div className="modal-title">Start {target.name}?</div>
        <div className="modal-sub" style={{ lineHeight: 1.5 }}>
          Your plan restarts at week 1 this Monday, building toward {target.dist} over {target.weeks} weeks. Every day you've
          already recorded stays in your diary.
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            app.actions.switchJourney(target.id);
            onClose();
          }}
        >
          Switch journey
        </button>
        <button type="button" className="btn-secondary" onClick={() => setPending(null)}>Back</button>
      </div>
    );
  }

  return (
    <div>
      <div className="modal-title">Switch journey</div>
      <div className="modal-sub">Pick a distance. You can always move again.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        {JOURNEYS.map((o) => (
          <button
            type="button"
            key={o.id}
            className={o.id === app.plan.journey.id ? "option on" : "option"}
            aria-pressed={o.id === app.plan.journey.id}
            onClick={() => (o.id === app.plan.journey.id ? onClose() : setPending(o.id))}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 16, fontWeight: 400 }}>{o.name}</span>
              <span className="muted" style={{ fontSize: 13 }}>{o.dist} · {o.weeks} wks</span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{o.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TrainingDays({ app }: { app: AppCtx }) {
  const td = app.plan.td;
  return (
    <div>
      <div className="modal-title">Training days</div>
      <div className="modal-sub">Move a session to a day that suits your week.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>
        {SESSION_ORDER.map((key) => {
          const cur = Number(Object.keys(td).find((k) => td[Number(k)] === key));
          const color = `var(--${key})`;
          return (
            <div key={key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Dot size={8} color={color} />
                <span style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, color }}>{SESSIONS[key].label}</span>
                <span className="muted" style={{ fontSize: 13 }}>{SESSIONS[key].name}</span>
              </div>
              <div className="day-pick" role="group" aria-label={`${SESSIONS[key].name} day`}>
                {[1, 2, 3, 4, 5, 6, 0].map((dw) => {
                  const on = cur === dw;
                  return (
                    <button
                      type="button"
                      key={dw}
                      aria-pressed={on}
                      onClick={() => app.actions.moveSession(key, dw)}
                      style={on ? { color: "#fff", fontWeight: 600, background: color, borderColor: color } : undefined}
                    >
                      {WD_LETTER[dw]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const COACH_EMAIL = import.meta.env.VITE_COACH_EMAIL as string | undefined;

function Coach({ app }: { app: AppCtx }) {
  const call = nextGroupCall();
  return (
    <div>
      <div className="modal-title">Your coach</div>
      <div className="card-md" style={{ marginTop: 18, borderRadius: 16 }}>
        <div className="faint" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>Next group call</div>
        <div style={{ fontSize: 18, fontWeight: 400, marginTop: 6 }}>{call.label}</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Sunday reflection, all journeys together.</div>
      </div>
      {COACH_EMAIL ? (
        <a className="btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 24, borderRadius: 16, padding: 17 }} href={`mailto:${COACH_EMAIL}?subject=${encodeURIComponent("FORGE: a note for my coach")}`}>
          Message your coach
        </a>
      ) : (
        <button type="button" className="btn-primary" onClick={() => app.toast("Coach messaging is coming soon.")}>Message your coach</button>
      )}
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          downloadCallInvite(call.date);
          app.toast("Calendar invite downloaded. Open it to add the weekly call.");
        }}
      >
        Add call to calendar
      </button>
    </div>
  );
}
