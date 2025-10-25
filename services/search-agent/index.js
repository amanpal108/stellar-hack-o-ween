const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Load agent registry
const registryPath = path.join(__dirname, '../../mocks/agent_registry.json');
const agentRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

/**
 * POST /search
 * Searches for matching sellers based on requirements
 * Returns: Array of ranked seller agents
 */
app.post('/search', async (req, res) => {
  try {
    const { requirements, quantity, product } = req.body;
    
    console.log('🔍 [SEARCH-AGENT] Searching for sellers matching:', {
      product,
      quantity,
      requirements
    });

    // Rank sellers based on matching criteria
    const rankedSellers = rankSellers(agentRegistry, { requirements, quantity, product });
    
    console.log(`✅ [SEARCH-AGENT] Found ${rankedSellers.length} matching sellers`);
    rankedSellers.forEach((seller, idx) => {
      console.log(`   ${idx + 1}. ${seller.name} (confidence: ${seller.confidence})`);
    });

    res.json(rankedSellers);

  } catch (error) {
    console.error('❌ [SEARCH-AGENT] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Rank sellers based on matching criteria
 */
function rankSellers(registry, criteria) {
  const { requirements = [], quantity = 0, product = '' } = criteria;
  
  const scored = registry.map(seller => {
    let score = 0;
    let matches = [];
    
    // Check quantity capability
    if (quantity >= seller.capabilities.min_quantity && 
        quantity <= seller.capabilities.max_quantity) {
      score += 0.3;
      matches.push('quantity_match');
    }
    
    // Check keywords match
    const lowerProduct = product.toLowerCase();
    const lowerRequirements = requirements.map(r => r.toLowerCase());
    
    seller.keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      
      // Check if keyword appears in product description
      if (lowerProduct.includes(lowerKeyword)) {
        score += 0.1;
        matches.push(`keyword:${keyword}`);
      }
      
      // Check if keyword matches requirements
      lowerRequirements.forEach(req => {
        if (req.includes(lowerKeyword) || lowerKeyword.includes(req)) {
          score += 0.15;
          matches.push(`requirement:${keyword}`);
        }
      });
    });
    
    // Check description match
    const lowerDesc = seller.description.toLowerCase();
    lowerRequirements.forEach(req => {
      if (lowerDesc.includes(req)) {
        score += 0.2;
        matches.push(`description:${req}`);
      }
    });
    
    // Normalize score to 0-1 range and cap at 0.95
    const confidence = Math.min(0.95, score);
    
    return {
      agentID: seller.agentID,
      name: seller.name,
      lei: seller.lei,
      stellar_account: seller.stellar_account,
      description: seller.description,
      confidence: parseFloat(confidence.toFixed(2)),
      matches,
      capabilities: seller.capabilities,
      endpoint: seller.endpoint
    };
  });
  
  // Sort by confidence (descending) and return top matches
  return scored
    .sort((a, b) => b.confidence - a.confidence)
    .filter(s => s.confidence > 0.1); // Only return sellers with some match
}

app.listen(PORT, () => {
  console.log(`🚀 [SEARCH-AGENT] Running on http://localhost:${PORT}`);
  console.log(`📚 [SEARCH-AGENT] Loaded ${agentRegistry.length} sellers from registry`);
});

module.exports = app;

