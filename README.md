# The Erudition - Smart Supply Chain Control Tower

An AI-powered logistics control tower built for **Google Solution Challenge – Problem 3 (Smart Supply Chains)**.

The platform continuously monitors shipment risk, detects disruptions early, recommends or auto-executes reroutes, and helps operations teams prevent cascading delays.

## What It Does

- Real-time logistics dashboard for shipments, disruptions, network, policies, and audit.
- Dynamic recommendation engine per shipment (`continue_with_watch`, `reroute`, `hold_and_escalate`, `no_compliant_path`).
- Preemptive risk analytics:
  - Predictive corridor risk radar
  - 2h / 6h / 12h proactive risk forecast
  - KPI tracking (at-risk shipments, SLA gap, reroute load, auto-actions)
- Auto-disruption ingestion from weather signals.
- Multi-signal disruption model (weather + rush-hour congestion + ops events).
- AI Ops tools:
  - Natural-language recommendation explanations
  - Copilot queries (top risk, next actions, reroute rationale)
  - AI policy suggestions + approval flow
  - What-if simulation (`+30%` disruption stress test)
  - Incident timeline and AI summary
- One-click **Hero Demo** flow for finals-ready storytelling.
- Firebase auth + Firestore mirroring of user operations data.

## Architecture

### High-level

1. **Frontend (React + Vite)**
   - Pages: Home, Overview, Network, Shipments, Disruptions, Policies, Audit
   - Polling-based refresh (2-minute interval)
   - Calls backend REST APIs via `client/src/lib/supply-chain-api.js`
   - Firebase Auth for sign-in / sign-up
   - Firestore mirrors create/update actions for shipments, disruptions, policies

2. **Backend (FastAPI, Python)**
   - Core logic in `server/app/services/supply_chain_service.py`
   - API routes in `server/app/routes/supply_chain.py`
   - Local persistence with SQLite (`server/supply_chain.db` via `server/app/db.py`)
   - Weather enrichment and disruption generation
   - Recommendation scoring + policy constraint evaluation

3. **Event Bus (RabbitMQ)**
   - Event publisher: `server/app/events/event_bus.py`
   - Publishes domain events such as shipment/disruption updates
   - Enables event-driven extensibility (workers, notifications, downstream analytics)

4. **AI Layer (Gemini integration)**
   - AI service in `server/app/services/gemini_service.py`
   - Explanation endpoint: `/supply-chain/explain/{shipment_id}`
   - Additional AI-driven operational endpoints in supply chain routes

### Data flow example

- Disruption created -> backend recomputes affected shipments -> recommendations update -> event published to RabbitMQ -> frontend refreshes and shows new risk/actions.

## Key Backend Endpoints

### Core

- `GET /supply-chain/overview`
- `GET /supply-chain/shipments`
- `POST /supply-chain/shipments`
- `POST /supply-chain/shipments/{shipment_id}/recompute`
- `GET /supply-chain/disruptions`
- `POST /supply-chain/disruptions`
- `PATCH /supply-chain/disruptions/{disruption_id}`
- `GET /supply-chain/policies`
- `POST /supply-chain/policies`
- `PATCH /supply-chain/policies/{policy_id}`

### AI / Risk / Optimization

- `GET /supply-chain/risks/predictive`
- `GET /supply-chain/risks/forecast`
- `GET /supply-chain/analytics/kpis`
- `POST /supply-chain/recommendations/auto-execute`
- `GET /supply-chain/policies/ai-suggestions`
- `POST /supply-chain/policies/ai-approve`
- `POST /supply-chain/simulate/disruption-worsen`
- `POST /supply-chain/copilot/chat`
- `GET /supply-chain/incidents/{disruption_id}/timeline`
- `GET /supply-chain/explain/{shipment_id}`

### Demo / Ops

- `POST /supply-chain/disruptions/auto-from-weather`
- `POST /supply-chain/demo/hero`

## Why RabbitMQ Here

RabbitMQ decouples critical state changes from immediate request-response flow:

- Better scalability for future background workers
- Cleaner integration point for alerts, dashboards, and notifications
- Reliable fan-out for analytics pipelines
- Safer path to real-time/event-driven architecture beyond page polling

In this project, event publishing is already wired; consumer expansion is the next scale step.

## Firebase Usage

- **Auth**: login/signup/session state.
- **Firestore**: mirrored user-level operational writes:
  - `users/{uid}/shipments/*`
  - `users/{uid}/disruptions/*`
  - `users/{uid}/policies/*`

Note: system-of-record for core simulation state remains backend SQLite.

## Project Structure

```text
client/
  src/
    pages/
    components/
    lib/
server/
  app/
    routes/
    services/
    events/
    utils/
    db.py
  supply_chain.db
docs/
```

## Local Setup

### Prerequisites

- Node.js + npm
- Python 3.11+
- `uv` (Python package/runtime manager)
- Docker (for RabbitMQ container)

### 1) Start RabbitMQ

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Management UI: `http://localhost:15672` (guest / guest)

### 2) Configure backend env (`server/.env`)

Required keys:

- `GOOGLE_MAPS_API_KEY`
- `GEMINI_API_KEY`
- `RABBITMQ_URL=amqp://guest:guest@localhost:5672/`

### 3) Run backend

```bash
cd server
uv run uvicorn app.server:app --reload --port 8000
```

### 4) Configure frontend env (`client/.env`)

- `VITE_BACKEND_URL=http://localhost:8000`
- Firebase keys (`VITE_FIREBASE_*`)

### 5) Run frontend

```bash
cd client
npm install
npm run dev
```

## Hero Demo Script (1-click)

1. Open **Overview**.
2. Click **Run Hero Demo**.
3. Show generated disruptions and risk radar.
4. Use **Auto-execute High Confidence** and explain impact via KPI cards.
5. Ask Copilot: `show top 5 at-risk shipments`.
6. Open Disruptions -> Timeline to narrate incident handling.

## Current Status vs Problem 3 Objective

Implemented strongly:

- Continuous transit analysis
- Early disruption detection/flagging
- Dynamic recommendation and policy-constrained rerouting
- Cascading risk visibility and operational tooling

Still future-enhancement territory:

- Full production-grade streaming UI (WebSocket/SSE everywhere)
- Large-scale load testing benchmarks
- Long-horizon ML model trained on real historical logistics data

## Tech Stack

- Frontend: React, Vite, Tailwind-style utility classes
- Backend: FastAPI, Python
- Data: SQLite (primary state), Firestore (user-level mirrored ops records)
- Messaging: RabbitMQ
- AI: Gemini API
- Maps/Geo: Google Maps APIs
