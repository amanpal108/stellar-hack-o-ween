/**
 * Stellar Passkey Service with Real WebAuthn
 * Using official passkey-kit from: https://github.com/kalepail/passkey-kit
 * Handles wallet creation with biometric authentication and smart contract wallets
 */

// Import only the client-side PasskeyKit, not PasskeyServer
import { PasskeyKit } from 'passkey-kit/src/kit';
import * as StellarSdk from 'stellar-sdk';

const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const HORIZON_URL = process.env.REACT_APP_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.REACT_APP_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
const RPC_URL = process.env.REACT_APP_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';

// Factory contract for smart wallet creation
// Using our deployed Stellar Integra Factory contract
// Contract Address: CBB4FGQMZNJBGKFVJYWZFX63EU5F5KNB5QK7SR4SIREMCQUJCPN2IEA6
const FACTORY_CONTRACT_ID = process.env.REACT_APP_FACTORY_CONTRACT_ID || 
  'CBB4FGQMZNJBGKFVJYWZFX63EU5F5KNB5QK7SR4SIREMCQUJCPN2IEA6'; // Deployed Stellar Integra Factory

class PasskeyService {
  constructor() {
    this.server = new StellarSdk.Horizon.Server(HORIZON_URL);
    this.passkeyKit = null;
    this.usePasskeys = false;
    this.accounts = {
      buyer: null,
      seller: null,
      escrow: null
    };
    this.initialized = false;
    this.passkeyWallet = null;
    
    // Try to initialize PasskeyKit (optional - will fallback to traditional wallets)
    try {
      this.passkeyKit = new PasskeyKit({
        rpcUrl: RPC_URL,
        networkPassphrase: NETWORK_PASSPHRASE,
        factoryContractId: FACTORY_CONTRACT_ID,
      });
      this.usePasskeys = true;
      console.log('🔐 PasskeyKit initialized (will attempt WebAuthn)');
      console.log('📦 Source: https://github.com/kalepail/passkey-kit');
      console.log('🏭 Factory Contract:', FACTORY_CONTRACT_ID);
    } catch (error) {
      console.warn('⚠️ PasskeyKit initialization failed, using traditional wallets:', error.message);
      console.log('💡 App will use standard Stellar keypairs instead');
      this.usePasskeys = false;
    }
  }

  /**
   * Creates a new Stellar keypair (simulating passkey-kit wallet creation)
   * In production, this would use actual passkey-kit biometric authentication
   */
  async createWallet(name) {
    console.log(`🔐 Creating wallet for: ${name}`);
    
    // Generate a new keypair
    const keypair = StellarSdk.Keypair.random();
    
    return {
      name,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      keypair
    };
  }

  /**
   * Funds a wallet with XLM using Friendbot
   */
  async fundWallet(publicKey, amount = 100000) {
    console.log(`💰 Funding wallet: ${publicKey}`);
    
    try {
      // Use Friendbot to fund the account (gives 10,000 XLM initially)
      const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
      
      if (!response.ok) {
        throw new Error(`Friendbot failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Wallet funded via Friendbot: ${publicKey}`);
      
      // Wait for account to be available
      await this.waitForAccount(publicKey);
      
      // Check if we need additional funding to reach 100K XLM
      // Note: Friendbot gives 10,000 XLM, so we're simulating additional funding
      // In a real scenario, you'd need a funded source account
      
      return {
        success: true,
        balance: '10,000', // Friendbot gives 10,000 XLM
        txHash: data.hash,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${data.hash}`
      };
    } catch (error) {
      console.error('Error funding wallet:', error);
      throw new Error(`Failed to fund wallet: ${error.message}`);
    }
  }

  /**
   * Wait for account to be available on the network
   */
  async waitForAccount(publicKey, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.server.loadAccount(publicKey);
        console.log(`✅ Account ${publicKey} is now active`);
        return true;
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error('Account not found after funding');
        }
        // Wait 1 second before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Initialize all three wallets (buyer uses smart contract if passkey available, else traditional)
   */
  async initializeAllWallets(onProgress) {
    console.log('🚀 Initializing wallets...');
    
    try {
      let buyer;
      
      // Step 1: Create buyer wallet (smart contract or traditional)
      if (this.passkeyWallet) {
        // Use passkey smart contract wallet
        onProgress('Setting up Buyer Wallet (Smart Contract)...', 20);
        const buyerPublicKey = this.passkeyWallet.getPublicKey();
        console.log('👔 Buyer wallet (Smart Contract):', buyerPublicKey);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        onProgress('Funding Buyer Smart Contract Wallet...', 30);
        const buyerFunding = await this.fundWallet(buyerPublicKey);
        
        buyer = {
          name: 'Tommy Hilfiger (Buyer)',
          lei: '54930012QJWZMYHNJW95',
          publicKey: buyerPublicKey,
          isSmartContract: true,
          wallet: this.passkeyWallet,
          fundingTx: buyerFunding
        };
      } else {
        // Use traditional keypair
        onProgress('Creating Buyer Wallet...', 20);
        const buyerWallet = await this.createWallet('Tommy Hilfiger (Buyer)');
        buyerWallet.lei = '54930012QJWZMYHNJW95';
        console.log('👔 Buyer wallet (Traditional):', buyerWallet.publicKey);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        onProgress('Funding Buyer Wallet...', 30);
        const buyerFunding = await this.fundWallet(buyerWallet.publicKey);
        
        buyer = {
          name: buyerWallet.name,
          lei: buyerWallet.lei,
          publicKey: buyerWallet.publicKey,
          secretKey: buyerWallet.secretKey,
          isSmartContract: false,
          fundingTx: buyerFunding
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Create seller wallet
      onProgress('Creating Seller Wallet...', 50);
      const seller = await this.createWallet('Jupiter Knitting (Seller)');
      seller.lei = '3358004DXAMRWRUIYJ05';
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Fund seller wallet
      onProgress('Funding Seller Wallet...', 60);
      const sellerFunding = await this.fundWallet(seller.publicKey);
      seller.fundingTx = sellerFunding;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 5: Create escrow wallet
      onProgress('Creating Escrow Wallet...', 80);
      const escrow = await this.createWallet('Marketplace Escrow');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 6: Fund escrow wallet
      onProgress('Funding Escrow Wallet...', 90);
      const escrowFunding = await this.fundWallet(escrow.publicKey);
      escrow.fundingTx = escrowFunding;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store accounts
      this.accounts = {
        buyer: {
          name: buyer.name,
          lei: buyer.lei,
          public: buyer.publicKey,
          secret: buyer.secretKey || null, // Smart contract has no secret key
          isSmartContract: buyer.isSmartContract || false,
          wallet: buyer.wallet || null, // PasskeyKit wallet instance (if smart contract)
          fundingTx: buyer.fundingTx
        },
        seller: {
          name: seller.name,
          lei: seller.lei,
          public: seller.publicKey,
          secret: seller.secretKey,
          fundingTx: seller.fundingTx
        },
        escrow: {
          name: escrow.name,
          public: escrow.publicKey,
          secret: escrow.secretKey,
          fundingTx: escrow.fundingTx
        }
      };
      
      this.initialized = true;
      onProgress('All Wallets Ready!', 100);
      
      console.log('✅ All wallets created and funded!');
      console.log('Accounts:', this.accounts);
      
      return this.accounts;
    } catch (error) {
      console.error('❌ Error initializing wallets:', error);
      throw error;
    }
  }

  /**
   * Get account balances
   */
  async getBalances() {
    const balances = {};
    
    for (const [role, account] of Object.entries(this.accounts)) {
      if (account?.public) {
        try {
          const accountData = await this.server.loadAccount(account.public);
          const xlmBalance = accountData.balances.find(b => b.asset_type === 'native');
          balances[role] = xlmBalance ? xlmBalance.balance : '0';
        } catch (error) {
          console.error(`Error loading balance for ${role}:`, error);
          balances[role] = '0';
        }
      }
    }
    
    return balances;
  }

  /**
   * Get stored accounts
   */
  getAccounts() {
    return this.accounts;
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Authenticate (WebAuthn if available, or just proceed with traditional wallets)
   */
  async authenticateWithBiometric() {
    console.log('🔐 Starting authentication...');
    
    // Try WebAuthn if passkey-kit is initialized
    if (this.usePasskeys && this.passkeyKit) {
      try {
        console.log('📝 Attempting WebAuthn smart contract wallet...');
        console.log('👆 Please authenticate with your device biometric (Touch ID/Face ID)');
        
        const newWallet = await this.passkeyKit.createWallet({
          name: 'Stellar Integra',
        });
        
        console.log('✅ Smart contract wallet created via WebAuthn!');
        console.log('🔑 Wallet Address:', newWallet.getPublicKey());
        
        this.passkeyWallet = newWallet;
        
        return {
          success: true,
          wallet: newWallet,
          publicKey: newWallet.getPublicKey(),
          isNew: true
        };
        
      } catch (error) {
        console.warn('⚠️ WebAuthn failed, falling back to traditional wallets:', error.message);
        this.usePasskeys = false;
      }
    }
    
    // Fallback: Use traditional Stellar keypairs
    console.log('💼 Using traditional Stellar keypairs (no biometric)');
    return {
      success: true,
      wallet: null,
      isSimulated: true
    };
  }
}

// Export singleton instance
const passkeyService = new PasskeyService();
export default passkeyService;

