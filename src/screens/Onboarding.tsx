import { type FormEvent, useState } from "react";
import { DEFAULT_JOURNEY, JOURNEYS, type Profile } from "../lib/data";
import { shortDate, startMonday } from "../lib/plan";
import type { Member } from "../lib/store";

/** First run: name, distance, and when week 1 starts. */
export function Onboarding({ profile, actions, onSignOut }: { profile: Profile; actions: Member["actions"]; onSignOut: () => void }) {
  const [name, setName] = useState(profile.displayName);
  const [journeyId, setJourneyId] = useState(profile.journeyId ?? DEFAULT_JOURNEY);
  const [when, setWhen] = useState<"this" | "next">("this");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await actions.startJourney(journeyId, when, name.trim());
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" style={{ maxWidth: 520 }} onSubmit={submit}>
        <div className="brand" style={{ padding: "0 0 28px" }}>FORGE</div>
        <h1 className="modal-title" style={{ margin: 0 }}>Choose your journey</h1>
        <p className="modal-sub" style={{ margin: "4px 0 0" }}>Pick a distance. You can always move again.</p>

        <label className="field-label" htmlFor="oname" style={{ marginTop: 22 }}>What should we call you?</label>
        <input id="oname" className="input" value={name} onChange={(e) => setName(e.target.value)} required />

        <fieldset style={{ border: 0, padding: 0, margin: "22px 0 0" }}>
          <legend className="field-label" style={{ margin: "0 0 8px" }}>Distance</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {JOURNEYS.map((o) => (
              <button
                type="button"
                key={o.id}
                className={o.id === journeyId ? "option on" : "option"}
                aria-pressed={o.id === journeyId}
                onClick={() => setJourneyId(o.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 16, fontWeight: 400 }}>{o.name}</span>
                  <span className="muted" style={{ fontSize: 13 }}>{o.dist} · {o.weeks} wks</span>
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{o.blurb}</div>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ border: 0, padding: 0, margin: "22px 0 0" }}>
          <legend className="field-label" style={{ margin: "0 0 8px" }}>Week 1 starts</legend>
          <div className="scale">
            {(["this", "next"] as const).map((w) => (
              <button type="button" key={w} className={when === w ? "on" : undefined} aria-pressed={when === w} onClick={() => setWhen(w)}>
                {w === "this" ? "This week" : "Next week"} · {shortDate(startMonday(w))}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="modal-sub" style={{ marginTop: 16, lineHeight: 1.5 }}>
          Sessions land on Tuesday, Thursday and Saturday to begin with. Move them any time from the Plan tab.
        </p>

        <button type="submit" className="btn-primary" style={{ marginTop: 18 }} disabled={busy}>
          {busy ? "Drawing your plan…" : "Start my journey"}
        </button>
        <div className="auth-links">
          <button type="button" onClick={onSignOut}>Not you? <strong>Sign out</strong></button>
        </div>
      </form>
    </div>
  );
}
