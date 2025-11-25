# InCreator AI - Scalable Influencer Discovery System

This repository contains the architectural design and technical artifacts for a scalable influencer discovery system targeting 250M+ creators.

## 📂 Project Structure

```
InCreator_Assignment/
├── DESIGN.md               # Comprehensive Architecture & Design Document
├── architecture.mermaid    # Visual Architecture Diagram ([View Online](https://www.mermaidchart.com/d/cddfbab3-d920-4986-9226-1d6036245ebd))
├── package.json            # Node.js Project Configuration
├── tsconfig.json           # TypeScript Configuration
├── src/
│   ├── mongoSchema.ts      # MongoDB Schema Definitions & Validation
│   ├── pineconeClient.ts   # Pinecone Vector DB Client Wrapper
│   ├── rankingPrototype.ts # Prototype (Vector Search + LLM Rerank)
│   ├── schemaValidationMongo.test.ts # Automated MongoDB Schema Validator
│   ├── smokeTest.ts        # End-to-End Smoke Test Script
│   ├── embeddingWorker.ts  # Mock Embedding Generation Worker
│   └── identityResolution.test.ts # Identity Graph Resolution Tests
└── artifacts/
    ├── api_spec.yaml       # OpenAPI 3.0 Specification
    └── identity_graph_example.json # Sample Identity Graph Data
```

## 🚀 How to Run Verification

We have included automated scripts to validate the design artifacts.

### Prerequisites
- Node.js (LTS) v18+
- `npm`

### Run Modes
The scripts support two modes:
1.  **Mock Mode (Default)**: Uses internal mocks for Mongo/Pinecone. No credentials required. Ideal for CI and local logic verification.
2.  **Live Mode**: Connects to real infrastructure. Requires environment variables.

### Running Locally (Mock Mode)

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Automated Tests**
    Runs identity resolution unit tests and schema validation (mock).
    ```bash
    npm test
    ```

3.  **Run Smoke Test (Simulated API)**
    ```bash
    npx ts-node src/smokeTest.ts
    ```

4.  **Run Embedding Worker (Mock Pipeline)**
    ```bash
    npx ts-node src/embeddingWorker.ts
    ```

5.  **Run Ranking Prototype**
    ```bash
    npx ts-node src/rankingPrototype.ts
    ```

## 🌍 Environment Variables (Optional for Live Mode)
To run against real infrastructure, set these variables:
```bash
export MONGO_URI="mongodb+srv://..."
export PINECONE_API_KEY="pc_..."
export PINECONE_ENV="us-east-1"
# export OPENAI_API_KEY="sk-..." # Optional, for real embeddings
```

### Running Integration Tests (Live)
To run the schema validation and smoke tests against real endpoints:

```bash
# Validate Real Mongo Indexes
TEST_LIVE=true npm test src/__test__/schemaValidationMongo.test.ts

# Run Smoke Test against Live API (requires API_URL env var if not mocking)
# Note: The current smoke test script mocks the client internally. 
# To test live, you would need to modify src/smokeTest.ts to use a real HTTP client.
npx ts-node src/smokeTest.ts
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
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci

      - name: Run Unit Tests (Identity & Schema)
        run: npm test
        
      - name: Run Smoke Test
        run: npx ts-node src/smokeTest.ts
        
      - name: Verify Embedding Pipeline
        run: npx ts-node src/embeddingWorker.ts
        
      - name: Verify Prototype Logic
        run: npx ts-node src/rankingPrototype.ts
```
