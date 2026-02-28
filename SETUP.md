# Setup & Run Guide — Internship Tracker

The app uses **Firebase Auth (Google sign-in)** and is protected so only you (or emails in `ALLOWED_EMAIL`) can access the dashboard and API when deployed.

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Google account** (Gmail) for sign-in
- **Firebase project** (Firestore + Authentication) — [console.firebase.google.com](https://console.firebase.google.com)
- **OpenAI API key** (optional; for relevance scoring and cover letters)

---

## 1. Install dependencies

```bash
cd c:\VSCodeFolders\InternshipApplciation
npm install
```

---

## 2. Firebase project (Firestore + Auth)

1. Go to [Firebase Console](https://console.firebase.google.com) → create or select a project.
2. **Firestore:** Build → Firestore Database → Create database.
3. **Authentication:** Build → Authentication → Get started → **Sign-in method** → enable **Google** (and add your support email if prompted).
4. **Service account (server):** Project settings (gear) → Service accounts → Generate new private key → save the JSON. You need:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
5. **Web app config (client):** Project settings → General → Your apps → add a **Web** app if needed → copy the config. You need:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

---

## 3. Environment variables (`.env`)

Copy `.env.example` to `.env` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| **FIREBASE_PROJECT_ID** | Yes | Firebase project ID |
| **FIREBASE_CLIENT_EMAIL** | Yes | Service account email (from JSON) |
| **FIREBASE_PRIVATE_KEY** | Yes | Full `private_key` from JSON (use `\n` for newlines in one line) |
| **NEXT_PUBLIC_FIREBASE_API_KEY** | Yes | From Firebase web app config |
| **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN** | Yes | e.g. `your-project-id.firebaseapp.com` |
| **NEXT_PUBLIC_FIREBASE_PROJECT_ID** | Yes | Same as `FIREBASE_PROJECT_ID` |
| **SESSION_SECRET** or **NEXTAUTH_SECRET** | Yes | Random string for session cookie (e.g. `openssl rand -base64 32`) |
| **ALLOWED_EMAIL** | Recommended | Your Gmail so only you can sign in (comma-separated for multiple) |
| **OPENAI_API_KEY** | For AI | OpenAI API key |

**Example `.env` (local):**

```env
FIREBASE_PROJECT_ID="my-internship-tracker"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@my-internship-tracker.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="my-internship-tracker.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="my-internship-tracker"

SESSION_SECRET="your-generated-secret"
ALLOWED_EMAIL="your@gmail.com"

OPENAI_API_KEY="sk-..."
```

---

## 4. Run the app

```bash
npm run dev
```

1. Open **http://localhost:3000**.
2. Click **Sign in with Google** and sign in with your Gmail.
3. If your email is not in `ALLOWED_EMAIL`, you’ll be sent to “Access not allowed”. Add your email to `ALLOWED_EMAIL` in `.env` and try again.
4. After sign-in, click **Open Dashboard**.

---

## 5. Deploy (e.g. Vercel)

1. Push code to GitHub and import the repo in [Vercel](https://vercel.com).
2. In Project → Settings → Environment Variables, add all variables from `.env` (including every `NEXT_PUBLIC_*` and `SESSION_SECRET`).
3. In Firebase Console → Authentication → Settings → **Authorized domains**, add your production domain (e.g. `your-app.vercel.app`).
4. Deploy. Only accounts in `ALLOWED_EMAIL` (or any Google account if empty) can sign in.

---

## Quick reference

| Command | Purpose |
|--------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Run at http://localhost:3000 |
| `npm run cron` | Run 6am/6pm scrape scheduler |
| `npm run scrape:test github` | Test GitHub scraper |

---

## Restricting access to only you

Set **ALLOWED_EMAIL** to your Gmail (e.g. `your@gmail.com`). Only that account can sign in. Use a comma-separated list for multiple addresses.

---

## Troubleshooting

- **“Your email is not allowed” / redirect to /unauthorized** — Add your Gmail to `ALLOWED_EMAIL` in `.env` and restart.
- **Firebase popup errors** — Ensure Google sign-in is enabled in Firebase Authentication and your domain is in Authorized domains (for production).
- **“Missing Firebase config”** — Check server vars: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. For client: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
- **Session / cookie errors** — Set `SESSION_SECRET` (or `NEXTAUTH_SECRET`) to a long random string and restart.
