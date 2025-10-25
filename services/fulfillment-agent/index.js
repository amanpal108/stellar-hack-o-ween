const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const StellarSdk = require('stellar-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

// Stellar testnet configuration
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
StellarSdk.Networks.TESTNET;

// In-memory storage
const commercialInvoices = {};
const warehouseReceipts = {};

/**
 * POST /fulfill
 * Simulates order fulfillment, generates CI and WR, posts to Stellar
 * Returns: CI, WR JSONs and Stellar transaction IDs
 */
app.post('/fulfill', async (req, res) => {
  try {
    const { po, seller_keypair } = req.body;
    
    console.log('📦 [FULFILLMENT-AGENT] Processing fulfillment for PO:', po.po_id);

    // Generate CI (Commercial Invoice)
    const ci_id = `CI-${Date.now()}`;
    const ci = {
      ci_id,
      po_id: po.po_id,
      created_at: new Date().toISOString(),
      seller: po.seller,
      buyer: po.buyer,
      line_items: po.line_items,
      total_usd: po.total_usd,
      total_xlm: po.total_xlm,
      payment_terms: 'Net 30',
      status: 'issued',
      signature_seller: generateMockSignature(po.seller.lei, ci_id)
    };
    
    commercialInvoices[ci_id] = ci;
    
    // Generate WR (Warehouse Receipt)
    const wr_id = `WR-${Date.now()}`;
    const wr = {
      wr_id,
      po_id: po.po_id,
      ci_id: ci_id,
      created_at: new Date().toISOString(),
      warehouse: {
        name: 'Chennai Port Warehouse',
        location: 'Chennai, India',
        license: 'WH-TN-2024-001'
      },
      goods: po.line_items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: 'pieces',
        condition: 'new',
        packaging: 'cartons'
      })),
      received_date: new Date().toISOString(),
      status: 'stored',
      signature_warehouse: generateMockSignature('warehouse', wr_id)
    };
    
    warehouseReceipts[wr_id] = wr;
    
    // Save to files
    const ciDir = path.join(__dirname, 'cis');
    const wrDir = path.join(__dirname, 'wrs');
    [ciDir, wrDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    fs.writeFileSync(
      path.join(ciDir, `${ci_id}.json`),
      JSON.stringify(ci, null, 2)
    );
    fs.writeFileSync(
      path.join(wrDir, `${wr_id}.json`),
      JSON.stringify(wr, null, 2)
    );
    
    console.log(`✅ [FULFILLMENT-AGENT] Generated CI: ${ci_id}`);
    console.log(`✅ [FULFILLMENT-AGENT] Generated WR: ${wr_id}`);
    
    // Post to Stellar
    let ci_tx_id = null;
    let wr_tx_id = null;
    
    try {
      if (seller_keypair && seller_keypair.secret) {
        ci_tx_id = await postDocumentToStellar('CI', ci_id, ci, seller_keypair.secret);
        console.log(`✅ [FULFILLMENT-AGENT] Posted CI to Stellar: ${ci_tx_id}`);
        console.log(`   View: https://stellar.expert/explorer/testnet/tx/${ci_tx_id}`);
        
        // Wait a bit between transactions
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        wr_tx_id = await postDocumentToStellar('WR', wr_id, wr, seller_keypair.secret);
        console.log(`✅ [FULFILLMENT-AGENT] Posted WR to Stellar: ${wr_tx_id}`);
        console.log(`   View: https://stellar.expert/explorer/testnet/tx/${wr_tx_id}`);
      } else {
        console.log('⚠️  [FULFILLMENT-AGENT] No seller keypair provided, skipping Stellar post');
      }
    } catch (stellarError) {
      console.error('❌ [FULFILLMENT-AGENT] Stellar error:', stellarError.message);
      // Continue anyway for demo
    }
    
    res.json({
      ci_id,
      ci,
      ci_tx_id,
      ci_explorer_url: ci_tx_id ? `https://stellar.expert/explorer/testnet/tx/${ci_tx_id}` : null,
      wr_id,
      wr,
      wr_tx_id,
      wr_explorer_url: wr_tx_id ? `https://stellar.expert/explorer/testnet/tx/${wr_tx_id}` : null
    });

  } catch (error) {
    console.error('❌ [FULFILLMENT-AGENT] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ci/:ci_id
 * Retrieves a Commercial Invoice by ID
 */
app.get('/ci/:ci_id', (req, res) => {
  const ci = commercialInvoices[req.params.ci_id];
  if (!ci) {
    return res.status(404).json({ error: 'CI not found' });
  }
  res.json(ci);
});

/**
 * GET /wr/:wr_id
 * Retrieves a Warehouse Receipt by ID
 */
app.get('/wr/:wr_id', (req, res) => {
  const wr = warehouseReceipts[req.params.wr_id];
  if (!wr) {
    return res.status(404).json({ error: 'WR not found' });
  }
  res.json(wr);
});

/**
 * Post document hash to Stellar
 */
async function postDocumentToStellar(docType, docId, document, sourceSecret) {
  const docJson = JSON.stringify(document);
  const hash = crypto.createHash('sha256').update(docJson).digest('hex');
  
  const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
  
  const dataKey = `${docType}:${docId}`.substring(0, 64);
  const dataValue = Buffer.from(hash.substring(0, 64));
  
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
    .addMemo(StellarSdk.Memo.text(`${docType}:${docId.substring(0, 20)}`))
    .setTimeout(180)
    .build();
  
  transaction.sign(sourceKeypair);
  const result = await server.submitTransaction(transaction);
  
  return result.hash;
}

/**
 * Generate mock signature
 */
function generateMockSignature(entity, doc_id) {
  const data = `${entity}:${doc_id}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('base64');
}

app.listen(PORT, () => {
  console.log(`🚀 [FULFILLMENT-AGENT] Running on http://localhost:${PORT}`);
});

module.exports = app;

