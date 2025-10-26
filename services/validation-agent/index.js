const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Import KERI and VLEI services
const KERIService = require('./lib/keri-service');
const VLEIService = require('./lib/vlei-service');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// Initialize services
let keriService;
let vleiService;

try {
  keriService = new KERIService();
  vleiService = new VLEIService();
  console.log('✅ [VALIDATION-AGENT] KERI and VLEI services initialized');
} catch (error) {
  console.error('❌ [VALIDATION-AGENT] Failed to initialize services:', error.message);
  console.log('💡 Run: npm run keri:init to initialize KERI agent');
  process.exit(1);
}

/**
 * POST /validate
 * Validates vLEI credentials for buyer and seller using real GLEIF API
 * Returns: Validation results with status
 */
app.post('/validate', async (req, res) => {
  try {
    const { buyer_lei, seller_lei } = req.body;
    
    console.log('🔐 [VALIDATION-AGENT] Validating parties with real VLEI verification:', {
      buyer_lei,
      seller_lei
    });

    // Validate buyer with real GLEIF API
    const buyerValidation = await vleiService.verifyLEI(buyer_lei);
    
    // Validate seller with real GLEIF API
    const sellerValidation = await vleiService.verifyLEI(seller_lei);
    
    const allValid = buyerValidation.valid && sellerValidation.valid;
    
    const result = {
      valid: allValid,
      buyer: buyerValidation,
      seller: sellerValidation,
      validated_at: new Date().toISOString(),
      validation_id: `val_${Date.now()}`,
      verification_method: 'GLEIF_API',
      agent_id: keriService.agentConfig.agentId
    };

    if (allValid) {
      console.log('✅ [VALIDATION-AGENT] Both parties validated successfully with GLEIF');
    } else {
      console.log('❌ [VALIDATION-AGENT] Validation failed:', {
        buyer_valid: buyerValidation.valid,
        seller_valid: sellerValidation.valid,
        buyer_reason: buyerValidation.reason,
        seller_reason: sellerValidation.reason
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ [VALIDATION-AGENT] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /keri/register
 * Register a new agent in the KERI network
 */
app.post('/keri/register', async (req, res) => {
  try {
    const { agentId, agentInfo } = req.body;
    
    console.log('🔗 [KERI] Registering new agent:', agentId);
    
    await keriService.registerAgent(agentId, agentInfo);
    
    res.json({
      success: true,
      agentId,
      message: 'Agent registered successfully',
      registeredAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [KERI] Registration error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /keri/verify
 * Verify an agent's identity using KERI
 */
app.post('/keri/verify', async (req, res) => {
  try {
    const { agentId, credential } = req.body;
    
    console.log('🔍 [KERI] Verifying agent:', agentId);
    
    const verification = await keriService.verifyAgent(agentId, credential);
    
    res.json(verification);

  } catch (error) {
    console.error('❌ [KERI] Verification error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /keri/credential
 * Get this agent's verification credential
 */
app.get('/keri/credential', (req, res) => {
  try {
    const credential = keriService.createVerificationCredential();
    res.json(credential);
  } catch (error) {
    console.error('❌ [KERI] Credential error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /keri/status
 * Get KERI agent status
 */
app.get('/keri/status', (req, res) => {
  try {
    const status = keriService.getAgentStatus();
    res.json(status);
  } catch (error) {
    console.error('❌ [KERI] Status error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /vlei/check/:lei
 * Quick VLEI check endpoint for a single LEI
 */
app.get('/vlei/check/:lei', async (req, res) => {
  try {
    const { lei } = req.params;
    const validation = await vleiService.verifyLEI(lei);
    res.json(validation);
  } catch (error) {
    console.error('❌ [VLEI] Check error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /vlei/verify-multiple
 * Verify multiple LEIs at once
 */
app.post('/vlei/verify-multiple', async (req, res) => {
  try {
    const { leis } = req.body;
    
    if (!Array.isArray(leis)) {
      return res.status(400).json({ error: 'LEIs must be an array' });
    }
    
    console.log(`🔍 [VLEI] Verifying ${leis.length} LEIs`);
    
    const results = await vleiService.verifyMultipleLEIs(leis);
    
    res.json({
      results,
      verified_at: new Date().toISOString(),
      total_checked: leis.length,
      valid_count: Object.values(results).filter(r => r.valid).length
    });

  } catch (error) {
    console.error('❌ [VLEI] Batch verification error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /vlei/status
 * Get VLEI service status
 */
app.get('/vlei/status', (req, res) => {
  try {
    const status = vleiService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('❌ [VLEI] Status error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /vlei/cache
 * Clear VLEI verification cache
 */
app.delete('/vlei/cache', (req, res) => {
  try {
    vleiService.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('❌ [VLEI] Cache clear error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  try {
    const keriStatus = keriService.getAgentStatus();
    const vleiStatus = vleiService.getStatus();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        keri: keriStatus,
        vlei: vleiStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 [VALIDATION-AGENT] Running on http://localhost:${PORT}`);
  console.log(`🔗 [KERI] Agent ID: ${keriService.agentConfig.agentId}`);
  console.log(`🌐 [VLEI] GLEIF API: ${vleiService.config.gleifEndpoint}`);
  console.log(`📋 [VALIDATION-AGENT] Ready for real VLEI and KERI verification!`);
});

module.exports = app;

