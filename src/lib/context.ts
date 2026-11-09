import type { Logs, Profile, Screen, Theme } from "./data";
import type { PlanCtx } from "./plan";
import type { Member } from "./store";

/** What every in-app screen gets: a signed-in member with a plan. */
export interface AppCtx {
  plan: PlanCtx;
  profile: Profile;
  logs: Logs;
  screen: Screen;
  selDate: string;
  actions: Member["actions"];
  theme: Theme;
  toggleTheme: () => void;
  toast: (msg: string) => void;
  signOut: () => void;
}
