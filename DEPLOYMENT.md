# Deployment

Notes for publishing GitQuery on free or low-cost hosting. Verified against
provider documentation; free tiers change, so confirm before committing money.

## Recommended layout

| Piece | Service | Why |
|---|---|---|
| Database | [Neon](https://neon.com) | pgvector is available on **every** plan with no paid add-on |
| Backend | [Render](https://render.com) web service (Docker) | Needs a persistent process, not serverless |
| Frontend | [Vercel](https://vercel.com) | Native Next.js hosting |
| Domain | Any registrar | See the cookie section — this is not optional polish |

## Read this first: session cookies

The frontend and backend will live on different hosts, and this app authenticates
with a **session cookie** (`credentials: "include"` in `client/lib/api.ts`).

Two rules combine badly:

- A cookie with `SameSite=Lax` — the browser default when the attribute is
  omitted, and Spring Boot does not set it — is **not sent on cross-site
  `fetch`/XHR requests**. Only on top-level navigations.
- `SameSite=None` fixes that but **must** be paired with `Secure`, and it still
  counts as a third-party cookie, which Safari's ITP and Firefox's ETP block by
  default.

**The fix is to make both hosts same-site.** SameSite compares *registrable
domains* and ignores subdomains, so `app.example.com` and `api.example.com` are
same-site and default `Lax` cookies work in every browser. Deploying to
`*.vercel.app` + `*.onrender.com` puts you on two different registrable domains
and forces `SameSite=None`, which breaks login for a share of visitors.

If you do split across registrable domains, set:

```properties
server.servlet.session.cookie.same-site=none
server.servlet.session.cookie.secure=true
```

`server.servlet.session.cookie.same-site` is documented in the Spring Boot
reference; valid values include `none`, `lax` and `strict`.

## 1. Database (Neon)

1. Create a project and database.
2. Run the extensions by hand in the Neon SQL editor — Neon will not execute
   `docker/postgres/init-extensions.sql` for you:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS hstore;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. Copy the connection string and use it as `SPRING_DATASOURCE_URL`, keeping
   `?sslmode=require`.

**Do not use Render's free Postgres.** It is capped at 1 GB and, more
importantly, **expires 30 days after creation** (14-day grace period, then
deleted). Your data would vanish a month in.

## 2. GitHub OAuth App

Create an OAuth App with the authorization callback URL:

```
https://api.example.com/login/oauth2/code/github
```

GitHub OAuth Apps accept a **single** callback URL — unlike GitHub Apps, which
allow several. Keep a separate OAuth App for localhost, or edit the URL when
switching environments.

## 3. Backend (Render)

- Create a **Web Service** pointing at this repo, root directory `backend`.
- Render detects `backend/Dockerfile` automatically. Free instances do support
  Docker; the native runtime list does not include Java.
- Health check path: `/actuator/health` (the actuator starter is already a
  dependency).
- Set the environment variables from `.env.example`. Generate **fresh** values
  for `APP_TOKEN_ENCRYPTOR_PASSWORD` and `APP_TOKEN_ENCRYPTOR_SALT`.

Two caveats about the free tier:

- Free web services **spin down after 15 minutes** without traffic and take
  roughly **a minute** to spin back up. The first visitor sees a blank page.
- Indexing is CPU- and memory-intensive (embeddings in batches of 32), and
  long-lived SSE streams can be cut by intermediary proxies. A paid instance
  with more RAM is a genuine upgrade for a demo you share publicly.

## 4. Frontend (Vercel)

- Import the repo, set the root directory to `client`.
- Set `NEXT_PUBLIC_API_BASE_URL=https://api.example.com`.
- Add the domain `app.example.com` and point its DNS at Vercel.

## Before making the link public

**The OpenAI key is the real risk.** A public URL with your key behind it means
anyone who finds the link can spend your money. Mitigations, most useful first:

1. Create a **project-scoped API key** with a hard monthly spend limit in the
   OpenAI dashboard, rather than using a personal key.
2. Add per-user throttling on `POST /api/chat/sessions/{id}/messages`.
3. Gate sign-in to an allowlist of GitHub usernames while it is a demo —
   `GithubOAuth2UserService` already has the login in hand, so the check is
   only a few lines.

Also worth fixing before people look, since both are user-visible: the prompt
never sends conversation history (follow-ups are broken), and citations always
resolve to null line numbers because `CodeChunker` never writes
`startLine`/`endLine`. See "Known limitations" in the README.
