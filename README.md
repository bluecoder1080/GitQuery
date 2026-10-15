# GitQuery

Ask questions about a GitHub repository in natural language and get answers grounded in the actual source code, with citations that link back to the file on GitHub.

Sign in with GitHub, pick a repository, let it index, then chat. Retrieval is scoped per repository, so answers never mix code from different projects.

## How it works

1. **Sign in** — GitHub OAuth2. The access token is encrypted before it is persisted.
2. **Sync** — repositories are pulled from the GitHub API and cached in the local database.
3. **Index** — the recursive git tree is filtered, each file is split into chunks, and the chunks are embedded into Postgres via pgvector. This runs asynchronously so the HTTP request returns immediately, with progress written back to the database for the client to poll.
4. **Ask** — the question is embedded, the most similar chunks *for that repository* are retrieved, and the answer is streamed token by token with citations.

## Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 4.1.0, Java 21, Maven |
| AI (chat) | Spring AI 2.0.0 with Anthropic Claude — `claude-haiku-5-5` |
| AI (embeddings) | `all-MiniLM-L6-v2` running locally via ONNX Runtime |
| Database | PostgreSQL with pgvector |
| Auth | Spring Security OAuth2 (GitHub), session-based |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| UI | shadcn/ui on Base UI, TanStack Query |

> **Why two AI providers?** Anthropic publishes no embeddings endpoint
> (`POST /v1/embeddings` returns 404), so chat and embeddings cannot come from
> the same service. Chat runs on Claude; embeddings run locally on this machine,
> which also means indexing costs nothing and needs no second API key.

## Prerequisites

- Java 21
- Node.js 20+
- Docker (for the database), or your own PostgreSQL with pgvector
- A GitHub OAuth App
- An Anthropic API key

## Setup

### 1. Start the database

```bash
docker compose up -d postgres
```

This starts Postgres with pgvector on port **5433** and enables the `vector`, `hstore` and `uuid-ossp` extensions via `docker/postgres/init-extensions.sql`.

### 2. Create a GitHub OAuth App

In GitHub → Settings → Developer settings → OAuth Apps, create a new OAuth App with the authorization callback URL:

```
http://localhost:8080/login/oauth2/code/github
```

GitHub OAuth Apps accept a single callback URL, so you need a second app (or an edited URL) for production.

### 3. Configure the backend

Copy `.env.example` and fill it in, then either export those variables or place them in `backend/src/main/resources/application.properties`. Note that `application.properties` is gitignored — keep secrets out of version control.

Required by code (see the `@Value` annotations across `config/` and `services/`):

| Key | Default | Purpose |
|---|---|---|
| `app.frontend-url` | — | Where to redirect after OAuth success |
| `app.cors.allowed-origins` | — | Comma-separated origin allowlist |
| `app.token-encryptor-password` | — | Encrypts GitHub tokens at rest |
| `app.token-encryptor-salt` | — | Salt for the above |
| `app.indexing.max-file-bytes` | `102400` | Skip files larger than this |
| `app.indexing.chunk-size` | `800` | Chunk size before token conversion |
| `app.github.api-delay-ms` | `50` | Delay between GitHub API calls |

You will also need the standard Spring datasource, `spring.ai.anthropic.*`, `spring.ai.vectorstore.pgvector.*` and `spring.security.oauth2.client.registration.github.*` properties. Embeddings need no key at all — the ONNX model is fetched on first run.

Set `spring.ai.embedding.transformer.cache.directory` to a stable path. Spring AI
otherwise caches into a freshly created OS temp directory on every run, so the
~90 MB model is re-downloaded on each restart — measured, that accounts for
about 12 seconds of a ~44 second boot. On a container platform the path lives in
the ephemeral container filesystem, so a cold start re-downloads regardless
unless it is on a mounted volume.

The vector dimension must match the embedding model, and pgvector fixes it when
the table is created. `all-MiniLM-L6-v2` emits **384**; switching to a hosted
embedding model such as `text-embedding-3-small` (1536) means changing
`spring.ai.vectorstore.pgvector.dimensions`, dropping the `vector_store` table,
and re-indexing every repository.

### 4. Run

```bash
# backend — http://localhost:8080
cd backend && ./mvnw spring-boot:run

# frontend — http://localhost:3000
cd client && npm install && npm run dev
```

The client reads `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8080`).

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

**SSE over POST.** `EventSource` cannot send a request body, so the client parses SSE frames manually from a `fetch` `ReadableStream` (`client/lib/stream-chat.ts`). The server emits named events: `user_message`, `token`, `assistant_message`, `done`.

**Per-repository retrieval.** Every chunk is tagged with `repoId` metadata by `CodeChunker`, and `CodeContextRetriever` filters the vector search on it. Isolation happens in the database query, not in application code.

**Idempotent re-indexing.** Vectors for a repository are deleted by metadata filter before re-inserting, so re-indexing does not duplicate data.

**Ownership scoping.** No entity is ever loaded by ID alone — every lookup goes through a repository method filtered on `userId`.

## Known limitations

- **Citations have no line numbers.** `CitationMapper` reads `startLine`/`endLine` from chunk metadata, but `CodeChunker` never writes those keys, so both are always null and the `#L` anchor logic in `citationHref` is inert.
- **No conversation memory.** `ChatPromptBuilder` receives only the current question and retrieved chunks, so follow-up questions have no prior context.
- **`@Transactional` is ineffective on three `IndexingService` methods.** `updateProgress`, `markReady` and `markFailed` are `protected` and self-invoked, so Spring's proxy is bypassed.
- **No database indexes** on the columns used by every lookup (`session_id`, `user_id`, `repository_id`).
- **Test coverage is minimal** — one context-loads smoke test.
- **The GitHub rate limiter is a fixed delay**, not adaptive; it does not read rate-limit headers and cannot back off.

## License

MIT — see [LICENSE](LICENSE).
