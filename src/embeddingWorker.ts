import { PineconeClient } from './pineconeClient';

// Mock Embedding Function (Replace with OpenAI call)
function generateEmbeddings(texts: string[]): number[][] {
    // Returns random vectors for demo
    return texts.map(() => Array.from({ length: 1536 }, () => Math.random()));
}

interface Job {
    id: string;
    text: string;
    metadata: {
        handle: string;
        [key: string]: any;
    };
}

export class EmbeddingWorker {
    private pcClient: PineconeClient;
    private batchSize: number;

    constructor() {
        this.pcClient = new PineconeClient();
        this.batchSize = 10;
    }

    async processJobBatch(jobs: Job[]) {
        console.log(`🚀 Processing batch of ${jobs.length} embedding jobs...`);

        // 1. Generate Embeddings (Batch)
        const texts = jobs.map(j => j.text);
        const embeddings = generateEmbeddings(texts);

        // 2. Prepare Vectors for Pinecone
        const vectors = jobs.map((job, index) => ({
            id: job.id,
            values: embeddings[index],
            metadata: job.metadata
        }));

        // 3. Upsert to Pinecone
        await this.pcClient.upsertBatch(vectors);

        // 4. (Mock) Update Mongo Status
        console.log(`✅ Successfully upserted ${vectors.length} vectors. Updating Mongo status...`);
    }
}

if (require.main === module) {
    (async () => {
        // Simulate a queue of jobs
        const mockJobs: Job[] = [
            { id: 'c_101', text: '@tech_daily Daily Tech News', metadata: { handle: '@tech_daily' } },
            { id: 'c_102', text: '@art_studio Digital Art Tips', metadata: { handle: '@art_studio' } },
            { id: 'c_103', text: '@fitness_pro Workout Routines', metadata: { handle: '@fitness_pro' } },
        ];

        const worker = new EmbeddingWorker();
        await worker.processJobBatch(mockJobs);
    })();
}
