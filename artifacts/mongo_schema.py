# mongo_schema.py
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
import os

# Connect to MongoDB (Mock or Real via Env)
mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(mongo_uri)
db = client['increator']

def setup_schema():
    print("Setting up MongoDB Schema...")
    
    # 1. Creators Collection
    creators = db.creators
    # Indexes for Lookup
    creators.create_index([("platform_ids.youtube", ASCENDING)], unique=True, sparse=True)
    creators.create_index([("platform_ids.instagram", ASCENDING)], unique=True, sparse=True)
    # NOTE: Ingestion workers must perform idempotent upserts (e.g., updateOne with upsert=True)
    # to prevent unique index conflicts on platform IDs.
    creators.create_index([("handles.youtube", ASCENDING)])
    
    # Indexes for Filtering/Sorting
    creators.create_index([("categories", ASCENDING), ("followers.youtube", DESCENDING)])
    creators.create_index([("last_seen", DESCENDING)])
    
    # Text Index for Keyword Search
    creators.create_index([("display_name", TEXT), ("bios.youtube", TEXT)], name="text_search")
    
    print("✅ Creators collection indexes created.")

    # 2. Identity Edges Collection
    identity = db.identity_edges
    identity.create_index([("source_creator_id", ASCENDING)])
    identity.create_index([("target_creator_id", ASCENDING)])
    identity.create_index([("confidence_score", DESCENDING)])
    
    print("✅ Identity Edges collection indexes created.")

    # 3. Contents Collection (Time-Series)
    contents = db.contents
    contents.create_index([("creator_id", ASCENDING), ("posted_at", DESCENDING)])
    # TTL Index for auto-expiry (optional, if archiving logic is separate)
    # contents.create_index("posted_at", expireAfterSeconds=31536000) # 1 year
    
    print("✅ Contents collection indexes created.")

    # Sharding Command Hints (Run in Mongos Shell)
    print("\n--- Sharding Instructions (Run in Mongos) ---")
    print('sh.enableSharding("increator")')
    print('sh.shardCollection("increator.creators", {"_id": "hashed"})')
    print('sh.shardCollection("increator.identity_edges", {"source_creator_id": "hashed"})')

if __name__ == "__main__":
    setup_schema()
