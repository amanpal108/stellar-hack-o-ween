#!/usr/bin/env node

/**
 * End-to-end demo script
 * Runs the complete trade flow from buyer prompt to payment settlement
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Service endpoints
const SERVICES = {
  buyer: 'http://localhost:3001',
  search: 'http://localhost:3002',
  validation: 'http://localhost:3003',
  po: 'http://localhost:3004',
  fulfillment: 'http://localhost:3005',
  dvp: 'http://localhost:3006',
  payment: 'http://localhost:3007'
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(emoji, message, color = '') {
  console.log(`${color}${emoji} ${message}${COLORS.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`${COLORS.bright}${COLORS.cyan}${title}${COLORS.reset}`);
  console.log('='.repeat(70) + '\n');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkService(name, url) {
  try {
    await axios.get(url, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('\n' + '🌟'.repeat(35));
  section('STELLAR TRADE FLOW - END-TO-END DEMO');
  console.log('Agent-driven buyer→seller trade with Stellar Testnet escrow\n');
  
  // Check if services are running
  section('STEP 0: Pre-flight Checks');
  
  log('🔍', 'Checking if all services are running...', COLORS.yellow);
  
  let allRunning = true;
  for (const [name, url] of Object.entries(SERVICES)) {
    const running = await checkService(name, url);
    if (running) {
      log('✅', `${name}-agent: ${url}`, COLORS.green);
    } else {
      log('❌', `${name}-agent: NOT RUNNING (${url})`, COLORS.red);
      allRunning = false;
    }
  }
  
  if (!allRunning) {
    console.log('\n❌ Not all services are running!');
    console.log('\n📖 Start services first:');
    console.log('   npm run start:all');
    console.log('\n   (Or start each service individually in separate terminals)\n');
    process.exit(1);
  }
  
  // Load test accounts
  const accountsPath = path.join(__dirname, 'test_accounts.json');
  let accounts = {};
  
  if (fs.existsSync(accountsPath)) {
    accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    log('✅', 'Loaded test accounts', COLORS.green);
  } else {
    log('⚠️ ', 'Test accounts not found, using placeholders', COLORS.yellow);
    accounts = {
      buyer: { public: 'GBUYER_PLACEHOLDER', secret: 'SBUYER_PLACEHOLDER' },
      seller: { public: 'GSELLER_PLACEHOLDER', secret: 'SSELLER_PLACEHOLDER' },
      escrow: { public: 'GESCROW_PLACEHOLDER', secret: 'SESCROW_PLACEHOLDER' }
    };
  }
  
  console.log('');
  
  // STEP 1: Buyer initiates purchase
  section('STEP 1: Buyer Initiates Purchase Request');
  
  const buyerRequest = {
    buyer_name: 'Tommy Hilfiger',
    buyer_lei: '5493001KJTIIGC8Y1R12',
    buyer_account: accounts.buyer.public,
    prompt_text: "Looking for 100,000 Men's T-shirts with South Indian Cultural Heritage Design made from Non Synthetic dye. Offer: 9 USD per t-shirt. Delivery: by 2025-11-30."
  };
  
  log('📤', 'Sending purchase request to buyer-agent...', COLORS.blue);
  console.log('   Buyer:', buyerRequest.buyer_name);
  console.log('   Prompt:', buyerRequest.prompt_text.substring(0, 80) + '...');
  
  const startRes = await axios.post(`${SERVICES.buyer}/start`, buyerRequest);
  const job = startRes.data;
  
  log('✅', `Job created: ${job.job_id}`, COLORS.green);
  console.log('   Parsed:', JSON.stringify(job.parsed_request, null, 2));
  
  await sleep(1000);
  
  // STEP 2: Search for sellers
  section('STEP 2: Search for Matching Sellers');
  
  log('🔍', 'Querying search-agent...', COLORS.blue);
  
  const searchRes = await axios.post(`${SERVICES.search}/search`, {
    product: job.parsed_request.product,
    quantity: job.parsed_request.quantity,
    requirements: job.parsed_request.requirements
  });
  
  const sellers = searchRes.data;
  log('✅', `Found ${sellers.length} matching sellers`, COLORS.green);
  
  sellers.forEach((seller, idx) => {
    console.log(`   ${idx + 1}. ${seller.name} (confidence: ${seller.confidence})`);
  });
  
  const topSeller = sellers[0];
  log('🎯', `Selected: ${topSeller.name}`, COLORS.cyan);
  
  await sleep(1000);
  
  // STEP 3: Validate parties
  section('STEP 3: Validate vLEI Credentials');
  
  log('🔐', 'Validating buyer and seller credentials...', COLORS.blue);
  
  const validationRes = await axios.post(`${SERVICES.validation}/validate`, {
    buyer_lei: buyerRequest.buyer_lei,
    seller_lei: topSeller.lei
  });
  
  const validation = validationRes.data;
  
  if (validation.valid) {
    log('✅', 'Both parties validated successfully', COLORS.green);
    console.log('   Buyer:', validation.buyer.entity_name);
    console.log('   Seller:', validation.seller.entity_name);
  } else {
    log('❌', 'Validation failed!', COLORS.red);
    process.exit(1);
  }
  
  await sleep(1000);
  
  // STEP 4: Generate Purchase Order
  section('STEP 4: Generate Purchase Order & Post to Stellar');
  
  log('📝', 'Generating PO and posting to Stellar Testnet...', COLORS.blue);
  
  const poRes = await axios.post(`${SERVICES.po}/generate`, {
    buyer: {
      name: buyerRequest.buyer_name,
      lei: buyerRequest.buyer_lei,
      account: accounts.buyer.public
    },
    seller: {
      name: topSeller.name,
      lei: topSeller.lei,
      account: accounts.seller.public
    },
    order: {
      product: job.parsed_request.product,
      quantity: job.parsed_request.quantity,
      unit_price_usd: job.parsed_request.unit_price_usd,
      delivery_date: job.parsed_request.delivery_date,
      requirements: job.parsed_request.requirements
    },
    escrow_keypair: {
      public: accounts.escrow.public,
      secret: accounts.escrow.secret
    }
  });
  
  const poData = poRes.data;
  log('✅', `Purchase Order created: ${poData.po_id}`, COLORS.green);
  console.log('   Total:', `$${poData.po.total_usd.toLocaleString()} (${poData.po.total_xlm} XLM)`);
  
  if (poData.po_tx_id) {
    log('⭐', `Posted to Stellar: ${poData.po_tx_id}`, COLORS.bright);
    console.log('   🔗', poData.stellar_explorer_url);
  }
  
  await sleep(2000);
  
  // STEP 5: Fulfill order (CI + WR)
  section('STEP 5: Fulfill Order & Post CI/WR to Stellar');
  
  log('📦', 'Processing fulfillment...', COLORS.blue);
  
  const fulfillmentRes = await axios.post(`${SERVICES.fulfillment}/fulfill`, {
    po: poData.po,
    seller_keypair: {
      public: accounts.seller.public,
      secret: accounts.seller.secret
    }
  });
  
  const fulfillment = fulfillmentRes.data;
  
  log('✅', `Commercial Invoice: ${fulfillment.ci_id}`, COLORS.green);
  if (fulfillment.ci_tx_id) {
    console.log('   🔗', fulfillment.ci_explorer_url);
  }
  
  log('✅', `Warehouse Receipt: ${fulfillment.wr_id}`, COLORS.green);
  if (fulfillment.wr_tx_id) {
    console.log('   🔗', fulfillment.wr_explorer_url);
  }
  
  await sleep(2000);
  
  // STEP 6: DvP Verification
  section('STEP 6: Delivery vs Payment Verification');
  
  log('🔍', 'Verifying document consistency...', COLORS.blue);
  
  const dvpRes = await axios.post(`${SERVICES.dvp}/verify`, {
    po: poData.po,
    ci: fulfillment.ci,
    wr: fulfillment.wr
  });
  
  const dvpReport = dvpRes.data;
  
  if (dvpReport.match) {
    log('✅', `DvP Verification PASSED (${dvpReport.summary})`, COLORS.green);
    dvpReport.checks.forEach(check => {
      const icon = check.passed ? '✓' : '✗';
      console.log(`   ${icon} ${check.name}`);
    });
  } else {
    log('❌', 'DvP Verification FAILED', COLORS.red);
    console.log('   Errors:', dvpReport.errors);
    process.exit(1);
  }
  
  await sleep(1000);
  
  // STEP 7: Release payment
  section('STEP 7: Release Payment to Seller');
  
  log('💰', 'Releasing payment from escrow...', COLORS.blue);
  
  const paymentRes = await axios.post(`${SERVICES.payment}/release`, {
    po: poData.po,
    dvp_report: dvpReport,
    escrow_keypair: {
      public: accounts.escrow.public,
      secret: accounts.escrow.secret
    }
  });
  
  const payment = paymentRes.data;
  
  log('✅', `Payment completed: ${payment.payment_id}`, COLORS.green);
  console.log('   From:', payment.payment.from_account);
  console.log('   To:', payment.payment.to_account);
  console.log('   Amount:', `${payment.payment.amount_xlm} XLM ($${payment.payment.amount_usd.toLocaleString()})`);
  console.log('   Status:', payment.payment.status);
  
  if (payment.payment_tx_id && payment.payment.status === 'completed') {
    log('⭐', `Stellar Payment TX: ${payment.payment_tx_id}`, COLORS.bright);
    console.log('   🔗', payment.stellar_explorer_url);
  }
  
  // Summary
  section('🎉 DEMO COMPLETE!');
  
  console.log('Timeline Summary:\n');
  console.log(`  1. ✅ Purchase request initiated (${job.job_id})`);
  console.log(`  2. ✅ Seller matched: ${topSeller.name}`);
  console.log(`  3. ✅ Parties validated via vLEI`);
  console.log(`  4. ✅ PO generated & posted: ${poData.po_id}`);
  console.log(`  5. ✅ CI & WR generated & posted`);
  console.log(`  6. ✅ DvP verification passed`);
  console.log(`  7. ✅ Payment released: ${payment.payment_id}`);
  
  console.log('\n📊 Stellar Transactions:\n');
  if (poData.po_tx_id) {
    console.log(`  PO:  ${poData.stellar_explorer_url}`);
  }
  if (fulfillment.ci_tx_id) {
    console.log(`  CI:  ${fulfillment.ci_explorer_url}`);
  }
  if (fulfillment.wr_tx_id) {
    console.log(`  WR:  ${fulfillment.wr_explorer_url}`);
  }
  if (payment.stellar_explorer_url) {
    console.log(`  PAY: ${payment.stellar_explorer_url}`);
  }
  
  console.log('\n' + '🌟'.repeat(35) + '\n');
}

main().catch(error => {
  console.error('\n❌ Demo failed:', error.message);
  if (error.response) {
    console.error('   Response:', error.response.data);
  }
  console.error('');
  process.exit(1);
});

