#!/usr/bin/env node

/**
 * ⚠️  DEPRECATED - This script is no longer needed!
 * 
 * The application now uses the Passkey Login system which automatically
 * creates and funds all wallets through the UI in ~15 seconds.
 * 
 * To use the new system:
 * 1. Start the app: npm run start:all && cd client && npm start
 * 2. Click "Setup Account with Biometric" in the UI
 * 3. All wallets are created and funded automatically!
 * 
 * See PASSKEY_LOGIN_GUIDE.md for more details.
 * 
 * This script is kept for reference only.
 * 
 * ---
 * 
 * OLD FUNCTIONALITY (still works if needed):
 * Creates test Stellar accounts for the demo
 * Generates keypairs for: buyer, seller (Jupiter Knitting), escrow
 */

const StellarSdk = require('stellar-sdk');
const fs = require('fs');
const path = require('path');

console.log('🔑 Creating Stellar Testnet Test Accounts\n');
console.log('=' .repeat(60));

// Generate keypairs
const buyerKeypair = StellarSdk.Keypair.random();
const sellerKeypair = StellarSdk.Keypair.random();
const escrowKeypair = StellarSdk.Keypair.random();

const accounts = {
  buyer: {
    name: 'Tommy Hilfiger (Buyer)',
    lei: '54930012QJWZMYHNJW95',
    public: buyerKeypair.publicKey(),
    secret: buyerKeypair.secret()
  },
  seller: {
    name: 'Jupiter Knitting (Seller)',
    lei: '3358004DXAMRWRUIYJ05',
    public: sellerKeypair.publicKey(),
    secret: sellerKeypair.secret()
  },
  escrow: {
    name: 'Marketplace Escrow',
    public: escrowKeypair.publicKey(),
    secret: escrowKeypair.secret()
  }
};

console.log('\n📋 Generated Keypairs:\n');

Object.entries(accounts).forEach(([role, account]) => {
  console.log(`${account.name} (${role.toUpperCase()})`);
  console.log(`  Public:  ${account.public}`);
  console.log(`  Secret:  ${account.secret}`);
  console.log('');
});

console.log('=' .repeat(60));
console.log('\n⚠️  IMPORTANT: Save these keys! They are needed for the demo.\n');

// Save to file
const outputPath = path.join(__dirname, 'test_accounts.json');
fs.writeFileSync(outputPath, JSON.stringify(accounts, null, 2));
console.log(`✅ Saved to: ${outputPath}\n`);

console.log('📖 Next Steps:\n');
console.log('1. Fund the escrow account using Friendbot:');
console.log(`   node scripts/fund_escrow.js\n`);
console.log('2. Or manually fund via:');
console.log(`   https://friendbot.stellar.org?addr=${accounts.escrow.public}\n`);
console.log('3. Update the mock agent_registry.json with the seller public key');
console.log(`   Seller account: ${accounts.seller.public}\n`);
console.log('4. Run the demo:');
console.log('   npm run demo\n');

