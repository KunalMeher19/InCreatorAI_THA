# InCreator AI - Scalable Influencer Discovery System

This repository contains the architectural design and technical artifacts for a scalable influencer discovery system targeting 250M+ creators.

## 📂 Project Structure

```
InCreator_Assignment/
├── DESIGN.md               # Comprehensive Architecture & Design Document
├── architecture.mermaid    # Visual Architecture Diagram
└── artifacts/
    ├── mongo_schema.py     # MongoDB Schema Definitions & Validation
    ├── pinecone_client.py  # Pinecone Vector DB Client Wrapper
    ├── api_spec.yaml       # OpenAPI 3.0 Specification
    ├── ranking_prototype.py# Python Prototype (Vector Search + LLM Rerank)
    ├── schema_validation_mongo.py # Automated MongoDB Schema Validator
    ├── smoke_test.py       # End-to-End Smoke Test Script
    ├── embedding_worker.py # Mock Embedding Generation Worker
    ├── identity_resolution_test.py # Identity Graph Resolution Tests
    └── identity_graph_example.json # Sample Identity Graph Data
```

## 🚀 How to Run Verification

We have included automated scripts to validate the design artifacts.

### Prerequisites
- Python 3.8+
- `numpy`
- `pinecone>=3.0.0` (Tested with v3.1.0)
- `pymongo`

### Run Modes
The scripts support two modes:
1.  **Mock Mode (Default)**: Uses internal mocks for Mongo/Pinecone. No credentials required. Ideal for CI and local logic verification.
2.  **Live Mode**: Connects to real infrastructure. Requires environment variables.

### Running Locally (Mock Mode)
```bash
cd artifacts

# 1. Validate MongoDB Schema
python schema_validation_mongo.py

# 2. Run Smoke Test (Simulated API)
python smoke_test.py

# 3. Run Embedding Worker (Mock Pipeline)
python embedding_worker.py

# 4. Run Ranking Prototype
python ranking_prototype.py

# 5. Run Identity Resolution Tests
python identity_resolution_test.py
```

## 🌍 Environment Variables (Optional for Live Mode)
To run against real infrastructure, set these variables:
```bash
export MONGO_URI="mongodb+srv://..."
export PINECONE_API_KEY="pc_..."
export PINECONE_ENV="us-east-1"
export OPENAI_API_KEY="sk-..." # Optional, for real embeddings
```

### Running Integration Tests (Live)
To run the schema validation and smoke tests against real endpoints:
```bash
# Validate Real Mongo Indexes
python schema_validation_mongo.py --live

# Run Smoke Test against Live API (requires API_URL env var if not mocking)
python smoke_test.py --live
```

## ⚙️ CI/CD Integration

This project is designed with automation in mind. Below is a sample **GitHub Actions** workflow to run these checks on every Pull Request.

```yaml
# .github/workflows/ci.yml
name: Design Verification CI

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
          
      - name: Install Dependencies
        run: pip install numpy pinecone pymongo

      - name: Validate Schemas (Mock)
        run: python artifacts/schema_validation_mongo.py
        
      - name: Run Smoke Test
        run: python artifacts/smoke_test.py
        
      - name: Verify Embedding Pipeline
        run: python artifacts/embedding_worker.py
        
      - name: Verify Prototype Logic
        run: python artifacts/ranking_prototype.py
```
