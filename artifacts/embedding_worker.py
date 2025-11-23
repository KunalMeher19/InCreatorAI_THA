import time
import os
from typing import List, Dict
from pinecone_client import PineconeClient

# Mock Embedding Function (Replace with OpenAI call)
def generate_embeddings(texts: List[str]) -> List[List[float]]:
    # Returns random vectors for demo
    import numpy as np
    return [np.random.rand(1536).tolist() for _ in texts]

class EmbeddingWorker:
    def __init__(self):
        self.pc_client = PineconeClient()
        self.batch_size = 10

    def process_job_batch(self, jobs: List[Dict]):
        """
        jobs: List of dicts with {'id': str, 'text': str, 'metadata': dict}
        """
        print(f"🚀 Processing batch of {len(jobs)} embedding jobs...")
        
        # 1. Generate Embeddings (Batch)
        texts = [j['text'] for j in jobs]
        embeddings = generate_embeddings(texts)
        
        # 2. Prepare Vectors for Pinecone
        vectors = []
        for job, vec in zip(jobs, embeddings):
            vectors.append((job['id'], vec, job['metadata']))
            
        # 3. Upsert to Pinecone
        self.pc_client.upsert_batch(vectors)
        
        # 4. (Mock) Update Mongo Status
        print(f"✅ Successfully upserted {len(vectors)} vectors. Updating Mongo status...")

if __name__ == "__main__":
    # Simulate a queue of jobs
    mock_jobs = [
        {"id": "c_101", "text": "@tech_daily Daily Tech News", "metadata": {"handle": "@tech_daily"}},
        {"id": "c_102", "text": "@art_studio Digital Art Tips", "metadata": {"handle": "@art_studio"}},
        {"id": "c_103", "text": "@fitness_pro Workout Routines", "metadata": {"handle": "@fitness_pro"}},
    ]
    
    worker = EmbeddingWorker()
    worker.process_job_batch(mock_jobs)
