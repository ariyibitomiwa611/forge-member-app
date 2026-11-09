import type { Screen } from "../lib/data";
import type { AppCtx } from "../lib/context";
import { currentWeek } from "../lib/plan";

const TABS: { id: Screen; icon: string; label: string }[] = [
  { id: "home", icon: "◇", label: "Home" },
  { id: "calendar", icon: "▤", label: "Calendar" },
  { id: "plan", icon: "◎", label: "Plan" },
];

export function Sidebar({ app }: { app: AppCtx }) {
  const { screen, theme, actions, profile, plan } = app;
  const name = profile.displayName || "Runner";
  const { raw } = currentWeek(plan);
  const status =
    raw < 0 ? "Starts Monday" : raw >= plan.journey.weeks ? "Journey complete" : `${plan.journey.name} · Wk ${raw + 1}`;

  return (
    <aside className="side">
      <div className="brand">FORGE</div>
      <nav className="nav" aria-label="Main">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            className={screen === t.id ? "nav-btn active" : "nav-btn"}
            aria-current={screen === t.id ? "page" : undefined}
            onClick={() => actions.goto(t.id)}
          >
            <span className="icon" aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <div className="side-foot">
        <div className="member">
          <span className="avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span className="member-name">{name}</span>
            <span className="member-sub">{status}</span>
          </span>
        </div>
        <button type="button" className="theme-btn" aria-label="Toggle light and dark" onClick={app.toggleTheme}>
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          <span className="theme-text">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
        <button type="button" className="theme-btn signout" onClick={app.signOut}>
          <span aria-hidden="true">⎋</span>
          <span className="theme-text">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
