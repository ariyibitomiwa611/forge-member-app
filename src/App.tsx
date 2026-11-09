import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { MONTHS, WD, parseIso } from "./lib/dates";
import { isConfigured, supabase } from "./lib/api";
import { useMemberData, useTheme, useToast } from "./lib/store";
import type { AppCtx } from "./lib/context";
import { todayIso } from "./lib/plan";
import { Sidebar } from "./components/Sidebar";
import { HomeScreen } from "./screens/HomeScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { PlanScreen } from "./screens/PlanScreen";
import { AuthScreen, SetPasswordScreen } from "./screens/AuthScreen";
import { Onboarding } from "./screens/Onboarding";
import { ModalLayer, type ModalKind } from "./modals/Modals";

export default function App() {
  const themeCtl = useTheme();
  const { toast, showToast } = useToast();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured) return <Notice title="Almost there" body="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment (see DEPLOY.md), then reload." />;
  if (session === undefined) return <Splash />;

  let body;
  if (recovering && session) {
    body = (
      <SetPasswordScreen
        onDone={() => {
          setRecovering(false);
          showToast("Password updated.");
        }}
      />
    );
  } else if (!session) {
    body = <AuthScreen />;
  } else {
    body = <SignedIn key={session.user.id} userId={session.user.id} theme={themeCtl} showToast={showToast} />;
  }

  return (
    <>
      {body}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

const signOut = () => {
  void supabase.auth.signOut();
};

function SignedIn({
  userId,
  theme,
  showToast,
}: {
  userId: string;
  theme: ReturnType<typeof useTheme>;
  showToast: (m: string) => void;
}) {
  const member = useMemberData(userId, showToast);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const closeModal = useCallback(() => setModal(null), []);

  if (member.load.status === "loading" && !member.profile) return <Splash />;
  if (member.load.status === "error")
    return <Notice title="Couldn't load your diary" body={member.load.message} action={{ label: "Try again", onClick: member.actions.reload }} />;
  if (!member.profile) return <Splash />;
  if (!member.plan) return <Onboarding profile={member.profile} actions={member.actions} onSignOut={signOut} />;

  const app: AppCtx = {
    plan: member.plan,
    profile: member.profile,
    logs: member.logs,
    screen: member.screen,
    selDate: member.selDate,
    actions: member.actions,
    theme: theme.theme,
    toggleTheme: theme.toggleTheme,
    toast: showToast,
    signOut,
  };

  const { screen, selDate, plan } = app;
  const sel = parseIso(selDate);
  const eyebrow =
    screen === "home"
      ? `${WD[sel.getDay()]} ${sel.getDate()} ${MONTHS[sel.getMonth()]}${selDate === todayIso() ? " · today" : ""}`
      : `${plan.journey.name} · ${plan.journey.dist}`;
  const title = screen === "home" ? "Home" : screen === "calendar" ? "Calendar" : "The plan";

  return (
    <div className="shell">
      <Sidebar app={app} />
      <main className="main">
        <div className="pad">
          <header className="page-head">
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="title" style={{ margin: "5px 0 0" }}>{title}</h1>
          </header>
          {screen === "home" && <HomeScreen key={selDate} app={app} openModal={setModal} />}
          {screen === "calendar" && <CalendarScreen app={app} />}
          {screen === "plan" && <PlanScreen app={app} openModal={setModal} />}
        </div>
      </main>
      {modal && <ModalLayer kind={modal} app={app} onClose={closeModal} />}
    </div>
  );
}

function Splash() {
  return (
    <div className="auth-shell" aria-busy="true">
      <div className="brand splash">FORGE</div>
    </div>
  );
}

function Notice({ title, body, action }: { title: string; body: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand" style={{ padding: "0 0 28px" }}>FORGE</div>
        <h1 className="modal-title" style={{ margin: 0 }}>{title}</h1>
        <p className="modal-sub" style={{ lineHeight: 1.5 }}>{body}</p>
        {action && <button type="button" className="btn-primary" style={{ marginTop: 18 }} onClick={action.onClick}>{action.label}</button>}
      </div>
    </div>
  );
}
