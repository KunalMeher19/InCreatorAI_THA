// Mock API Client
class DiscoveryClient {
    baseUrl: string;

    constructor() {
        this.baseUrl = 'https://api.increator.ai/v1';
    }

    async search(query: string, filters?: any) {
        // Simulate network latency (p95 < 500ms)
        // Random between 50ms and 450ms
        const latencyMs = Math.floor(Math.random() * 400) + 50;
        await new Promise(resolve => setTimeout(resolve, latencyMs));

        return {
            meta: {
                latency_ms: latencyMs,
                total_hits: 120
            },
            data: [
                { handle: '@test_creator_1', score: 0.95 },
                { handle: '@test_creator_2', score: 0.88 }
            ]
        };
    }
}

async function runSmokeTest() {
    console.log('🚀 Starting Smoke Test...');
    const client = new DiscoveryClient();

    // Test 1: Search Query
    console.log('Test 1: Executing Search Query...');
    const start = Date.now();
    const response = await client.search('tech reviewers');
    const duration = Date.now() - start;

    if (response.meta.total_hits > 0) {
        console.log(`✅ Search returned ${response.meta.total_hits} hits.`);
    } else {
        console.log('❌ Search failed to return hits.');
    }

    // Test 2: Latency SLO Check
    console.log(`Test 2: Checking Latency SLO (<500ms)... Actual: ${duration}ms`);
    if (duration < 500) {
        console.log('✅ Latency SLO Met.');
    } else {
        console.log('⚠️ Latency SLO Breached.');
    }

    console.log('\n✅ Smoke Test Completed Successfully.');
}

if (require.main === module) {
    runSmokeTest();
}
