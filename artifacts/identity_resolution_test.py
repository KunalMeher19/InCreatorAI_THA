import unittest

# Mock Identity Resolution Logic
class IdentityResolver:
    def resolve(self, source, target):
        # 1. Deterministic Match (Exact Handle + Verified)
        if source.get('handle') and target.get('handle') and \
           source.get('handle') == target.get('handle') and \
           source.get('verified') and target.get('verified'):
            return {
                "match": True,
                "type": "deterministic",
                "score": 1.0,
                "reason": "verified_handle_match"
            }
        
        # 2. Probabilistic Match (Fuzzy)
        score = 0.0
        
        # Bio Jaccard Similarity (Mock)
        source_tokens = set(source.get('bio', '').lower().split())
        target_tokens = set(target.get('bio', '').lower().split())
        if source_tokens and target_tokens:
            intersection = len(source_tokens.intersection(target_tokens))
            union = len(source_tokens.union(target_tokens))
            score += (intersection / union) * 0.8 # Weight 0.8
            
        # Name match
        if source.get('name') == target.get('name'):
            score += 0.2
            
        if score > 0.85:
            return {
                "match": True,
                "type": "probabilistic",
                "score": round(score, 2),
                "reason": "high_confidence_signals"
            }
        elif score > 0.5:
             return {
                "match": False, # Suggestion only
                "type": "suggestion",
                "score": round(score, 2),
                "reason": "needs_review"
            }
            
        return {"match": False, "score": 0.0}

class TestIdentityResolution(unittest.TestCase):
    def setUp(self):
        self.resolver = IdentityResolver()

    def test_deterministic_match(self):
        p1 = {"handle": "@tech_guru", "verified": True, "platform": "youtube"}
        p2 = {"handle": "@tech_guru", "verified": True, "platform": "twitter"}
        
        result = self.resolver.resolve(p1, p2)
        self.assertTrue(result['match'])
        self.assertEqual(result['type'], 'deterministic')
        self.assertEqual(result['score'], 1.0)

    def test_probabilistic_match(self):
        p1 = {"name": "Tech Guru", "bio": "reviews gadgets and ai"}
        p2 = {"name": "Tech Guru", "bio": "gadgets ai and reviews"}
        
        result = self.resolver.resolve(p1, p2)
        self.assertTrue(result['match'])
        self.assertEqual(result['type'], 'probabilistic')
        self.assertGreater(result['score'], 0.85)

    def test_no_match(self):
        p1 = {"name": "Chef Cook", "bio": "cooking food"}
        p2 = {"name": "Gamer Pro", "bio": "playing games"}
        
        result = self.resolver.resolve(p1, p2)
        self.assertFalse(result['match'])
        self.assertEqual(result['score'], 0.0)

if __name__ == '__main__':
    unittest.main()
