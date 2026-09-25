# Deploying PRIME UM ASCEND for real use

Recommended stack for a small pilot (10–30 users): **Vercel + Neon (Postgres) + Vercel Blob (file storage)**. All three have free tiers that comfortably cover this scale, and this matches what the original spec (§31/§43) intended.

## One-time setup

### 1. Push the code to GitHub

```bash
git remote add origin <your-new-empty-repo-url>
git push -u origin master
```

(Create the empty repo on github.com first — do not initialize it with a README, so the push doesn't conflict with this repo's existing history.)

### 2. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech), create a project.
2. Copy the connection string it gives you (it will already include `?sslmode=require`).

### 3. Apply the database schema to Neon

From your local machine, one-time:

```bash
DATABASE_URL="<your-neon-connection-string>" npx prisma migrate deploy
```

### 4. Seed the static program content (NOT demo data)

Still pointed at Neon:

```bash
DATABASE_URL="<your-neon-connection-string>" npm run db:seed:program
```

This creates the 6 phases, 24 competencies, and ~34 program actions — the content every cohort shares. It does **not** create any demo users, cohorts, or fake activity. (`npm run db:seed` — the *other* script — is for local dev only; it also creates a full fake demo cohort and must never be run against a real database.)

### 5. Import Vercel project

1. Sign up at [vercel.com](https://vercel.com), "Add New Project", import the GitHub repo from step 1.
2. Before the first deploy, set these environment variables in the Vercel project settings:
   - `DATABASE_URL` — the same Neon connection string from step 2.
   - `AUTH_SECRET` — a real random secret, **not** the `dev-secret-change-me` placeholder. Generate one:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
3. Deploy.

### 6. Attach Vercel Blob storage (required — do this before anyone uploads evidence)

In the Vercel project → Storage tab → Create Database → Blob. Once attached, Vercel automatically sets `BLOB_READ_WRITE_TOKEN` on the project and evidence uploads switch from local disk to Blob storage with no code change. **Without this step, evidence file uploads will appear to work but the files will vanish on the next deploy** — Vercel's filesystem is ephemeral.

## Onboarding real users (no signup UI exists yet)

There is currently no in-app way for people to sign themselves up or for an admin to add a user through the UI — every real account has to go through this script.

1. Create `prisma/real-users.json` (gitignored — never commit real names/emails):
   ```json
   {
     "cohort": { "id": "co-2026-01", "name": "PRIME Future UM รุ่นที่ 1", "startDate": "2026-02-01", "endDate": "2026-08-01" },
     "users": [
       { "name": "...", "email": "...", "role": "al" },
       { "name": "...", "email": "...", "role": "coach" },
       { "name": "...", "email": "...", "role": "um", "coachEmail": "...", "alEmail": "...", "startDate": "2026-02-01" }
     ]
   }
   ```
   Roles: `um` | `coach` | `al` | `admin`.
2. Run it against Neon:
   ```bash
   DATABASE_URL="<your-neon-connection-string>" npm run db:create-users -- prisma/real-users.json
   ```
3. The script prints a one-time table of `name / email / temporary password`. That is the **only** place the plaintext password is ever shown — distribute each one to its owner over a secure channel (not email in plaintext, ideally). Safe to re-run for new people later: existing accounts are left untouched.

## Known limitations to plan around

These are real gaps, not oversights to silently work around — decide how much they matter before rolling out further:

- **No self-service password reset.** If someone forgets their password, an admin re-runs `db:create-users` for just that person (it upserts by email and only regenerates the password for genuinely new accounts today — see the script's own comment if you need to force-reset an existing one).
- **No admin UI for cohorts / KPI targets / program content.** Changing any of that means editing `src/lib/domain/program-data.ts` and re-running `db:seed:program`.
- **NextAuth v5 is still in beta.** Stable and widely used, but worth knowing if you're committing to this long-term.
- **PDPA (Thailand's Personal Data Protection Act):** this app stores real employee performance data, coaching notes, and KPI history. Worth a compliance review before wider rollout, independent of anything above.
