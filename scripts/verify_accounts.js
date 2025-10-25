#!/usr/bin/env node

/**
 * Verify Stellar testnet accounts are properly set up
 * Run: node scripts/verify_accounts.js
 */

const StellarSdk = require('stellar-sdk');
const fs = require('fs');
const path = require('path');

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// Load test accounts
const accountsPath = path.join(__dirname, 'test_accounts.json');

if (!fs.existsSync(accountsPath)) {
  console.error('❌ test_accounts.json not found!');
  console.log('💡 Run: node scripts/create_test_accounts.js');
  process.exit(1);
}

const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));

async function verifyAccount(name, publicKey, secretKey) {
  try {
    console.log(`\n🔍 Checking ${name}...`);
    console.log(`   Public: ${publicKey}`);
    
    // Verify keypair is valid
    try {
      const keypair = StellarSdk.Keypair.fromSecret(secretKey);
      if (keypair.publicKey() !== publicKey) {
        console.error(`❌ ${name}: Public key mismatch!`);
        return false;
      }
      console.log('   ✅ Keypair is valid');
    } catch (error) {
      console.error(`❌ ${name}: Invalid secret key!`);
      return false;
    }
    
    // Check if account exists and is funded
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find(b => b.asset_type === 'native');
    
    console.log(`   ✅ Account exists on testnet`);
    console.log(`   💰 Balance: ${xlmBalance.balance} XLM`);
    
    if (parseFloat(xlmBalance.balance) < 10) {
      console.log(`   ⚠️  Low balance! Consider funding via Friendbot`);
    }
    
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`❌ ${name}: Account not found on testnet`);
      console.log(`   💡 Fund via Friendbot: https://friendbot.stellar.org?addr=${publicKey}`);
    } else {
      console.error(`❌ ${name}: Error - ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Verifying Stellar Testnet Accounts\n');
  console.log('=' .repeat(70));
  
  const results = await Promise.all([
    verifyAccount('Buyer (Tommy Hilfiger)', accounts.buyer.public, accounts.buyer.secret),
    verifyAccount('Seller (Jupiter Knitting)', accounts.seller.public, accounts.seller.secret),
    verifyAccount('Escrow (Marketplace)', accounts.escrow.public, accounts.escrow.secret)
  ]);
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Summary:');
  
  const allValid = results.every(r => r === true);
  
  if (allValid) {
    console.log('✅ All accounts are valid and funded!');
    console.log('\n🎉 Ready to run the demo with REAL Stellar transactions!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start services: npm run services');
    console.log('   2. Start frontend: cd client && npm start');
    console.log('   3. Open http://localhost:3000');
  } else {
    console.log('❌ Some accounts have issues. Please fix them before running the demo.');
    console.log('\n💡 To fix:');
    console.log('   1. Run: node scripts/fund_escrow.js');
    console.log('   2. Or manually fund via Friendbot');
  }
  
  console.log('\n🔗 Stellar Explorer:');
  console.log(`   Buyer:  https://stellar.expert/explorer/testnet/account/${accounts.buyer.public}`);
  console.log(`   Seller: https://stellar.expert/explorer/testnet/account/${accounts.seller.public}`);
  console.log(`   Escrow: https://stellar.expert/explorer/testnet/account/${accounts.escrow.public}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});

