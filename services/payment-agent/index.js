const express = require('express');
const cors = require('cors');
const StellarSdk = require('stellar-sdk');

const app = express();
const PORT = 3007;

app.use(cors());
app.use(express.json());

// Stellar testnet configuration
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
StellarSdk.Networks.TESTNET;

// In-memory payment records
const payments = {};

/**
 * POST /release
 * Releases payment from escrow to seller after DvP verification
 * Executes real Stellar Testnet payment transaction
 * Returns: Payment record and Stellar transaction ID
 */
app.post('/release', async (req, res) => {
  try {
    const { po, dvp_report, escrow_keypair } = req.body;
    
    console.log('💰 [PAYMENT-AGENT] Processing payment release:', {
      po_id: po.po_id,
      amount_xlm: po.total_xlm,
      seller: po.seller.name,
      dvp_match: dvp_report.match
    });

    // Verify DvP passed
    if (!dvp_report.match) {
      console.log('❌ [PAYMENT-AGENT] DvP verification failed, cannot release payment');
      return res.status(400).json({
        error: 'DvP verification failed',
        dvp_errors: dvp_report.errors
      });
    }

    // Create payment record
    const payment_id = `PAY-${Date.now()}`;
    const payment = {
      payment_id,
      po_id: po.po_id,
      from_account: escrow_keypair ? escrow_keypair.public : 'ESCROW_ACCOUNT',
      to_account: po.seller.account,
      amount_xlm: po.total_xlm,
      amount_usd: po.total_usd,
      status: 'pending',
      dvp_verification_id: dvp_report.verification_id,
      initiated_at: new Date().toISOString()
    };

    payments[payment_id] = payment;

    // Execute Stellar payment
    let payment_tx_id = null;
    try {
      if (escrow_keypair && escrow_keypair.secret) {
        console.log('💸 [PAYMENT-AGENT] Executing Stellar payment:', {
          from: escrow_keypair.public,
          to: po.seller.account,
          amount: po.total_xlm,
          po_id: po.po_id
        });
        
        payment_tx_id = await executePayment(
          escrow_keypair.secret,
          po.seller.account,
          po.total_xlm,
          po.po_id
        );
        
        payment.status = 'completed';
        payment.tx_id = payment_tx_id;
        payment.completed_at = new Date().toISOString();
        
        console.log(`✅ [PAYMENT-AGENT] Payment completed: ${payment_tx_id}`);
        console.log(`   View: https://stellar.expert/explorer/testnet/tx/${payment_tx_id}`);
      } else {
        console.log('⚠️  [PAYMENT-AGENT] No escrow keypair provided, simulating payment');
        payment.status = 'simulated';
        payment_tx_id = 'SIMULATED_TX_' + Date.now();
      }
    } catch (stellarError) {
      console.error('❌ [PAYMENT-AGENT] Stellar payment error:', stellarError);
      console.error('   Error details:', JSON.stringify(stellarError.response?.data || stellarError, null, 2));
      
      payment.status = 'failed';
      payment.error = stellarError.message;
      payment.error_details = stellarError.response?.data;
      
      return res.status(500).json({
        error: 'Payment transaction failed',
        details: stellarError.message,
        stellar_error: stellarError.response?.data,
        payment
      });
    }

    console.log(`✅ [PAYMENT-AGENT] Payment ${payment_id} ${payment.status}`);

    res.json({
      payment_id,
      payment,
      payment_tx_id,
      stellar_explorer_url: payment_tx_id && payment.status === 'completed' 
        ? `https://stellar.expert/explorer/testnet/tx/${payment_tx_id}`
        : null
    });

  } catch (error) {
    console.error('❌ [PAYMENT-AGENT] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /payment/:payment_id
 * Retrieves payment record
 */
app.get('/payment/:payment_id', (req, res) => {
  const payment = payments[req.params.payment_id];
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});

/**
 * POST /check-escrow
 * Checks if escrow account is funded
 */
app.post('/check-escrow', async (req, res) => {
  try {
    const { escrow_public_key } = req.body;
    
    const account = await server.loadAccount(escrow_public_key);
    
    // Get XLM balance
    const xlmBalance = account.balances.find(b => b.asset_type === 'native');
    
    res.json({
      account: escrow_public_key,
      xlm_balance: xlmBalance ? xlmBalance.balance : '0',
      funded: parseFloat(xlmBalance?.balance || 0) > 0
    });
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.json({
        account: req.body.escrow_public_key,
        xlm_balance: '0',
        funded: false,
        error: 'Account not found (not funded via Friendbot)'
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * Execute payment on Stellar Testnet
 */
async function executePayment(sourceSecret, destinationPublicKey, amountXLM, poId) {
  try {
    console.log('🔐 [PAYMENT-AGENT] Creating keypair from secret...');
    const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
    
    console.log('📡 [PAYMENT-AGENT] Loading source account:', sourceKeypair.publicKey());
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
    
    // Get source balance
    const sourceBalance = sourceAccount.balances.find(b => b.asset_type === 'native');
    console.log('💰 [PAYMENT-AGENT] Source balance:', sourceBalance.balance, 'XLM');
    
    // Verify destination account exists
    console.log('📡 [PAYMENT-AGENT] Verifying destination account:', destinationPublicKey);
    try {
      await server.loadAccount(destinationPublicKey);
      console.log('✅ [PAYMENT-AGENT] Destination account exists');
    } catch (destError) {
      throw new Error(`Destination account not found: ${destinationPublicKey}. Account may not be funded on testnet.`);
    }
    
    console.log('🏗️  [PAYMENT-AGENT] Building transaction...');
    // Build payment transaction
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset: StellarSdk.Asset.native(),
          amount: amountXLM.toString()
        })
      )
      .addMemo(StellarSdk.Memo.text(`Payment:${poId.substring(0, 15)}`))
      .setTimeout(180)
      .build();
    
    console.log('✍️  [PAYMENT-AGENT] Signing transaction...');
    transaction.sign(sourceKeypair);
    
    console.log('📤 [PAYMENT-AGENT] Submitting transaction to Stellar...');
    const result = await server.submitTransaction(transaction);
    
    console.log('✅ [PAYMENT-AGENT] Transaction submitted successfully!');
    return result.hash;
  } catch (error) {
    console.error('❌ [PAYMENT-AGENT] executePayment error:', error.message);
    throw error;
  }
}

app.listen(PORT, () => {
  console.log(`🚀 [PAYMENT-AGENT] Running on http://localhost:${PORT}`);
});

module.exports = app;

