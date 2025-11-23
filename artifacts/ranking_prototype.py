import numpy as np
from typing import List, Dict, Any
import json

# Mock Embedding Function (In reality, this calls OpenAI/Cohere)
def get_embedding(text: str) -> np.ndarray:
    # Returns a random normalized vector for demo purposes
    vec = np.random.rand(1536)
    return vec / np.linalg.norm(vec)

from pinecone_client import PineconeClient

# Reranking Logic (LLM based)
def llm_rerank(query: str, candidates: List[Dict]) -> List[Dict]:
    """
    Simulates sending top candidates to an LLM for relevance scoring.
    """
    print(f"\n--- Reranking {len(candidates)} candidates for query: '{query}' ---")
    
    reranked = []
    for c in candidates:
        # Extract metadata from Pinecone format
        meta = c.get('metadata', {})
        score = c.get('score', 0.0)
        
        # Mock logic: Boost score if "AI" is in bio
        bio = meta.get('bio', '')
        llm_boost = 0.1 if "AI" in bio or "Tech" in bio else 0.0
        final_score = score + llm_boost
        
        c['final_score'] = final_score
        reranked.append(c)
    
    return sorted(reranked, key=lambda x: x['final_score'], reverse=True)

# Main Execution
if __name__ == "__main__":
    # 1. Setup Pinecone Client
    pc_client = PineconeClient()
    
    # 2. Seed Data (Mock Upsert)
    creators = [
        {"id": "c1", "values": [0.1]*1536, "metadata": {"handle": "@tech_daily", "bio": "Daily Tech News and AI updates"}},
        {"id": "c2", "values": [0.2]*1536, "metadata": {"handle": "@makeup_guru", "bio": "Best beauty tips and tutorials"}},
        {"id": "c3", "values": [0.3]*1536, "metadata": {"handle": "@code_wizard", "bio": "Python, Rust, and building AI agents"}},
    ]
    
    print("Indexing creators to Pinecone...")
    # Convert to Pinecone format: (id, vec, meta)
    vectors = [(c['id'], c['values'], c['metadata']) for c in creators]
    pc_client.upsert_batch(vectors)

    # 3. Search Query
    query = "developers building artificial intelligence"
    print(f"\nQuery: {query}")
    
    # 4. Retrieval (Pinecone Query)
    # Mock query vector
    query_vec = [0.1] * 1536 
    response = pc_client.query(query_vec, top_k=3)
    candidates = response['matches']
    
    print("\nTop Candidates (Pinecone):")
    for c in candidates:
        print(f"- {c['metadata']['handle']}: {c['score']:.4f}")

    # 5. Reranking
    final_results = llm_rerank(query, candidates)
    
    print("\nFinal Reranked Results:")
    for c in final_results:
        print(f"- {c['metadata']['handle']}: {c['final_score']:.4f}")
