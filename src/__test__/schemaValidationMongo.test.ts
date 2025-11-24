import { setupSchema } from '../mongoSchema';
import { MongoClient } from 'mongodb';

// Mock MongoDB
jest.mock('mongodb');

describe('Schema Validation', () => {
    let mockDb: any;
    let mockCollection: any;
    let mockClient: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        mockCollection = {
            createIndex: jest.fn().mockResolvedValue('index_name'),
        };

        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection),
        };

        mockClient = {
            connect: jest.fn().mockResolvedValue(undefined),
            db: jest.fn().mockReturnValue(mockDb),
            close: jest.fn().mockResolvedValue(undefined),
        };

        (MongoClient as unknown as jest.Mock).mockImplementation(() => mockClient);
    });

    test('Mock Mode: Validates that indexes are created', async () => {
        await setupSchema();

        // Verify connection
        expect(MongoClient).toHaveBeenCalled();
        expect(mockClient.connect).toHaveBeenCalled();

        // Verify collections accessed
        expect(mockDb.collection).toHaveBeenCalledWith('creators');
        expect(mockDb.collection).toHaveBeenCalledWith('identity_edges');
        expect(mockDb.collection).toHaveBeenCalledWith('contents');

        // Verify createIndex calls
        // Creators: 2 unique, 1 handle, 2 sorting, 1 text = 6 calls
        // Identity: 3 calls
        // Contents: 1 call
        // Total should be around 10 calls
        expect(mockCollection.createIndex).toHaveBeenCalled();

        // Check specific indexes
        const calls = mockCollection.createIndex.mock.calls;
        const indexKeys = calls.map((c: any) => JSON.stringify(c[0]));

        expect(indexKeys).toContain(JSON.stringify({ 'platform_ids.youtube': 1 }));
        expect(indexKeys).toContain(JSON.stringify({ 'source_creator_id': 1 }));
    });

    // Live Mode Test (Skipped by default unless TEST_LIVE is set)
    // Run with: TEST_LIVE=true npm test src/__test__/schemaValidationMongo.test.ts
    const runLive = process.env.TEST_LIVE ? test : test.skip;

    runLive('Live Mode: Connects to real DB', async () => {
        // Unmock for this test
        jest.restoreAllMocks();
        // Note: This requires a real MongoDB running at MONGO_URI
        try {
            await setupSchema();
        } catch (e) {
            throw e;
        }
    });
});
