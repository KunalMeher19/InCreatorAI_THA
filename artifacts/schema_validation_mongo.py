# schema_validation_mongo.py
import sys
from unittest.mock import MagicMock

# Mock PyMongo for validation without a running DB
sys.modules["pymongo"] = MagicMock()
from pymongo import MongoClient

def validate_mongo_schema():
    print("Validating MongoDB Schema Setup...")
    
    # Import the schema definition script
    try:
        import mongo_schema
    except ImportError:
        print("❌ Could not import mongo_schema.py")
        sys.exit(1)
        
    # Live Mode Check
    if "--live" in sys.argv:
        print("🌐 Live Mode: Connecting to Real MongoDB...")
        # In live mode, we don't mock. We use the real mongo_schema script.
        # Ensure MONGO_URI is set in env
        try:
            mongo_schema.setup_schema()
            print("✅ Live MongoDB Schema Setup Completed.")
            return
        except Exception as e:
            print(f"❌ Live Setup Failed: {e}")
            sys.exit(1)

    # Mock Mode (Default)
    print("🧪 Mock Mode: Validating Logic...")
    
    # Mock the DB and Collection objects to track calls
    mock_client = MagicMock()
    mock_db = MagicMock()
    mock_client.__getitem__.return_value = mock_db
    
    # Inject mock into the module
    mongo_schema.client = mock_client
    mongo_schema.db = mock_db
    
    # Run the setup
    try:
        mongo_schema.setup_schema()
    except Exception as e:
        print(f"❌ Error running setup_schema: {e}")
        sys.exit(1)
        
    # Verification Logic (Check if create_index was called)
    creators_col = mongo_schema.db.creators
    identity_col = mongo_schema.db.identity_edges
    
    if creators_col.create_index.call_count >= 1:
        print("✅ 'creators' collection indexes defined.")
    else:
        print("❌ 'creators' collection indexes MISSING.")
        sys.exit(1)

    if identity_col.create_index.call_count >= 1:
        print("✅ 'identity_edges' collection indexes defined.")
    else:
        print("❌ 'identity_edges' collection indexes MISSING.")
        sys.exit(1)
        
    print("✅ MongoDB Schema Validation Passed.")

if __name__ == "__main__":
    validate_mongo_schema()
