# Financial Terminal

A professional financial terminal desktop application for individual traders, providing real-time stock quotes, interactive candlestick charts, and news aggregation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | [Tauri](https://tauri.app) v1 |
| Frontend | React 18 + TypeScript + Vite |
| UI | Ant Design 5 + Tailwind CSS |
| Charts | ECharts 5 (candlestick + volume) |
| State | Zustand |
| Backend | Go 1.22 (REST + WebSocket) |
| Cache | Redis 7 |
| Database | TimescaleDB (PostgreSQL 15) |
| Market Data | [Finnhub](https://finnhub.io) API |

## MVP Features

- **Real-time quotes** — price, change %, high/low for top symbols
- **Interactive candlestick chart** — multiple resolutions (1m → 1W) with volume
- **News panel** — market-wide and per-symbol news from Finnhub
- **Watchlist** — add/remove symbols; real-time price updates via WebSocket

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 20
- [Rust](https://rustup.rs) stable (for Tauri)
- [Go](https://go.dev) ≥ 1.22
- [Docker](https://www.docker.com) + Docker Compose

### 1. Clone & configure

```bash
git clone https://github.com/AustinYI111/Financial-Terminal.git
cd Financial-Terminal
cp .env.example .env
# Edit .env and set your FINNHUB_API_KEY
# Get a free key at https://finnhub.io/register
```

### 2. Start infrastructure

```bash
docker-compose up -d timescaledb redis
```

### 3. Start the backend

```bash
cd backend
go mod download
go run ./cmd/server
# Server starts on :8080, WebSocket on /ws
```

### 4. Start the frontend (dev mode)

```bash
cd frontend
npm install
npm run tauri dev   # opens the Tauri desktop window
# OR for browser-only dev:
npm run dev         # http://localhost:1420
```

## Project Structure

```
Financial-Terminal/
├── .env.example              # Environment variable template
├── docker-compose.yml        # Local dev infrastructure
├── .github/
│   └── workflows/
│       ├── ci.yml            # Lint + test on every push/PR
│       └── build.yml         # Multi-platform binary release
├── backend/
│   ├── cmd/server/main.go    # Entry point
│   ├── internal/
│   │   ├── api/              # HTTP handlers & router
│   │   ├── finnhub/          # Finnhub REST client
│   │   ├── cache/            # Redis cache layer
│   │   ├── repository/       # TimescaleDB queries
│   │   ├── websocket/        # WS hub & client management
│   │   ├── middleware/        # Logger & CORS
│   │   └── models/           # Shared domain types
│   ├── db/migrations/        # TimescaleDB schema
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── pages/Dashboard.tsx
    │   ├── components/
    │   │   ├── StockQuote/   # Real-time quote card
    │   │   ├── ChartView/    # ECharts candlestick
    │   │   ├── NewsPanel/    # News article list
    │   │   ├── Watchlist/    # Symbol watchlist
    │   │   └── Layout/       # App shell
    │   ├── services/
    │   │   ├── finnhub.ts    # REST API client
    │   │   └── websocket.ts  # WS client (auto-reconnect)
    │   ├── store/            # Zustand global state
    │   └── types/            # Shared TypeScript interfaces
    └── src-tauri/            # Tauri Rust shell
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/stocks` | List all tracked stocks |
| GET | `/api/v1/quote/:symbol` | Real-time quote (15s cache) |
| GET | `/api/v1/candles/:symbol?resolution=D` | OHLCV candles (5m cache) |
| GET | `/api/v1/news?category=general` | Market news (10m cache) |
| GET | `/api/v1/news/:symbol` | Company news |
| GET | `/api/v1/watchlist` | Get watchlist |
| POST | `/api/v1/watchlist` | Add to watchlist |
| DELETE | `/api/v1/watchlist/:symbol` | Remove from watchlist |
| WS | `/ws` | Real-time price stream |

## CI/CD

- **`ci.yml`** — runs on every push/PR: Go vet + tests, TypeScript type-check + ESLint
- **`build.yml`** — runs on version tags (`v*`): builds Tauri desktop binaries for macOS, Windows, Linux, and Go backend binaries for all platforms