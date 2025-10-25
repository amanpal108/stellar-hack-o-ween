const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// In-memory job store
const jobs = {};

/**
 * POST /start
 * Accepts buyer prompt, initiates the trade flow
 * Returns: { job_id, stage, message }
 */
app.post('/start', async (req, res) => {
  try {
    const { buyer_name, buyer_lei, buyer_account, prompt_text } = req.body;
    
    console.log('📥 [BUYER-AGENT] Received purchase request:', {
      buyer_name,
      buyer_lei,
      prompt_text: prompt_text.substring(0, 100) + '...'
    });

    // Generate job ID
    const job_id = `job_${Date.now()}`;
    
    // Parse the prompt to extract structured data
    const parsed = parsePrompt(prompt_text);
    
    // Create job record
    jobs[job_id] = {
      job_id,
      buyer_name,
      buyer_lei,
      buyer_account,
      prompt_text,
      parsed_request: parsed,
      stage: 'initiated',
      created_at: new Date().toISOString(),
      timeline: [
        { stage: 'initiated', timestamp: new Date().toISOString() }
      ]
    };

    console.log('✅ [BUYER-AGENT] Job created:', job_id);
    console.log('📊 [BUYER-AGENT] Parsed request:', parsed);

    res.json({
      job_id,
      stage: 'initiated',
      message: 'Purchase request received and parsed',
      parsed_request: parsed
    });

  } catch (error) {
    console.error('❌ [BUYER-AGENT] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /status/:job_id
 * Returns current status of a job
 */
app.get('/status/:job_id', (req, res) => {
  const { job_id } = req.params;
  const job = jobs[job_id];
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

/**
 * POST /update/:job_id
 * Internal endpoint to update job status
 */
app.post('/update/:job_id', (req, res) => {
  const { job_id } = req.params;
  const updates = req.body;
  
  if (!jobs[job_id]) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  jobs[job_id] = {
    ...jobs[job_id],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  // Add to timeline if stage changed
  if (updates.stage) {
    jobs[job_id].timeline.push({
      stage: updates.stage,
      timestamp: new Date().toISOString()
    });
  }
  
  console.log(`🔄 [BUYER-AGENT] Job ${job_id} updated to stage: ${updates.stage || 'N/A'}`);
  
  res.json(jobs[job_id]);
});

/**
 * Parse natural language prompt into structured data
 */
function parsePrompt(prompt) {
  // Simple regex-based parsing for demo purposes
  const quantityMatch = prompt.match(/(\d+[\d,]*)\s+/);
  const priceMatch = prompt.match(/(\d+(?:\.\d+)?)\s+USD/i);
  const dateMatch = prompt.match(/by\s+(\d{4}-\d{2}-\d{2})/i);
  
  // Extract product description (between "for" and price/offer)
  let product = 'Product';
  const forMatch = prompt.match(/for\s+(.*?)\s+(?:made|with|Offer)/i);
  if (forMatch) {
    product = forMatch[1].trim();
  }
  
  return {
    product: product,
    quantity: quantityMatch ? parseInt(quantityMatch[1].replace(/,/g, '')) : 100000,
    unit_price_usd: priceMatch ? parseFloat(priceMatch[1]) : 9,
    delivery_date: dateMatch ? dateMatch[1] : '2025-11-30',
    requirements: extractRequirements(prompt)
  };
}

/**
 * Extract key requirements from prompt
 */
function extractRequirements(prompt) {
  const requirements = [];
  
  if (prompt.toLowerCase().includes('non synthetic')) {
    requirements.push('non synthetic dye');
  }
  if (prompt.toLowerCase().includes('cultural heritage')) {
    requirements.push('cultural heritage design');
  }
  if (prompt.toLowerCase().includes('south indian')) {
    requirements.push('south indian design');
  }
  
  return requirements;
}

app.listen(PORT, () => {
  console.log(`🚀 [BUYER-AGENT] Running on http://localhost:${PORT}`);
});

module.exports = app;

