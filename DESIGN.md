# InCreator AI - Scalable Influencer Discovery System Design

## Executive Summary

This document outlines the architecture for a scalable influencer discovery system capable of handling **250M+ creators** across Instagram, YouTube, TikTok, and X.

- **efSearch**: `100` (Latency < 50ms).

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

---

## 6. Security & Compliance

**Privacy & PII:**
- **Data Minimization**: We only store public data.
- **PII Handling**: Emails/Phones are **hashed** (SHA-256) unless explicitly consented by the creator for outreach.
- **Right to be Forgotten**: API endpoint `DELETE /creators/{id}` removes data from MongoDB and Pinecone within 30 days (GDPR compliance).

**Security:**
- **Encryption**: AES-256 at rest (Atlas/S3), TLS 1.3 in transit.
- **Access Control**: Role-Based Access Control (RBAC) for internal tools.
- **Multi-tenancy**: `tenant_id` enforced in every Mongo query.

---

## 7. Operational Excellence

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

---

## 8. Trade-offs & Roadmap

### Ship Now (MVP)
- **Single Region**: `us-east-1`.
- **Simple Search**: Keyword (Mongo) + Vector (Pinecone).
- **Manual Identity**: Only deterministic links.
- **Infra**: ECS Fargate + MongoDB Atlas + Pinecone Standard.

### Next 12 Months (Scaling)
- **Multi-Region**: Replicate Mongo and Pinecone to `eu-central-1`.
- **Advanced AI**: Fine-tuned embedding model.
- **Real-time**: Change Streams for instant embedding updates.
- **Automated Identity**: deploy the probabilistic matching pipeline.
