# Deploying FORGE

Two services, both with free tiers to start:

- **Supabase** — login (email + password, Google) and the Postgres database.
- **AWS Amplify Hosting** — builds the site from GitHub and serves it on a global CDN with HTTPS.

Allow about 30–45 minutes the first time. Do the steps in order.

---

## 1. Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a region close to your members (e.g. `eu-west-2 London` for Lagos/Europe, `us-east-1` for the US). Save the database password somewhere safe.
2. When it's ready, open **SQL Editor → New query**, paste everything from `supabase/migrations/0001_init.sql`, and click **Run**. You should see "Success. No rows returned".
3. Open **Project Settings → API** and copy:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon public** key → this is `VITE_SUPABASE_ANON_KEY`

   (The anon key is meant to be public. Row-level security in the SQL above is what keeps each member's data private. **Never** put the `service_role` key in this app.)

## 2. Run it locally (optional but recommended)

```bash
cp .env.example .env.local     # then paste in the two values from step 1.3
npm install
npm run dev                    # http://localhost:5173
```

Create an account with email + password. With Supabase's default settings you'll get a confirmation email first.

## 3. Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com): create a project (or use one) → **APIs & Services → OAuth consent screen**. Choose **External**, fill in the app name ("FORGE"), support email and logo, and publish it.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Web application**.
   - **Authorized redirect URIs:** `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
     (Supabase shows this exact URL on its Google provider page.)
3. Copy the **Client ID** and **Client secret**.
4. In Supabase: **Authentication → Sign In / Providers → Google** → enable, paste both, save.

## 4. Deploy on AWS Amplify

1. Push this project to GitHub (`ariyibitomiwa611/forge-member-app`, `main`).
2. In the AWS Console, open **AWS Amplify → Create new app → GitHub**. Authorise GitHub, pick the repo and the `main` branch.
3. Amplify detects `amplify.yml` automatically. Before deploying, open **Advanced settings → Environment variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_COACH_EMAIL` (optional)
4. **Save and deploy.** After a few minutes you'll get a URL like `https://main.d1abc234.amplifyapp.com`.

Every push to `main` now redeploys automatically.

> If you change an environment variable later, click **Redeploy this version** — Vite bakes the values in at build time.

## 5. Tell Supabase where the site lives

In Supabase: **Authentication → URL Configuration**

- **Site URL:** your Amplify URL (or custom domain), e.g. `https://main.d1abc234.amplifyapp.com`
- **Redirect URLs:** add both
  - `https://main.d1abc234.amplifyapp.com/**`
  - `http://localhost:5173/**`

Without this, Google sign-in, email confirmation and password-reset links send people to the wrong place.

## 6. Custom domain (optional)

Amplify → your app → **Hosting → Custom domains → Add domain**. If the domain is on Route 53 it's one click; otherwise Amplify gives you DNS records to add at your registrar. Then update the Site URL and Redirect URLs in step 5 to the new domain.

## 7. Before real members join

- **Email:** Supabase's built-in sender is limited to a few emails per hour and is for testing. Set up custom SMTP (Authentication → Emails → SMTP Settings) using e.g. Amazon SES, Resend or Postmark, and edit the email templates to say FORGE.
- **Google consent screen:** make sure it's published, not in "Testing", or only listed test users can sign in.
- **Backups:** the Supabase free plan has no point-in-time recovery; upgrade to Pro once you have paying members.
- **Health data:** sleep and readiness are personal. Add a privacy policy page and a way for members to delete their account before launch.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Almost there — add VITE_SUPABASE_URL…" | Env vars missing. Add them (Amplify or `.env.local`) and redeploy / restart `npm run dev`. |
| "Your profile wasn't created" | The SQL in step 1.2 didn't run, or ran after you signed up. Run it, then in SQL Editor: `insert into profiles (id) select id from auth.users on conflict do nothing;` |
| Google sign-in returns to `localhost` or errors with "redirect_uri_mismatch" | Recheck steps 3.2 and 5. |
| "Email not confirmed" | Click the link in the confirmation email, or turn off **Confirm email** under Authentication → Sign In / Providers → Email while testing. |
