const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const StellarSdk = require('stellar-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());

// Stellar testnet configuration
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
StellarSdk.Networks.TESTNET;

// In-memory PO storage
const purchaseOrders = {};

/**
 * POST /generate
 * Generates a Purchase Order and posts it to Stellar Testnet
 * Returns: PO JSON and Stellar transaction ID
 */
app.post('/generate', async (req, res) => {
  try {
    const { buyer, seller, order, escrow_keypair } = req.body;
    
    console.log('📝 [PO-AGENT] Generating Purchase Order:', {
      buyer: buyer.name,
      seller: seller.name,
      quantity: order.quantity,
      total_usd: order.quantity * order.unit_price_usd
    });

    // Generate PO ID
    const po_id = `PO-${Date.now()}`;
    const created_at = new Date().toISOString();
    
    // Calculate totals
    const total_usd = order.quantity * order.unit_price_usd;
    const xlm_rate = 0.5; // 1 XLM = 0.5 USD (fixed demo rate)
    const total_xlm = (total_usd / xlm_rate).toFixed(7);
    
    // Create PO JSON structure
    const po = {
      po_id,
      created_at,
      buyer: {
        name: buyer.name,
        lei: buyer.lei,
        account: buyer.account
      },
      seller: {
        name: seller.name,
        lei: seller.lei,
        account: seller.account
      },
      line_items: [
        {
          description: order.product,
          quantity: order.quantity,
          unit_price_usd: order.unit_price_usd,
          total_usd: total_usd
        }
      ],
      total_usd,
      total_xlm,
      xlm_rate,
      delivery_date: order.delivery_date,
      requirements: order.requirements || [],
      status: 'issued',
      signature_buyer: generateMockSignature(buyer.lei, po_id),
      signature_seller: generateMockSignature(seller.lei, po_id)
    };
    
    // Store PO in memory
    purchaseOrders[po_id] = po;
    
    // Save PO to file for demo
    const poDir = path.join(__dirname, 'pos');
    if (!fs.existsSync(poDir)) {
      fs.mkdirSync(poDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(poDir, `${po_id}.json`),
      JSON.stringify(po, null, 2)
    );
    
    // Post PO to Stellar Testnet
    let po_tx_id = null;
    try {
      if (escrow_keypair && escrow_keypair.secret) {
        po_tx_id = await postToStellar(po_id, po, escrow_keypair.secret);
        console.log(`✅ [PO-AGENT] Posted to Stellar: ${po_tx_id}`);
        console.log(`   View: https://stellar.expert/explorer/testnet/tx/${po_tx_id}`);
      } else {
        console.log('⚠️  [PO-AGENT] No escrow keypair provided, skipping Stellar post');
      }
    } catch (stellarError) {
      console.error('❌ [PO-AGENT] Stellar error:', stellarError.message);
      // Continue anyway for demo purposes
    }
    
    console.log(`✅ [PO-AGENT] PO generated: ${po_id}`);
    
    res.json({
      po_id,
      po,
      po_tx_id,
      stellar_explorer_url: po_tx_id ? `https://stellar.expert/explorer/testnet/tx/${po_tx_id}` : null
    });

  } catch (error) {
    console.error('❌ [PO-AGENT] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /po/:po_id
 * Retrieves a PO by ID
 */
app.get('/po/:po_id', (req, res) => {
  const { po_id } = req.params;
  const po = purchaseOrders[po_id];
  
  if (!po) {
    return res.status(404).json({ error: 'PO not found' });
  }
  
  res.json(po);
});

/**
 * Post PO hash to Stellar using manageData operation
 */
async function postToStellar(po_id, po, sourceSecret) {
  // Calculate SHA256 hash of PO
  const poJson = JSON.stringify(po);
  const hash = crypto.createHash('sha256').update(poJson).digest('hex');
  
  // Create keypair from secret
  const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
  
  // Build transaction with manageData operation
  // Data key format: PO:<po_id> (max 64 bytes)
  const dataKey = `PO:${po_id}`.substring(0, 64);
  const dataValue = Buffer.from(hash.substring(0, 64)); // Max 64 bytes
  
  const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET
  })
    .addOperation(
      StellarSdk.Operation.manageData({
        name: dataKey,
        value: dataValue
      })
    )
    .addMemo(StellarSdk.Memo.text(`PO:${po_id.substring(0, 20)}`))
    .setTimeout(180)
    .build();
  
  // Sign and submit
  transaction.sign(sourceKeypair);
  const result = await server.submitTransaction(transaction);
  
  return result.hash;
}

/**
 * Generate mock signature for demo
 */
function generateMockSignature(lei, doc_id) {
  const data = `${lei}:${doc_id}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('base64');
}

app.listen(PORT, () => {
  console.log(`🚀 [PO-AGENT] Running on http://localhost:${PORT}`);
});

module.exports = app;

