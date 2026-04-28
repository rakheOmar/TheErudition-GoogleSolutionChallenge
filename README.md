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

<img width="1276" height="655" alt="image" src="https://github.com/user-attachments/assets/95b4a6a1-2956-4b8b-b19e-0bd0ef56bb67" />


### Data flow example

- Disruption created -> backend recomputes affected shipments -> recommendations update -> event published to RabbitMQ -> frontend refreshes and shows new risk/actions.

## Logistics Domain Model

The core logistics model lives in `server/app/models/supply_chain.py` and is designed to map real-world supply chain operations into typed entities.

| Model | Purpose in logistics system | Key fields used |
|---|---|---|
| `Node` | Physical points in the network (city/hub/warehouse) | `id`, `name`, `state`, `lat`, `lng`, `type` |
| `Edge` | Transport links between nodes | `from_node`, `to_node`, `carrier`, `distance_km`, `base_eta_h`, `base_cost`, `cold_chain_capable` |
| `Corridor` | Business route lane between source and destination | `id`, `name`, `source_node`, `destination_node` |
| `LoadProfile` | Shipment class and SLA constraints by goods type | `label`, `min_temp_c`, `max_temp_c`, `max_transit_h`, `weights` |
| `PolicyLayer` | Governance rules that constrain route selection | `owner_type`, `rule_type`, `applies_to`, `priority`, `enabled` |
| `ScenarioEvent` | Disruption signal affecting network performance | `event_type`, `severity`, `target_type`, `target_values`, `eta_multiplier`, `risk_delta`, `active` |
| `Shipment` | Shipment execution unit moving on a corridor | `corridor_id`, `load_profile_id`, `sla_eta_h`, `status` |
| `PathOption` | Candidate route with scored trade-offs | `path_nodes`, `path_edges`, `eta_h`, `cost`, `risk`, `compliance_risk`, `score` |
| `Recommendation` | Decision output for a shipment | `action`, `confidence`, `chosen_path`, `alternatives`, `reason_codes`, `expected_impact` |
| `ShipmentWithRecommendation` | API response composition for operations UI | `shipment`, `recommendation` |
| `AuditEntry` | Immutable operational trace for explainability | `entity_type`, `entity_id`, `action`, `details`, `timestamp_utc` |
| `HeroScenarioResult` | Seed/demo scenario summary payload | `shipments_seeded`, `disruptions_seeded`, `policies_seeded`, `notes` |
| `OverviewResponse` | Top-line dashboard counters | `active_shipments`, `active_disruptions`, `policies_enabled`, `corridors_supported` |

### Goods / shipment types used (`LoadProfile`)

| Load profile | Operational meaning | Typical constraints |
|---|---|---|
| `cold_chain` | Temperature-sensitive pharma/perishables | tighter temperature band + moderate SLA |
| `frozen` | Deep cold items | strict low-temp range + strict SLA |
| `express` | Fast-turnaround priority cargo | strong ETA weight, lower delay tolerance |
| `fragile` | Break-sensitive items | safer route weighting, medium SLA |
| `heavy` | High mass freight | higher cost and lane constraints |
| `standard` | General non-special cargo | balanced ETA/cost/risk weighting |

## Why RabbitMQ Here

RabbitMQ decouples critical state changes from immediate request-response flow:

- Better scalability for future background workers
- Cleaner integration point for alerts, dashboards, and notifications
- Reliable fan-out for analytics pipelines
- Safer path to real-time/event-driven architecture beyond page polling

In this project, event publishing is already wired; consumer expansion is the next scale step.

## Firebase Usage

- **Auth**: login, signup, and session state.
- **Firestore mirrors user operations**:
  - `users/{uid}/shipments/*`
  - `users/{uid}/disruptions/*`
  - `users/{uid}/policies/*`

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

## Tech Stack

- Frontend: React, Vite, Tailwind-style utility classes
- Backend: FastAPI, Python
- Data: SQLite (primary state), Firestore (user-level mirrored ops records)
- Messaging: RabbitMQ
- AI: Gemini API
- Maps/Geo: Google Maps APIs

## Google Technology Stack

| Google product | How it is used in this project |
|---|---|
| Google AI Studio | Prompt prototyping and rapid iteration for Gemini-powered explanations/copilot behaviors |
| Gemini API | Natural-language explanations, copilot reasoning outputs |
| Vertex AI | Production upgrade path for managed model serving, evaluation, and MLOps governance |
| Google Maps Platform | Map rendering and geospatial visualization for corridors/nodes |
| Firebase Authentication | User auth, identity, and session management |
| Cloud Firestore | Mirrored per-user ops records for shipments/disruptions/policies |
