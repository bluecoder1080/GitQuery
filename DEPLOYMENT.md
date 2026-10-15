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

GitHub OAuth Apps accept **up to 10 callback URLs**, so a single app serves both
localhost and production. Add both rather than creating a second app:

```
http://localhost:8080/login/oauth2/code/github
https://api.example.com/login/oauth2/code/github
```

Leave **Allow wildcard matching** disabled on each. It exists for apps with
dynamic subdomains; enabling it only requires the host's non-subdomain part and
port to match and the path to be a subdirectory, which widens what GitHub will
accept as a redirect target. GitHub's docs warn it "can expose your app to
security risks". Note that apps with a single callback URL created before
3 August 2026 have it enabled by default, so check existing apps.

## 3. Backend (Render)

**The quickest route is the blueprint in [`render.yaml`](render.yaml).** Import it
at Render → Blueprints → New Blueprint Instance and point it at this repository.
Render creates the service and prompts for the eight credential values, which are
marked `sync: false` so they are never stored in git. It also pins the region to
`ohio` (us-east-2) to sit beside a Neon database in the same region.

To configure it by hand instead:

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

**The Anthropic key is the real risk.** A public URL with your key behind it
means anyone who finds the link can spend your money. Mitigations, most useful
first:

1. Create a **project-scoped API key** with a hard monthly spend limit in the
   Anthropic console, rather than using a personal key.
2. Add per-user throttling on `POST /api/chat/sessions/{id}/messages`.
3. Gate sign-in to an allowlist of GitHub usernames while it is a demo —
   `GithubOAuth2UserService` already has the login in hand, so the check is
   only a few lines.

Embeddings are less exposed: they run locally through ONNX, so indexing a
repository costs nothing and needs no credential. Only chat calls out to a paid
API.

Two deployment consequences of running embeddings locally:

- **Memory.** Loading the ONNX model plus the JVM needs headroom. A 512 MB
  instance may struggle; 1 GB is safer.
- **First-run latency.** The model is downloaded and cached on first use, so the
  very first index on a cold instance is slower than subsequent ones.

Also worth fixing before people look, since both are user-visible: the prompt
never sends conversation history (follow-ups are broken), and citations always
resolve to null line numbers because `CodeChunker` never writes
`startLine`/`endLine`. See "Known limitations" in the README.
