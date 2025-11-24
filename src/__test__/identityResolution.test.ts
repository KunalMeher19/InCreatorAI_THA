// Mock Identity Resolution Logic
class IdentityResolver {
    resolve(source: any, target: any) {
        // 1. Deterministic Match (Exact Handle + Verified)
        if (
            source.handle && target.handle &&
            source.handle === target.handle &&
            source.verified && target.verified
        ) {
            return {
                match: true,
                type: 'deterministic',
                score: 1.0,
                reason: 'verified_handle_match'
            };
        }

        // 2. Probabilistic Match (Fuzzy)
        let score = 0.0;

        // Bio Jaccard Similarity (Mock)
        const sourceTokens = new Set((source.bio || '').toLowerCase().split(/\s+/).filter((t: string) => t));
        const targetTokens = new Set((target.bio || '').toLowerCase().split(/\s+/).filter((t: string) => t));

        if (sourceTokens.size > 0 && targetTokens.size > 0) {
            const intersection = new Set([...sourceTokens].filter(x => targetTokens.has(x)));
            const union = new Set([...sourceTokens, ...targetTokens]);
            score += (intersection.size / union.size) * 0.8; // Weight 0.8
        }

        // Name match
        if (source.name && target.name && source.name === target.name) {
            score += 0.2;
        }

        if (score > 0.85) {
            return {
                match: true,
                type: 'probabilistic',
                score: Number(score.toFixed(2)),
                reason: 'high_confidence_signals'
            };
        } else if (score > 0.5) {
            return {
                match: false, // Suggestion only
                type: 'suggestion',
                score: Number(score.toFixed(2)),
                reason: 'needs_review'
            };
        }

        return { match: false, score: 0.0 };
    }
}

describe('Identity Resolution', () => {
    let resolver: IdentityResolver;

    beforeEach(() => {
        resolver = new IdentityResolver();
    });

    test('deterministic match', () => {
        const p1 = { handle: '@tech_guru', verified: true, platform: 'youtube' };
        const p2 = { handle: '@tech_guru', verified: true, platform: 'twitter' };

        const result = resolver.resolve(p1, p2);
        expect(result.match).toBe(true);
        expect(result.type).toBe('deterministic');
        expect(result.score).toBe(1.0);
    });

    test('probabilistic match', () => {
        const p1 = { name: 'Tech Guru', bio: 'reviews gadgets and ai' };
        const p2 = { name: 'Tech Guru', bio: 'gadgets ai and reviews' };

        const result = resolver.resolve(p1, p2);
        expect(result.match).toBe(true);
        expect(result.type).toBe('probabilistic');
        expect(result.score).toBeGreaterThan(0.85);
    });

    test('no match', () => {
        const p1 = { name: 'Chef Cook', bio: 'cooking food' };
        const p2 = { name: 'Gamer Pro', bio: 'playing games' };

        const result = resolver.resolve(p1, p2);
        expect(result.match).toBe(false);
        expect(result.score).toBe(0.0);
    });
});
