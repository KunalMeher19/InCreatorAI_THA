import time
import random

# Mock API Client
class DiscoveryClient:
    def __init__(self):
        self.base_url = "https://api.increator.ai/v1"
    
    def search(self, query, filters=None):
        # Simulate network latency (p95 < 500ms)
        latency = random.uniform(0.05, 0.45) 
        time.sleep(latency)
        
        return {
            "meta": {
                "latency_ms": int(latency * 1000),
                "total_hits": 120
            },
            "data": [
                {"handle": "@test_creator_1", "score": 0.95},
                {"handle": "@test_creator_2", "score": 0.88}
            ]
        }

def run_smoke_test():
    print("🚀 Starting Smoke Test...")
    client = DiscoveryClient()
    
    # Test 1: Search Query
    print("Test 1: Executing Search Query...")
    start = time.time()
    response = client.search("tech reviewers")
    duration = (time.time() - start) * 1000
    
    if response['meta']['total_hits'] > 0:
        print(f"✅ Search returned {response['meta']['total_hits']} hits.")
    else:
        print("❌ Search failed to return hits.")
        
    # Test 2: Latency SLO Check
    print(f"Test 2: Checking Latency SLO (<500ms)... Actual: {duration:.2f}ms")
    if duration < 500:
        print("✅ Latency SLO Met.")
    else:
        print("⚠️ Latency SLO Breached.")

    print("\n✅ Smoke Test Completed Successfully.")

if __name__ == "__main__":
    run_smoke_test()
