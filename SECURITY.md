# Security

## Reporting a vulnerability

Please do not open a public issue for security problems. Report them privately through
GitHub's **Security → Report a vulnerability** on this repository.

## Configuration and secrets

- All secrets live in `.env` files, which are git-ignored. Only `.env.example` templates are committed.
- `JWT_SECRET` must be a random string of 32+ characters. In production the backend refuses to start
  without one; in development a temporary random secret is used if it is missing.
- The admin account comes only from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; public sign-up always creates
  normal users.
- The Firebase web config in `Community_portal/.env` and the Google OAuth Client ID are visible to
  browsers by design. Protect Firebase data with **Firestore Security Rules**.

## Protections in place

| Area | Protection |
|---|---|
| Passwords | bcrypt hashes; 8-72 characters |
| Sessions | HS256-signed tokens (1 day); every protected request re-checks the account in the database |
| Email verification | 6-digit codes, hashed, expire in 10 minutes, max 5 attempts, 60 s resend cooldown |
| Google sign-in | ID tokens verified with Google; unverified accounts lose any pre-set password when linked |
| Brute force | Rate limits on sign-in, sign-up, verification codes, reports and address lookups |
| Injection | Mongoose `sanitizeFilter`, string-only inputs, length limits |
| Uploads | Allow-listed types only (JPG/PNG/GIF/WEBP/MP4/MOV/WEBM/PDF), file contents checked against the type, server-generated names, 10 MB / 5 files, served with `nosniff` |
| HTTP | Helmet security headers, CORS restricted to `CLIENT_ORIGINS`, 100 kB JSON limit, no stack traces in responses |
| Privacy | The public report list does not include who submitted each report |

## Known limitations

- Login tokens are stored in the browser's `localStorage`, so an XSS bug in the frontend could expose them.
- Rate-limit counters are kept in memory; use a shared store (e.g. Redis) if you run several backend instances.
- Reverse geocoding uses the public OpenStreetMap Nominatim service; heavy production use needs your own
  instance or a commercial provider.
