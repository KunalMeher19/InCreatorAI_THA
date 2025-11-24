import { Pinecone, Index, RecordMetadata } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config();

export class PineconeClient {
    private pc: Pinecone | null = null;
    private index: Index | null = null;
    private indexName: string = 'increator-prod';
    private env: string;
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.PINECONE_API_KEY || 'mock-key';
        this.env = process.env.PINECONE_ENV || 'us-east-1';

        if (this.apiKey !== 'mock-key') {
            try {
                this.pc = new Pinecone({ apiKey: this.apiKey });
                this.index = this.pc.index(this.indexName);
            } catch (error) {
                console.warn('⚠️ Error initializing Pinecone client, falling back to mock mode:', error);
                this.pc = null;
                this.index = null;
            }
        } else {
            console.log('⚠️ Pinecone initialized in MOCK mode.');
        }
    }

    async upsertBatch(vectors: { id: string; values: number[]; metadata?: RecordMetadata }[], namespace = 'prod') {
        if (this.index) {
            // Real Upsert
            await this.index.namespace(namespace).upsert(vectors);
        } else {
            // Mock Upsert
            console.log(`[Mock] Upserting ${vectors.length} vectors to namespace '${namespace}'`);
            // Simulate latency
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    async query(vector: number[], topK = 500, namespace = 'prod', filter?: object) {
        if (this.index) {
            return await this.index.namespace(namespace).query({
                vector,
                topK,
                includeMetadata: true,
                filter: filter as any
            });
        } else {
            // Mock Query Response
            console.log(`[Mock] Querying top_${topK} in namespace '${namespace}'`);
            return {
                matches: [
                    { id: 'c_mock_1', score: 0.95, metadata: { handle: '@mock_1' } },
                    { id: 'c_mock_2', score: 0.88, metadata: { handle: '@mock_2' } }
                ]
            };
        }
    }

    async createIndexIfNotExists() {
        if (this.pc) {
            try {
                const existingIndexes = await this.pc.listIndexes();
                const indexExists = existingIndexes.indexes?.some(i => i.name === this.indexName);

                if (!indexExists) {
                    console.log(`Creating index ${this.indexName}...`);
                    await this.pc.createIndex({
                        name: this.indexName,
                        dimension: 1536,
                        metric: 'cosine',
                        spec: {
                            serverless: {
                                cloud: 'aws',
                                region: this.env
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Error checking/creating index:', error);
            }
        }
    }
}

// Test execution if run directly
if (require.main === module) {
    (async () => {
        const client = new PineconeClient();
        // Test Mock Upsert
        await client.upsertBatch([{ id: 'id1', values: Array(1536).fill(0.1), metadata: { type: 'test' } }]);
        // Test Mock Query
        const res = await client.query(Array(1536).fill(0.1), 5);
        console.log('Query Result:', JSON.stringify(res, null, 2));
    })();
}
