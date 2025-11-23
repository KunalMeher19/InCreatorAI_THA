# pinecone_client.py
import os
import time

# Mock Pinecone if library not installed or API key missing
try:
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False
    print("⚠️ Pinecone library not found. Using Mock mode.")

class PineconeClient:
    def __init__(self):
        self.api_key = os.environ.get('PINECONE_API_KEY', 'mock-key')
        self.env = os.environ.get('PINECONE_ENV', 'us-east-1')
        self.index_name = "increator-prod"
        
        if PINECONE_AVAILABLE and self.api_key != 'mock-key':
            # Official v3+ Client Initialization
            self.pc = Pinecone(api_key=self.api_key)
            self.index = self.pc.Index(self.index_name)
        else:
            self.pc = None
            self.index = None
            print("⚠️ Pinecone initialized in MOCK mode.")

    def upsert_batch(self, vectors, namespace="prod"):
        """
        vectors: List of (id, embedding_list, metadata_dict)
        """
        if self.index:
            # Real Upsert
            self.index.upsert(vectors=vectors, namespace=namespace)
        else:
            # Mock Upsert
            print(f"[Mock] Upserting {len(vectors)} vectors to namespace '{namespace}'")
            # Simulate latency
            time.sleep(0.1)

    def query(self, vector, top_k=500, namespace="prod", filter=None):
        if self.index:
            return self.index.query(
                vector=vector, 
                top_k=top_k, 
                include_metadata=True, 
                namespace=namespace,
                filter=filter
            )
        else:
            # Mock Query Response
            print(f"[Mock] Querying top_{top_k} in namespace '{namespace}'")
            return {
                "matches": [
                    {"id": "c_mock_1", "score": 0.95, "metadata": {"handle": "@mock_1"}},
                    {"id": "c_mock_2", "score": 0.88, "metadata": {"handle": "@mock_2"}}
                ]
            }

    def create_index_if_not_exists(self):
        if self.pc:
            existing_indexes = [i.name for i in self.pc.list_indexes()]
            if self.index_name not in existing_indexes:
                print(f"Creating index {self.index_name}...")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=1536,
                    metric="cosine",
                    spec=ServerlessSpec(cloud='aws', region=self.env)
                )

if __name__ == "__main__":
    client = PineconeClient()
    # Test Mock Upsert
    client.upsert_batch([("id1", [0.1]*1536, {"type": "test"})])
    # Test Mock Query
    res = client.query([0.1]*1536, top_k=5)
    print("Query Result:", res)
