#!/usr/bin/env node

/**
 * Funds the escrow account using Stellar Friendbot
 * Also funds buyer and seller accounts for testing
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FRIENDBOT_URL = 'https://friendbot.stellar.org';

async function fundAccount(publicKey, accountName) {
  console.log(`💰 Funding ${accountName}...`);
  console.log(`   Account: ${publicKey}`);
  
  try {
    const response = await axios.get(`${FRIENDBOT_URL}?addr=${publicKey}`);
    
    if (response.status === 200) {
      console.log(`✅ ${accountName} funded successfully!`);
      console.log(`   Balance: 10,000 XLM`);
      console.log(`   View: https://stellar.expert/explorer/testnet/account/${publicKey}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Failed to fund ${accountName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Stellar Testnet Account Funding\n');
  console.log('=' .repeat(60));
  
  // Load test accounts
  const accountsPath = path.join(__dirname, 'test_accounts.json');
  
  if (!fs.existsSync(accountsPath)) {
    console.error('\n❌ Error: test_accounts.json not found!');
    console.log('\n📖 Please run first: node scripts/create_test_accounts.js\n');
    process.exit(1);
  }
  
  const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
  
  console.log('\nFunding all test accounts...\n');
  
  // Fund escrow (most important)
  await fundAccount(accounts.escrow.public, 'Escrow Account');
  console.log('');
  
  // Small delay between requests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Fund buyer
  await fundAccount(accounts.buyer.public, 'Buyer Account');
  console.log('');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Fund seller
  await fundAccount(accounts.seller.public, 'Seller Account');
  console.log('');
  
  console.log('=' .repeat(60));
  console.log('\n✅ All accounts funded!\n');
  console.log('📖 Account Details:');
  console.log(`   Escrow:  ${accounts.escrow.public}`);
  console.log(`   Buyer:   ${accounts.buyer.public}`);
  console.log(`   Seller:  ${accounts.seller.public}\n`);
  console.log('🚀 Ready to run demo! Execute: npm run demo\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

