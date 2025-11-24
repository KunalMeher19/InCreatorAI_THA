# InCreator AI - Scalable Influencer Discovery System Design

## 1. Executive Summary

This document outlines the architectural design for a scalable influencer discovery system capable of handling **250M+ creators** across Instagram, YouTube, TikTok, and X. The system is designed to provide low-latency search (<50ms), robust identity resolution across platforms, and AI-driven ranking using vector embeddings and LLM scoring.

- **efSearch**: `100` (Latency < 50ms).

## 2. Architecture Diagram

The high-level architecture is visualized in `architecture.mermaid`. It consists of the following core components:

1.  **Ingestion Layer**: Multi-platform scrapers/API clients pushing data to a message queue (BullMQ/Redis).
2.  **Processing Layer**: Workers for embedding generation (OpenAI), identity resolution, and data enrichment.
3.  **Storage Layer**:
    *   **MongoDB**: Primary store for creator profiles, metadata, and identity edges. Sharded by `creator_id`.
    *   **Pinecone**: Vector database for semantic search (embeddings).
    *   **Redis**: Caching (L1/L2) and rate-limiting state.
4.  **API Layer**: Node.js/Express REST API for search and retrieval.

### API Example & Caching

**Response Structure:**
```json
{
  "data": [
    {
      "id": "c_123",
      "handle": "@tech_guru",
      "relevance_score": 0.92,
      "why_ranked": ["Matches 'tech' in bio", "High engagement (5.2%)"],
      "cache_hit": true
    }
  ],
  "meta": { "latency": "45ms", "source": "cache" }
}
```

**Caching Strategy:**
- **L1 (Local)**: In-memory cache (1 min) for hot queries.
- **L2 (Redis)**: Distributed cache (1 hour) for search results.
- **Invalidation**: TTL-based. We accept slightly stale search results (up to 1 hour) for performance.

## 3. Design Details

### 3.1 Data Model and Partitioning

**MongoDB Schema Design:**
*   **`creators` Collection**: Stores profile data.
    *   **Partitioning**: Sharded by `_id` (hashed) to distribute write load evenly across shards.
    *   **Indexes**: Unique sparse indexes on `platform_ids.youtube`, `platform_ids.instagram` for idempotent lookups. Text indexes for keyword search.
*   **`identity_edges` Collection**: Stores probabilistic links between profiles.
    *   **Partitioning**: Sharded by `source_creator_id` to keep edges for a creator on the same shard.
*   **`contents` Collection**: Time-series data for posts/videos.
    *   **Partitioning**: Time-series collection or sharded by `creator_id`.

**Vector Store (Pinecone):**
*   **Namespace Strategy**: Separate namespaces for `prod`, `staging`, and `dev`.
*   **Metadata**: stored alongside vectors for pre-filtering (e.g., `category`, `follower_count`).

### 3.2 Ingestion Cadence, Scaling, and Retries

*   **Cadence**:
    *   **High-Priority (Top 1M)**: Updated daily.
    *   **Mid-Tail**: Updated weekly.
    *   **Long-Tail**: Updated monthly or on-demand (when viewed).
*   **Scaling**:
    *   Ingestion workers are stateless and can scale horizontally on ECS/K8s based on queue depth (BullMQ).
*   **Retries & Backfills**:
    *   **Exponential Backoff**: Implemented for API rate limits (429s).
    *   **Dead Letter Queues (DLQ)**: Failed jobs after N retries move to DLQ for manual inspection.
    *   **Backfills**: Triggered via a separate "backfill" queue with lower priority.

### 3.3 Identity Resolution

We employ a hybrid approach:
1.  **Deterministic**: Exact matches on verified handles (e.g., same handle on YT and Twitter) or cross-platform links (e.g., linktree URL).
2.  **Probabilistic**: A scoring system based on:
    *   Name similarity (Jaro-Winkler).
    *   Bio token overlap (Jaccard similarity).
    *   Avatar image hashing (pHash distance).
*   **Resolution Flow**: When a new profile is ingested, an async job queries existing profiles for potential matches. If `score > threshold`, an edge is created in `identity_edges`.

### 3.4 Retrieval and Ranking Flow

1.  **Search Request**: User queries "tech reviewers for AI".
2.  **L1 Cache Check**: Check in-memory/Redis cache.
3.  **Retrieval (Parallel)**:
    *   **Keyword Search**: MongoDB text search for exact keyword matches.
    *   **Semantic Search**: Convert query to vector (OpenAI) -> Pinecone ANN search.
4.  **Merge & Dedupe**: Combine results, removing duplicates based on Identity Graph.
5.  **Reranking (AI)**:
    *   Top K candidates are passed to an LLM (or lightweight scoring model) to evaluate relevance based on nuanced criteria (e.g., "Is this creator actually reviewing AI, or just using the hashtag?").
6.  **Response**: Return ranked list with `relevance_score`.

### 3.5 AI Integration

*   **Embeddings**: Generated using OpenAI's `text-embedding-3-small` (or similar) for bios, captions, and transcripts.
*   **LLM Scoring**: Used for the final reranking step and for extracting structured attributes (e.g., `brand_affinity`, `audience_demographics`) from unstructured bio text during ingestion.

### 3.6 Monitoring and Observability

*   **Metrics**: Prometheus/Grafana for:
    *   Ingestion rate (profiles/sec).
    *   Queue depth and latency.
    *   API latency (p95, p99).
    *   Pinecone query latency.
*   **Tracing**: OpenTelemetry for end-to-end request tracing.
*   **Alerting**: PagerDuty alerts for:
    *   Ingestion stoppages.
    *   High error rates (>1%).
    *   SLO breaches (Search > 500ms).

## 4. Security & Compliance

**Privacy & PII:**
- **Data Minimization**: We only store public data.
- **PII Handling**: Emails/Phones are **hashed** (SHA-256) unless explicitly consented by the creator for outreach.
- **Right to be Forgotten**: API endpoint `DELETE /creators/{id}` removes data from MongoDB and Pinecone within 30 days (GDPR compliance).

**Security:**
- **Encryption**: AES-256 at rest (Atlas/S3), TLS 1.3 in transit.
- **Access Control**: Role-Based Access Control (RBAC) for internal tools.
- **Multi-tenancy**: `tenant_id` enforced in every Mongo query.

## 5. Operational Excellence

### Cost Estimates (Monthly)
*Assumptions: 250M creators, 10M active updates/month.*

1.  **Storage (Mongo + S3)**:
    - MongoDB Atlas (Shared Cluster): ~$1,000+ (scales with IOPS/Storage).
    - S3 (20TB): ~$500
2.  **Vector DB (Pinecone)**:
    - **Pod Sizing**: Estimated 5x `p2` pods (performance) or 10x `s1` pods (storage) for 250M vectors.
    - **Cost**: ~$500 - $2,000 / month depending on replica count and pod type.
3.  **Compute (ECS/Lambda)**:
    - Scrapers (Spot Instances): ~$1,000.
4.  **AI APIs (OpenAI)**:
    - Embeddings (10M updates): ~$200 (cheap).
    - LLM Reranking: ~$500 (depends on traffic).
**Total Estimated**: ~$4,000 - $6,000 / month.
> *Note: Ballpark estimates as of Nov 23, 2025 — to be refined during detailed infra runbook and cost modeling step.*

### Operational Runbook
- **Ingestion Outage**:
    1. Check Provider Status (IG/YT API health).
    2. Rotate Proxy Pool (if 429 rate spikes).
    3. Pause Low-Priority Queues.
- **Pinecone Latency Spike**:
    1. Scale up replicas (add pods).
    2. Reduce `top_k` temporarily.
- **Disaster Recovery**:
    - Atlas Cloud Backups (Continuous).
    - Periodic export of Pinecone vectors to S3.

## 6. Trade-offs and Scaling Roadmap

### 6.1 Ship Now (MVP) vs. Post-PMF

| Feature | MVP (Now) | Post-PMF (Later) |
| :--- | :--- | :--- |
| **Search** | Hybrid (Mongo Text + Pinecone) | Fine-tuned Embeddings + Learning to Rank (LTR) |
| **Identity** | Deterministic + Simple Heuristics | Graph Neural Networks (GNN) for resolution |
| **Ingestion** | Polling / Cron-based | Real-time Webhooks / Firehose |
| **Infra** | Single Region (us-east-1) | Multi-Region Active-Active |

### 6.2 Simplicity vs. Cost Savings

*   **Choice**: We use **MongoDB Atlas** (managed) over self-hosted for simplicity, accepting higher cost for lower ops burden.
*   **Choice**: We use **Pinecone** (serverless) to avoid managing vector index shards manually.
*   **Cost Saving**: We use **Spot Instances** for ingestion workers since they are fault-tolerant.

### 6.3 12-Month Roadmap

1.  **Q1**: Launch MVP with 50M creators. Validate search quality.
2.  **Q2**: Scale to 250M. Implement sharding on MongoDB. Optimize Pinecone pod types.
3.  **Q3**: Deploy "Identity 2.0" with probabilistic graph resolution.
4.  **Q4**: Multi-region expansion (EU/APAC) for compliance and latency.

## 7. Technical Artifacts

This repository contains the following implemented artifacts:

1.  **MongoDB Schema**: `src/mongoSchema.ts` (Schema definition & indexing).
2.  **Pinecone Client**: `src/pineconeClient.ts` (Vector DB interaction).
3.  **Ranking Prototype**: `src/rankingPrototype.ts` (End-to-end retrieval & reranking flow).
4.  **Smoke Test**: `src/smokeTest.ts` (System verification).
5.  **Embedding Worker**: `src/embeddingWorker.ts` (Batch processing).
6.  **Identity Resolution**: `src/__test__/identityResolution.test.ts` (Logic verification).
