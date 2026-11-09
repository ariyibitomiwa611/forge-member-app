# FORGE — member app

A calm training diary for FORGE Running Labs members. Members sign in, choose a distance journey (5K → 50K+), and the app lays out their weeks: what to run each day, a place to record how it went, meditation and breathwork check-offs, and a plain-language read of each week.

**Stack:** React 18 + TypeScript (Vite) · Supabase (auth + Postgres with row-level security) · AWS Amplify Hosting.

## Run it

```bash
cp .env.example .env.local   # add your Supabase URL and anon key
npm install
npm run dev                  # http://localhost:5173
```

Full setup — Supabase, Google sign-in and AWS deployment — is in **[DEPLOY.md](DEPLOY.md)**.

## What works

- **Accounts:** email + password (with confirmation and password reset) and Google sign-in.
- **Onboarding:** name, distance, and whether week 1 starts this week or next.
- **Home:** today's session or rest day, record a run (minutes, sleep, feel, readiness), log extra activities, meditation and breathwork check-offs, the coach's read of the week.
- **Calendar:** every week of the journey as a scrollable diary; tap a day to open it.
- **Plan:** progress, weekly minutes done vs planned, meditation / breathwork / recovery rings, move training days, switch journey, and a downloadable calendar invite for the Sunday group call.
- Everything saves to the member's own rows in Postgres; nobody can read anyone else's data.
- Light and dark themes; on phones the sidebar becomes a bottom tab bar.

**Not yet:** Strava / Oura / Apple Watch sync, payments, in-app coach messaging (the button opens email if `VITE_COACH_EMAIL` is set), account deletion.

## Structure

```
supabase/migrations/0001_init.sql   tables, row-level security, new-user trigger
src/
  lib/api.ts         Supabase client and queries
  lib/store.ts       member data hook (optimistic saves), theme, toasts
  lib/plan.ts        plan maths: weekly volume, sessions, week summaries
  lib/data.ts        types, journeys, sessions, copy
  lib/ics.ts         weekly group-call calendar invite
  screens/           Auth, Onboarding, Home, Calendar, Plan
  modals/Modals.tsx  record run, log something else, switch journey, training days, coach
  components/        Sidebar, InfoTip, ScalePicker, Dot
amplify.yml          AWS Amplify build settings
```
