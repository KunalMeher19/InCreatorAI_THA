import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'increator';

export async function setupSchema() {
    console.log('Setting up MongoDB Schema...');

    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        const db: Db = client.db(DB_NAME);

        // 1. Creators Collection
        const creators = db.collection('creators');

        // Indexes for Lookup
        await creators.createIndex({ 'platform_ids.youtube': 1 }, { unique: true, sparse: true });
        await creators.createIndex({ 'platform_ids.instagram': 1 }, { unique: true, sparse: true });

        // NOTE: Ingestion workers must perform idempotent upserts to prevent unique index conflicts.
        await creators.createIndex({ 'handles.youtube': 1 });

        // Indexes for Filtering/Sorting
        await creators.createIndex({ 'categories': 1, 'followers.youtube': -1 });
        await creators.createIndex({ 'last_seen': -1 });

        // Text Index for Keyword Search
        await creators.createIndex(
            { 'display_name': 'text', 'bios.youtube': 'text' },
            { name: 'text_search' }
        );

        console.log('✅ Creators collection indexes created.');

        // 2. Identity Edges Collection
        const identity = db.collection('identity_edges');
        await identity.createIndex({ 'source_creator_id': 1 });
        await identity.createIndex({ 'target_creator_id': 1 });
        await identity.createIndex({ 'confidence_score': -1 });

        console.log('✅ Identity Edges collection indexes created.');

        // 3. Contents Collection (Time-Series)
        const contents = db.collection('contents');
        await contents.createIndex({ 'creator_id': 1, 'posted_at': -1 });
        // TTL Index (commented out in original, keeping it commented)
        // await contents.createIndex({ 'posted_at': 1 }, { expireAfterSeconds: 31536000 });

        console.log('✅ Contents collection indexes created.');

        // Sharding Command Hints
        console.log('\n--- Sharding Instructions (Run in Mongos) ---');
        console.log('sh.enableSharding("increator")');
        console.log('sh.shardCollection("increator.creators", {"_id": "hashed"})');
        console.log('sh.shardCollection("increator.identity_edges", {"source_creator_id": "hashed"})');

    } catch (error) {
        console.error('❌ Error setting up schema:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    setupSchema();
}
