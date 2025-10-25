const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// Load mock vLEI responses
const vleiPath = path.join(__dirname, '../../mocks/mock_vlei_responses.json');
const vleiRegistry = JSON.parse(fs.readFileSync(vleiPath, 'utf8'));

/**
 * POST /validate
 * Validates vLEI credentials for buyer and seller
 * Returns: Validation results with status
 */
app.post('/validate', async (req, res) => {
  try {
    const { buyer_lei, seller_lei } = req.body;
    
    console.log('🔐 [VALIDATION-AGENT] Validating parties:', {
      buyer_lei,
      seller_lei
    });

    // Validate buyer
    const buyerValidation = validateLEI(buyer_lei);
    
    // Validate seller
    const sellerValidation = validateLEI(seller_lei);
    
    const allValid = buyerValidation.valid && sellerValidation.valid;
    
    const result = {
      valid: allValid,
      buyer: buyerValidation,
      seller: sellerValidation,
      validated_at: new Date().toISOString(),
      validation_id: `val_${Date.now()}`
    };

    if (allValid) {
      console.log('✅ [VALIDATION-AGENT] Both parties validated successfully');
    } else {
      console.log('❌ [VALIDATION-AGENT] Validation failed:', {
        buyer_valid: buyerValidation.valid,
        seller_valid: sellerValidation.valid
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ [VALIDATION-AGENT] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Validate a single LEI against mock registry
 */
function validateLEI(lei) {
  const record = vleiRegistry[lei];
  
  if (!record) {
    return {
      lei,
      valid: false,
      reason: 'LEI not found in registry'
    };
  }
  
  // Check if credential is verified and not expired
  const now = new Date();
  const expiresAt = new Date(record.expires_at);
  
  if (!record.verified) {
    return {
      lei,
      valid: false,
      reason: 'vLEI credential not verified',
      record
    };
  }
  
  if (expiresAt < now) {
    return {
      lei,
      valid: false,
      reason: 'vLEI credential expired',
      record
    };
  }
  
  return {
    lei,
    valid: true,
    entity_name: record.entity_name,
    status: record.status,
    issuer: record.issuer,
    expires_at: record.expires_at,
    credential_type: record.credential_type
  };
}

/**
 * GET /check/:lei
 * Quick check endpoint for a single LEI
 */
app.get('/check/:lei', (req, res) => {
  const { lei } = req.params;
  const validation = validateLEI(lei);
  res.json(validation);
});

app.listen(PORT, () => {
  console.log(`🚀 [VALIDATION-AGENT] Running on http://localhost:${PORT}`);
  console.log(`📚 [VALIDATION-AGENT] Loaded ${Object.keys(vleiRegistry).length} vLEI records`);
});

module.exports = app;

