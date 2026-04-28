# PS1 Strategy Notes (Origin of Media on Social Platforms)

This file captures what we discussed for Problem Statement 1, including course corrections.

## Core Clarifications We Agreed On

- Metadata by itself is not enough to establish origin in real-world social media flows.
- As a third-party verifier, we usually cannot depend on adding our own watermark to media.
- Therefore, provenance metadata can help, but treating it as a complete solution is a gimmick.
- The product should output an auditable confidence judgment, not claim guaranteed absolute origin for every image.

## PS1 Objective Mapping (Beyond Verification)

The official PS1 objective is not only to verify authenticity. It also requires a full protection loop:
- Identify unauthorized use of official sports media.
- Track where and how assets propagate across platforms.
- Flag misappropriation and anomalies in near real-time.
- Enable proactive authentication of official assets.

So verification is one module, not the complete product.

## What "Original" Means in This Project

Use explicit evidence tiers:

- Verified Original:
  - Valid signed provenance (for example C2PA/Content Credentials),
  - Trusted signer identity,
  - No earlier conflicting high-trust record.

- Probable Original:
  - No usable signed provenance,
  - Earliest high-trust appearance,
  - Strong near-duplicate evidence that later copies derive from it.

- Derivative / Not Original:
  - Strong match to an earlier item with reliable timestamp evidence.

- Unknown:
  - Evidence is weak, conflicting, or insufficient.

## Watermark-Free Attribution Architecture (Third-Party Verifier)

### 1) Ingestion

- Inputs: image upload, image URL, optional social post URL.
- Normalize image (resize strategy, color normalization, orientation fixes) before analysis.

### 2) Provenance Verification (When Present)

- Detect embedded provenance manifests.
- Verify signature, manifest integrity, cert chain, and timestamp signals.
- Extract claim-level data (asserted author, creation action, software agent, ingredient history).

### 3) Fingerprint and Similarity Search

- Compute robust fingerprints (for example pHash/PDQ + embedding-based features).
- Retrieve top-k nearest candidates from indexed corpus.
- Handle common transformations: compression, crop, resize, format conversion, minor edits.

### 4) Earliest-Seen and Source Trust Evidence

- Maintain first-seen index from trusted publishers, verified institutional handles, and reputable domains.
- Build propagation trail where possible (earliest seen -> repost chain).
- Score source trust (verification status, domain reputation, historical reliability).

### 5) Decision Engine

- Combine signals into an explainable score, such as:

`OriginScore = w1*earliness + w2*similarity + w3*sourceTrust + w4*provenanceValidity - w5*tamperSignals`

- Convert score + rule checks into verdicts:
  - `verified_original`
  - `probable_original`
  - `derivative`
  - `unknown`

### 6) Explainable Output

- Return verdict, confidence, and full evidence trail:
  - matched candidates,
  - timestamps,
  - trust factors,
  - provenance validation results,
  - tamper indicators.

## Why Metadata Alone Fails (Important for Pitch and Judges)

- Many platforms strip metadata on upload/re-encode.
- Reposts/screenshots lose provenance context.
- Not all originals are published with signed credentials.
- Manipulations can preserve some metadata while altering pixels.

Conclusion: provenance metadata is a high-value signal, but only one layer.

## What Must Be Built Beyond Core Matching

- End-to-end intake and verification workflow (not just a model/demo script).
- Clear report UI with verdict + confidence + evidence details.
- Side-by-side comparison against top candidate origins.
- Basic tamper flags (metadata stripped, suspicious edit patterns, inconsistency checks).
- Dataset + benchmark harness for measurable performance.

## Post-Verification Workflow (Critical for PS1)

After deciding whether content is original/derivative, the system still needs operational actions.

### 1) Ownership Registry

- Register official assets from rights holders (teams, leagues, broadcasters).
- Store ownership metadata: owner, license scope, allowed channels, embargo windows, territory rules.

### 2) Unauthorized Use Detection

- Continuously scan indexed/public sources for matches against registered official assets.
- Classify usage:
  - authorized,
  - unauthorized repost,
  - edited misuse,
  - impersonation/synthetic misuse,
  - uncertain (needs review).

### 3) Propagation Tracking

- Build propagation graph per asset (first seen -> repost chain -> major amplifiers).
- Track velocity metrics (spread rate, platform crossover, engagement spikes).

### 4) Anomaly Detection

- Flag unusual patterns in near real-time:
  - sudden spike in unauthorized reposts,
  - coordinated multi-account posting,
  - geography/language shift inconsistent with expected fan traffic,
  - rapid edits of a sensitive media asset.

### 5) Case Management and Human Review

- Create incident cases automatically for high-risk flags.
- Provide reviewer console with evidence bundle and decision controls.
- Reviewer outcomes: confirm violation, dismiss false positive, escalate legal/comms.

### 6) Response and Enforcement Support

- Generate platform-ready takedown/report packets (asset proof + match evidence + first-seen timeline).
- Trigger alerts to rights team (email/Slack/webhook) based on severity.
- Maintain immutable audit log of every detection, review, and action.

### 7) Reporting for Organizations

- Executive dashboard: violations prevented, time-to-detection, time-to-action, highest-risk platforms.
- Asset-level report: where media traveled, who reposted, what was actioned.

## Recommended PS1 End-to-End Pipeline

1. Asset onboarding (official source registration)
2. Crawl/ingest public media
3. Verify provenance when available
4. Perform similarity matching and source inference
5. Decide authorization status (authorized vs unauthorized)
6. Detect propagation anomalies
7. Open incidents, alert teams, and generate enforcement packets
8. Track outcomes and update trust/risk scores

## Metrics to Track for PS1 Demo

- Top-1 source match accuracy.
- Precision/recall for original vs derivative classification.
- Coverage split: percentage of `verified/probable/unknown` outcomes.
- Median and p95 verification latency.

## MVP Scope (Phase 1, Finals-Oriented)

Build:

- Upload/URL input.
- Official asset registry (small but real).
- Provenance verifier.
- Fingerprint nearest-neighbor retrieval.
- Earliest-seen + trust-weighted ranking.
- Unauthorized-use classifier (basic rules).
- Incident queue with priority levels.
- Simple propagation timeline (not full graph engine).
- Alerting (email/webhook) + downloadable evidence report.
- Explainable verdict report.

Defer:

- Full social-network crawler at internet scale.
- Heavy multi-modal forensic suite.
- Enterprise policy engine.
- Automated legal dispatch integrations per platform.

## Submission Positioning

- Frame as: "Evidence-backed origin likelihood and provenance verification for social media images."
- Explicitly state limitation: cannot guarantee origin for every image.
- Emphasize strength: transparent, auditable, confidence-based decisions for real moderation/fact-checking workflows.

## Corrections Captured from Discussion

- Correction 1: "Metadata alone is enough" is incorrect in social media conditions.
- Correction 2: Third-party systems cannot assume watermark insertion.
- Correction 3: Product language should avoid absolute claims and use confidence + evidence tiers.
