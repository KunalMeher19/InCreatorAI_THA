import { PineconeClient } from './pineconeClient';

// Mock Embedding Function
function getEmbedding(text: string): number[] {
    // Returns a random normalized vector for demo purposes
    const vec = Array.from({ length: 1536 }, () => Math.random());
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return vec.map(val => val / norm);
}

interface Candidate {
    id: string;
    score: number;
    metadata?: {
        handle?: string;
        bio?: string;
        [key: string]: any;
    };
    final_score?: number;
}

// Reranking Logic (LLM based)
function llmRerank(query: string, candidates: Candidate[]): Candidate[] {
    console.log(`\n--- Reranking ${candidates.length} candidates for query: '${query}' ---`);

    const reranked = candidates.map(c => {
        const meta = c.metadata || {};
        const score = c.score || 0.0;

        // Mock logic: Boost score if "AI" is in bio
        const bio = (meta.bio || '').toString();
        const llmBoost = (bio.includes('AI') || bio.includes('Tech')) ? 0.1 : 0.0;
        const finalScore = score + llmBoost;

        return { ...c, final_score: finalScore };
    });

    return reranked.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
}

// Main Execution
if (require.main === module) {
    (async () => {
        // 1. Setup Pinecone Client
        const pcClient = new PineconeClient();

        // 2. Seed Data (Mock Upsert)
        const creators = [
            { id: 'c1', values: Array(1536).fill(0.1), metadata: { handle: '@tech_daily', bio: 'Daily Tech News and AI updates' } },
            { id: 'c2', values: Array(1536).fill(0.2), metadata: { handle: '@makeup_guru', bio: 'Best beauty tips and tutorials' } },
            { id: 'c3', values: Array(1536).fill(0.3), metadata: { handle: '@code_wizard', bio: 'Python, Rust, and building AI agents' } },
        ];

        console.log('Indexing creators to Pinecone...');
        // Convert to Pinecone format
        const vectors = creators.map(c => ({ id: c.id, values: c.values, metadata: c.metadata }));
        await pcClient.upsertBatch(vectors);

        // 3. Search Query
        const query = 'developers building artificial intelligence';
        console.log(`\nQuery: ${query}`);

        // 4. Retrieval (Pinecone Query)
        // Mock query vector
        const queryVec = Array(1536).fill(0.1);
        const response = await pcClient.query(queryVec, 3);
        const candidates = (response.matches || []) as Candidate[];

        console.log('\nTop Candidates (Pinecone):');
        candidates.forEach(c => {
            console.log(`- ${c.metadata?.handle}: ${c.score.toFixed(4)}`);
        });

        // 5. Reranking
        const finalResults = llmRerank(query, candidates);

        console.log('\nFinal Reranked Results:');
        finalResults.forEach(c => {
            console.log(`- ${c.metadata?.handle}: ${(c.final_score || 0).toFixed(4)}`);
        });
    })();
}
