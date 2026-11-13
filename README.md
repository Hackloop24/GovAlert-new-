# GovAlert - Grievance Redressal Platform

_An open platform where residents report local problems with proof (state, district, taluk, panchayat/municipal corporation, pincode) so authorities can act on them. Anyone can view reported issues. When authorities resolve a problem they respond with proof of work, and the platform shows how much money was allocated to each problem and how it is being used._

Based on the [Hackloop24](https://github.com/orgs/Hackloop24/repositories) GovApp and Community_portal projects, combined into one workspace.

## Features

- **Report issues** with up to 5 photos / videos / PDFs and a map pin (address auto-filled from the pin)
- **Track** your own reports and all reports, with status, progress and update history
- **Map** of all pinned issues, coloured by status
- **Government response** - admins update status, add notes and upload proof of work
- **Transparency** - public statistics and fund allocation / utilisation per report
- **Accounts** - email + password with email verification, or "Continue with Google"
- **Admin dashboard** at `/admin`
- **Community portal** - discussion forum (Firebase)

## Project structure

| Folder | What | Port |
|---|---|---|
| `Backend/` | Express + MongoDB API | 5003 |
| `GovAlert/` | Main React app | 5110 |
| `Community_portal/` | Community forum (React + TypeScript, Firebase) | 4000 |

## Running locally

Requirements: Node.js 20+ and MongoDB (local or [Atlas](https://www.mongodb.com/atlas)).

1. **Configure** - copy each template and fill in your own values:
   ```
   Backend/.env.example           -> Backend/.env            (required)
   GovAlert/.env.example          -> GovAlert/.env           (optional, defaults to localhost)
   Community_portal/.env.example  -> Community_portal/.env   (required: your Firebase web app config)
   ```
   In `Backend/.env` you must set `MONGO_URI`, `JWT_SECRET` (random, 32+ characters) and the admin
   account (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Email (SMTP) and Google sign-in are optional; the
   comments in `.env.example` explain how to get each value.
2. **Install** (first time): `npm run install:all`
3. **Run**: `npm run dev` starts all three apps; open http://localhost:5110

The admin account is created/updated from `ADMIN_EMAIL` / `ADMIN_PASSWORD` every time the backend
starts. Admins sign in from the **Admin** tab on the Sign In page.

Without SMTP settings, sign-up verification codes are printed in the backend terminal (development only).

## Deploying to Vercel (everything in one project)

One Vercel project serves all three parts from a single domain:

| URL | Serves |
|---|---|
| `/` | GovAlert |
| `/community` | Community portal |
| `/api/*` | Backend (Express, as a serverless function in `api/index.js`) |

`vercel.json` holds the build and routing settings, so no build settings need changing in Vercel.

Everything fits Vercel's free **Hobby** plan (one serverless function, Blob free tier) and MongoDB
Atlas's free **M0** cluster. The backend runs in Vercel's Mumbai region (`bom1`, set in `vercel.json`);
create the Atlas cluster in **Mumbai (ap-south-1)** too so the API and database are close together.
(The Hobby plan is for non-commercial use.)

1. **Database** - create a free [MongoDB Atlas](https://www.mongodb.com/atlas) M0 cluster. Add a database
   user, and under *Network Access* allow `0.0.0.0/0` (Vercel has no fixed IP addresses). Copy the
   connection string (`mongodb+srv://...`).
2. **Import** - on [vercel.com/new](https://vercel.com/new) import this GitHub repository. Leave the
   framework preset as *Other* and the root directory as `./`.
3. **Environment variables** (Project → Settings → Environment Variables):

   | Name | Value |
   |---|---|
   | `MONGO_URI` | Atlas connection string |
   | `JWT_SECRET` | random, 32+ characters |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | admin login (password 12+ characters) |
   | `NODE_ENV` | `production` |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | email for verification codes (required in production) |
   | `GOOGLE_CLIENT_ID` | optional, for "Continue with Google" |
   | `VITE_FIREBASE_*` (6 values) | Firebase web config for the Community portal |

4. **File storage** - Project → Storage → *Create* → **Blob**, and connect it to the project. This adds
   `BLOB_READ_WRITE_TOKEN` automatically. (Vercel's disk is read-only, so uploads need Blob.)
5. **Deploy** (or redeploy after adding the variables).
6. **Google sign-in** - add `https://<your-project>.vercel.app` to the OAuth client's *Authorized
   JavaScript origins*. **Firebase** - add the domain under Authentication → Settings → Authorized domains.

Notes: on Vercel each upload request is limited to 4 MB in total (photos are resized in the browser
first); the API and frontends share one domain, so no CORS or URL settings are needed.

### Other hosts

- Set `NODE_ENV=production`: the backend then refuses to start without a strong `JWT_SECRET`, requires
  a 12+ character admin password and never prints verification codes.
- Set `CLIENT_ORIGINS` to your frontend URLs, and `TRUST_PROXY=1` behind a proxy/load balancer.
- Set `VITE_API_URL` / `VITE_COMMUNITY_URL` (GovAlert) and `VITE_GOVALERT_URL` (Community portal)
  before building the frontends. Serve everything over HTTPS.

## Security

See [SECURITY.md](SECURITY.md). Never commit `.env` files - only the `.env.example` templates belong in git.
