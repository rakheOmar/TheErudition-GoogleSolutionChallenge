# PS3 Pharma Smart Supply Chain SRS (MVP + Extensible Architecture)

## 1. Purpose

Build a non-gimmicky, decision-support system for Problem Statement 3 (Smart Supply Chains) focused on pharma logistics.

The system must detect disruption risk early and recommend compliant operational actions, not only display risk scores.

## 2. Scope (Approved)

### 2.1 Domain Scope

- Load type: pharma (single primary load profile for MVP, extensible to more).
- Primary user persona: dispatcher.
- Secondary persona: control tower manager (monitoring/reporting only in MVP).

### 2.2 Geography Scope

- Architecture supports pan-India.
- MVP demo corridors:
  - Mumbai <-> Pune
  - Ahmedabad <-> Mumbai
  - Delhi <-> Lucknow
  - Hyderabad <-> Bengaluru
  - Chennai <-> Hyderabad

### 2.3 Disruption Scope (MVP)

- Traffic congestion
- Weather alerts
- Vehicle breakdown / telematics anomaly
- Facility delay (hub/warehouse)
- Regulatory/checkpoint delay

Additional disruption types are plug-in extensions via adapter interface.

## 3. Problem Statement Mapping

PS3 objective requires:

- Continuous analysis of transit data
- Preemptive disruption detection
- Dynamic route-action recommendation before cascading delays

This system addresses objective through:

- scenario ingestion
- feasibility filtering
- multi-objective ranking
- actionable recommendation with explainability

## 4. Product Goals

1. Detect risk before ETA breach.
2. Recommend safe/compliant action with expected impact.
3. Preserve pharma constraints as hard rules.
4. Keep architecture modular for new load classes and signals.

## 5. Non-Goals (MVP)

- National-scale live crawling from every public and private source.
- Fully autonomous dispatch execution without human review.
- Full legal/commercial contract automation.
- Deep multimodal orchestration beyond road-first decisions.

## 6. Core Design Principles

- Config-over-code policy management.
- Hard constraints before optimization.
- Explainable recommendation artifacts.
- Versioned rules and reproducible outcomes.
- Human-in-the-loop override and auditability.

## 7. System Model

### 7.1 Conceptual Components

- BaseGraph: nodes, edges, carriers, capacities.
- LoadProfile: temperature, max transit, handling restrictions, risk weights.
- PolicyLayer: owner-defined constraints and preferences.
- ScenarioContext: active disruptions and severities.
- FeasiblePathGenerator: path set that passes hard constraints.
- Optimizer: ranking by weighted objective.
- RecommendationEngine: action, confidence, rationale.

### 7.2 Policy Owner Model

- Network/Admin: graph topology and infrastructure metadata.
- Operations: preferred lanes and operational constraints.
- Compliance/Safety: forbidden routes/carriers/regions.
- Customer SLA: time/cost priority and penalties.

## 8. Functional Requirements

### FR-1 Shipment Intake

- Create shipment with source, destination, load profile, and SLA target ETA.

### FR-2 Policy Management

- Create/update/list policy layers and enforce by priority.

### FR-3 Scenario Event Ingestion

- Add disruption events with type, severity, and geographic/logical scope.

### FR-4 Feasible Path Generation

- Generate candidate paths from base graph.
- Remove paths violating hard constraints (temperature support, transit limits, policy blocks).

### FR-5 Optimization

- Score feasible paths using weighted multi-objective function.
- Persist score breakdown for explainability.

### FR-6 Recommendation Output

- Return action class:
  - continue_with_watch
  - reroute
  - hold_and_escalate
  - no_compliant_path
- Include reason codes, confidence, and expected impact delta.

### FR-7 Dispatcher View

- Show active shipments, disruption summary, risk levels.
- Show recommendation and rationale per shipment.

### FR-8 Recompute Trigger

- On scenario/policy changes, allow recommendation recompute for impacted shipments.

## 9. Non-Functional Requirements

- NFR-1 Explainability: every recommendation includes reason codes and score breakdown.
- NFR-2 Safety: do not recommend non-compliant paths.
- NFR-3 Reliability: deterministic output for same inputs.
- NFR-4 Extensibility: add new disruption types without changing core scoring logic.
- NFR-5 Usability: dispatcher can understand and act within 30 seconds.

## 10. Data Model (MVP)

- Node(id, name, state, lat, lng, type)
- Edge(id, from_node, to_node, mode, carrier, distance_km, base_eta_h, base_cost, cold_chain_capable)
- LoadProfile(id, label, min_temp_c, max_temp_c, max_transit_h, weights)
- PolicyLayer(id, owner_type, rule_type, applies_to, params, priority, enabled)
- ScenarioEvent(id, event_type, severity, target_type, target_values, eta_multiplier, risk_delta, active)
- Shipment(id, corridor_id, source_node, destination_node, load_profile, sla_eta_h, status)
- PathOption(path, eta_h, cost, risk, score, reason_codes)
- Recommendation(shipment_id, action, confidence, chosen_path, reason_codes, expected_impact)

## 11. Decision Logic

1. Generate path candidates from graph.
2. Enforce hard constraints and policy blocks.
3. Apply disruption impacts to each path.
4. Compute objective score:

`score = w_eta*eta_risk + w_cost*cost + w_sla*sla_penalty + w_risk*risk`

5. Select best path and map to action class using thresholds.

## 12. API Contract (MVP)

- `GET /supply-chain/overview`
- `GET /supply-chain/corridors`
- `GET /supply-chain/load-profiles`
- `GET /supply-chain/policies`
- `POST /supply-chain/policies`
- `PATCH /supply-chain/policies/{policy_id}`
- `GET /supply-chain/disruptions`
- `POST /supply-chain/disruptions`
- `GET /supply-chain/shipments`
- `POST /supply-chain/shipments`
- `GET /supply-chain/shipments/{shipment_id}`
- `POST /supply-chain/shipments/{shipment_id}/recompute`
- `POST /supply-chain/hero-scenario/seed`
- `GET /supply-chain/audit?limit=20`

## 13. UX Requirements (Dispatcher)

- Prioritized shipment queue with risk badges.
- One-click recommendation refresh.
- Structured recommendation card with:
  - action,
  - confidence,
  - expected ETA/cost/risk delta,
  - reason codes.

## 14. Extensibility Plan

- Add load classes by adding `LoadProfile` and policy templates.
- Add disruptions by adding adapter + event mapping (`eta_multiplier`, `risk_delta`).
- Add external providers (maps/weather/telematics) behind adapter interfaces.
- Add model-based risk prediction later without replacing current rules engine.

## 15. Minimal Google Usage Plan

Use Google services only where they materially improve outcomes:

- Optional now: Google Maps Routes API adapter for ETA enrichment.
- Optional deployment: Cloud Run for quick hosting.

Do not over-couple core logic to cloud-specific APIs.

## 16. MVP Acceptance Criteria

MVP is accepted if:

- shipment can be created for any approved corridor,
- disruptions alter recommendation behavior,
- non-compliant paths are rejected,
- system returns actionable recommendation with explainability,
- dispatcher UI supports end-to-end demo flow.

## 17. Risk Register

- Over-scope risk: pan-India real-time claims without real feeds.
- Mitigation: corridor-based demo with architecture-level pan-India design.
- Data quality risk from synthetic events.
- Mitigation: explicit confidence and limitations in outputs.

## 18. Demo Narrative

1. Create pharma shipment on approved corridor.
2. Inject disruption event.
3. Observe recommendation shift (continue -> reroute or hold).
4. Show reason codes and impact delta.
5. Show policy change causing different feasible set.
