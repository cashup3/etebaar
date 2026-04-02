# Eteebaar — custodial spot exchange (monorepo)

| Part | Role |
|------|------|
| `apps/web` | Next.js UI — markets + trade (REST + WebSocket book) |
| `apps/api` | Node (Fastify): double-entry **ledger**, deposits/withdrawals, **orders** (locks + idempotency), fill → ledger worker, **WebSocket** bridge on Redis |
| `services/matching-go` | Go matcher: **append-only `MatchLog`**, in-memory limit book, **replay on startup**, Postgres fills + order updates, **Redis** `book:{symbol}` + `user:{id}` |
| `services/price-worker` | Python reference ticker (dev only) |

Read **[COMPLIANCE.md](./COMPLIANCE.md)** before handling real funds.

## Prerequisites

- Node.js 20+
- Go 1.22+ (`go mod tidy` in `services/matching-go`)
- Python 3.11+ (optional worker)
- Docker (Postgres + Redis)

## Database

```bash
docker compose up -d
cd apps\api
npx prisma migrate deploy
npm run db:seed
```

Set `DATABASE_URL` / `REDIS_URL` (see [.env.example](./.env.example)). The Go matcher uses the **same** `DATABASE_URL` and `REDIS_URL`.

## Run (dev)

```bash
cd c:\Users\pouya\eteebaar
npm install
```

**Terminal 1 — API** (loads `DATABASE_URL`, `REDIS_URL` from env):

```bash
cd apps\api
set DATABASE_URL=postgresql://eteebaar:eteebaar@127.0.0.1:5432/eteebaar
set REDIS_URL=redis://127.0.0.1:6379
npm run dev
```

**Terminal 2 — matcher (Go)**:

```bash
cd services\matching-go
set DATABASE_URL=postgresql://eteebaar:eteebaar@127.0.0.1:5432/eteebaar
set REDIS_URL=redis://127.0.0.1:6379
go run .\cmd\matching\main.go
```

**Terminal 3 — web**:

```bash
npm run dev:web
```

- UI: [http://localhost:3000](http://localhost:3000/trade)
- API: `http://127.0.0.1:4000` — Next rewrites `/api/*` to the API (see `apps/web/next.config.ts`).
- WebSocket: `ws://127.0.0.1:4000/ws?symbol=BTCUSDT&userId=<uuid>` (or set `NEXT_PUBLIC_WS_URL` for the trade page).

## Deploy to Vercel (public URL for friends)

1. Push this repo to GitHub (for example `cashup3/etebaar`).
2. Open [vercel.com/new](https://vercel.com/new), sign in, then **Import** that repository.
3. Set **Root Directory** to `apps/web` (required — the repo root is not the Next app).
4. Deploy. Vercel reads `apps/web/vercel.json` so install runs from the monorepo root (`npm ci`) and build uses `npm run build -w web`.
5. Share the `https://<project>.vercel.app` link. **Every push** to the connected branch triggers a new deployment.

**Optional env vars** (only if you host the Fastify API elsewhere): `API_ORIGIN` (HTTPS base URL) and `NEXT_PUBLIC_WS_URL` (`wss://...`). Without them, pages that use Next’s own routes (e.g. market prices) still work; live order book / placing orders need the API + CORS for your Vercel domain.

**CLI** (after `npx vercel login` on your machine): from `apps/web`, run `npm run vercel:prod`.

## Main HTTP endpoints (API)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/users` | Create user + default accounts |
| `GET` | `/balances` | Header `X-User-Id` |
| `POST` | `/deposits` | Pending deposit |
| `POST` | `/deposits/:id/confirm` | Header `X-Internal-Secret` — credits user vs system **POOL** |
| `POST` | `/withdrawals` | USDT 24h sum limit; moves to system **ESCROW** |
| `POST` | `/orders` | Headers `X-User-Id`, optional `Idempotency-Key`; locks **AVAILABLE → LOCKED** |
| `POST` | `/orders/:id/cancel` | Releases remaining **LOCKED** using stored reserves |
| `GET` | `/markets/:symbol/book` | Latest Redis snapshot from matcher |
| `GET` | `/ws` | WebSocket (upgrade) — subscribes to `book:{symbol}` and `user:{userId}` |

## Architecture (data flow)

1. **Order placed** → Prisma txn: idempotent `ORDER_LOCK` ledger + `Order` row (`OPEN`, `quoteReserved` / `baseReserved`).
2. **Matcher** ingests `ingestedAt IS NULL`, appends `MatchLog` `ORDER_ADD`, matches price-time, writes `Fill` + `MatchLog` `TRADE`, updates reserves.
3. **API timer** runs `processUnappliedFills` → posts **FILL** ledger (taker fee in `FEE_BPS`) and marks `Fill.ledgerApplied`.
4. **WebSocket** clients subscribe via ioredis to channels the matcher publishes.

## Python worker

```bash
cd services\price-worker
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Git

Initialize git **only inside this project folder**:

```bash
cd c:\Users\pouya\eteebaar
git init
```
