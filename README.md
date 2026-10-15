# GitQuery

<p align="center">
  <strong>Ask your codebase anything — answers grounded in the real source, cited to the file.</strong>
</p>

<p align="center">
  <a href="https://git-query-xi.vercel.app/"><img src="https://img.shields.io/badge/demo-live-brightgreen?style=flat-square" alt="Live demo" /></a>
  <img src="https://img.shields.io/badge/backend-Spring_Boot_4.1-6DB33F?style=flat-square" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/frontend-Next.js_16-black?style=flat-square" alt="Next.js" />
  <img src="https://img.shields.io/badge/chat-Claude_Haiku_5.5-D97757?style=flat-square" alt="Claude" />
  <img src="https://img.shields.io/badge/embeddings-local_ONNX-blue?style=flat-square" alt="ONNX" />
  <img src="https://img.shields.io/badge/db-Postgres_%2B_pgvector-336791?style=flat-square" alt="Postgres" />
  <img src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square" alt="MIT" />
</p>

<p align="center">
  <a href="https://git-query-xi.vercel.app/"><strong>Try it live</strong></a>
  ·
  <a href="#-quickstart">Quickstart</a>
  ·
  <a href="#-how-it-works">How it works</a>
  ·
  <a href="#-deployment">Deployment</a>
</p>

---

Sign in with GitHub, pick a repository, let it index, then chat. Retrieval is **scoped per repository**, so answers never mix code from different projects. Every answer carries **clickable citations** that link straight back to the file on GitHub.

## What's inside

| | |
|---|---|
| **Natural-language code search** | Ask in plain English, get answers built from the actual git tree — not a model's memory of it |
| **Per-repo vector isolation** | Similarity search is filtered on `repoId` inside the database query itself |
| **Streaming answers** | Replies arrive token-by-token over SSE with named events (`user_message`, `token`, `assistant_message`, `done`) |
| **Private by default** | GitHub tokens are AES-encrypted at rest; indexes live in your own database |
| **Zero embedding cost** | Embeddings run locally via ONNX (`all-MiniLM-L6-v2`), so indexing needs no second API key |
| **Single-domain auth** | Frontend proxies `/api`, `/oauth2`, `/login/oauth2` to Spring, so the session cookie stays first-party |

## How it works

```
GitHub OAuth ──► Sync repos ──► Index (async, 202) ──► Ask (SSE stream)
                      │               │                        │
                 cached in DB   git tree → chunks →     embed question →
                                embed (ONNX) →          retrieve top-k for
                                pgvector                THIS repo only →
                                                        Claude answers
```

1. **Sign in** — GitHub OAuth2. The access token is encrypted before it is persisted.
2. **Sync** — repositories are pulled from the GitHub API and cached in the database.
3. **Index** — the recursive git tree is filtered (lockfiles, build output and vendored code are skipped), each file is split into overlapping chunks, and the chunks are embedded into Postgres via pgvector. This runs asynchronously so the HTTP request returns `202` immediately, with progress written back for the client to poll.
4. **Ask** — the question is embedded, the most similar chunks *for that repository* are retrieved, and Claude answers with citations.

> **Why two AI providers?** Anthropic publishes no embeddings endpoint
> (`POST /v1/embeddings` returns 404), so chat and embeddings cannot come from
> the same service. Chat runs on Claude; embeddings run locally on this machine.

## Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 4.1.0, Java 21, Maven |
| AI (chat) | Spring AI 2.0.0 with Anthropic Claude — `claude-haiku-5-5` |
| AI (embeddings) | `all-MiniLM-L6-v2` running locally via ONNX Runtime (384 dims, free) |
| Database | PostgreSQL with pgvector |
| Auth | Spring Security OAuth2 (GitHub), session-based |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| UI | shadcn/ui on Base UI, TanStack Query |

## Quickstart

**Prerequisites:** Java 21 · Node.js 20+ · Docker (for the database) · a GitHub OAuth App · an Anthropic API key.

### 1. Start the database

```bash
docker compose up -d postgres
```

Starts Postgres with pgvector on port **5433** and enables the `vector`, `hstore` and `uuid-ossp` extensions via `docker/postgres/init-extensions.sql`. Using your own Postgres (e.g. Neon)? Run those three `CREATE EXTENSION` statements by hand.

### 2. Create a GitHub OAuth App

GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.

| Field | Local | Production (single-domain proxy) |
|---|---|---|
| Homepage URL | `http://localhost:3000` | `https://git-query-xi.vercel.app` |
| Callback URL | `http://localhost:8080/login/oauth2/code/github` | `https://git-query-xi.vercel.app/login/oauth2/code/github` |

One app serves both — OAuth Apps accept **up to 10 callback URLs**. Leave **Allow wildcard matching** disabled (GitHub warns it "can expose your app to security risks").

### 3. Configure the backend

```bash
cp .env.example .env   # then fill it in (never commit it)
```

Either export those variables or place them in `backend/src/main/resources/application.properties` (gitignored).

| Key | Default | Purpose |
|---|---|---|
| `app.frontend-url` | — | Where to redirect after OAuth success |
| `app.cors.allowed-origins` | — | Comma-separated origin allowlist |
| `app.token-encryptor-password` / `app.token-encryptor-salt` | — | Encrypts GitHub tokens at rest (`openssl rand -base64 32` / `openssl rand -hex 16`) |
| `app.indexing.max-file-bytes` | `102400` | Skip files larger than this |
| `app.indexing.chunk-size` | `800` | Chunk size before token conversion |
| `app.github.api-delay-ms` | `50` | Delay between GitHub API calls |
| `server.forward-headers-strategy` | — | Set to `framework` behind the Vercel proxy so OAuth `redirect_uri` matches the public URL |

Plus the standard Spring datasource, `spring.ai.anthropic.*`, `spring.ai.vectorstore.pgvector.*` and `spring.security.oauth2.client.registration.github.*` properties. Embeddings need no key — the ~90 MB ONNX model downloads on first run. Pin `spring.ai.embedding.transformer.cache.directory` to a stable path or every restart re-downloads it (~12 s of a ~44 s boot).

> The vector dimension is fixed when the table is created: `all-MiniLM-L6-v2` emits **384**. Switching models (e.g. `text-embedding-3-small`, 1536) means changing `spring.ai.vectorstore.pgvector.dimensions`, dropping `vector_store`, and re-indexing everything.

### 4. Run

```bash
# backend — http://localhost:8080
cd backend && ./mvnw spring-boot:run

# frontend — http://localhost:3000
cd client && npm install && npm run dev
```

The browser calls same-origin (`/api/...`) and Next.js rewrites proxy to the backend (see `client/next.config.ts`). Set `API_BACKEND_URL` (server-only) to override the proxy target; only set `NEXT_PUBLIC_API_BASE_URL` if you want direct cross-site calls.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/auth/login-url` | OAuth entry point |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | End the session |
| GET | `/api/repos` | List and sync repositories |
| GET | `/api/repos/{id}` | Repository detail |
| POST | `/api/repos/{id}/index` | Start indexing (202) |
| GET | `/api/repos/{id}/status` | Indexing progress |
| POST | `/api/chat/sessions` | Create a session |
| GET | `/api/chat/sessions` | List sessions for a repository |
| GET | `/api/chat/sessions/{id}` | Message history |
| POST | `/api/chat/sessions/{id}/messages` | Stream a reply (SSE) |

## Architecture notes

- **SSE over POST.** `EventSource` cannot send a request body, so the client parses SSE frames manually from a `fetch` `ReadableStream` (`client/lib/stream-chat.ts`).
- **Per-repository retrieval.** Every chunk is tagged with `repoId` metadata by `CodeChunker`; `CodeContextRetriever` filters the vector search on it.
- **Idempotent re-indexing.** Vectors for a repository are deleted by metadata filter before re-inserting.
- **Ownership scoping.** No entity is ever loaded by ID alone — every lookup is filtered on `userId`.
- **Single-domain proxy.** `client/next.config.ts` rewrites proxy `/api`, `/oauth2`, `/login/oauth2` and `/actuator/health` to `API_BACKEND_URL`. The backend must set `SERVER_FORWARD_HEADERS_STRATEGY=framework` so Spring builds the public `redirect_uri` from `X-Forwarded-*` headers.

## Deployment

| Piece | Service | Why |
|---|---|---|
| Database | [Neon](https://neon.com) | pgvector on every plan, no paid add-on |
| Backend | [Render](https://render.com) web service (Docker) | Needs a persistent process — background indexing dies on serverless |
| Frontend | [Vercel](https://vercel.com) | Native Next.js hosting |

Full guide in [`DEPLOYMENT.md`](DEPLOYMENT.md), blueprint in [`render.yaml`](render.yaml). Two things to know before going public:

1. **Protect your Anthropic key** — use a project-scoped key with a spend limit; anyone with the URL can spend it.
2. **Give the backend 1 GB+ RAM** — the ONNX model plus the JVM OOMs on 512 MB free tiers.

## Known limitations

- **Citations have no line numbers.** `CitationMapper` reads `startLine`/`endLine` from chunk metadata, but `CodeChunker` never writes those keys.
- **No conversation memory.** `ChatPromptBuilder` receives only the current question plus retrieved chunks.
- **`@Transactional` is ineffective on three `IndexingService` methods** (`updateProgress`, `markReady`, `markFailed` are `protected` and self-invoked, bypassing Spring's proxy).
- **No database indexes** on the columns used by every lookup (`session_id`, `user_id`, `repository_id`).
- **Test coverage is minimal** — one context-loads smoke test.
- **The GitHub rate limiter is a fixed delay**, not adaptive to rate-limit headers.

## License

MIT — see [LICENSE](LICENSE).
