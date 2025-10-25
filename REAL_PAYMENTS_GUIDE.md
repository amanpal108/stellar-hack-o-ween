# 🚀 Real Stellar Testnet Payments Integration

## Overview

This system now uses **REAL Stellar Testnet accounts** with **REAL transactions** posted to the Stellar blockchain. All manageData operations (PO, CI, WR) and XLM payments are executed on-chain and can be verified on Stellar's testnet explorer.

---

## 🔑 Test Accounts

The system uses three funded Stellar Testnet accounts:

### 1. Buyer Account (Tommy Hilfiger)
- **LEI**: `5493001KJTIIGC8Y1R12`
- **Public Key**: `GBVEGEGHFCGQ5FAJZ72ROXQDP7IGSXJNS7FUJ7Y25CJ7JFBUKFUMHRYP`
- **Secret Key**: `SBWYF5JWAOKS752NH2VU4K2NXMZJGFOD3FS34JVECNDZQYEWWWWE4FUV`
- **Role**: Initiates purchase orders

### 2. Seller Account (Jupiter Knitting)
- **LEI**: `5493001XJUPITER0001`
- **Public Key**: `GBPFMDZ5VNL56YNMXOQ35RUFRS3S6LZN66SB2OYOQXHK3X46UGTBJBBP`
- **Secret Key**: `SA3RAY6RIK7X6WX6ORPWQF62LNJ3HLYYTKA3UYEXYTQW47J6KYFUWP4K`
- **Role**: Posts CI/WR documents, receives payment

### 3. Escrow Account (Marketplace Escrow)
- **Public Key**: `GB27XHTEUUQRJZQP5TIVMP6SOW7VSVYCNZD5OYD3NO2U2UL6VV3CW245`
- **Secret Key**: `SC54WRDKCEOHY5FWEAHTUO63XXBKIT3OPYIFD3OVURHU6KTJHSHHFTLK`
- **Role**: Posts PO documents, releases payment after DvP verification

**Security Note**: These keys are for Stellar Testnet demonstration purposes only. Never use testnet keys on mainnet or commit production keys to source control.

---

## 🔗 On-Chain Operations

### 1. Purchase Order (PO) - manageData Operation
**Agent**: PO Agent  
**Account**: Escrow Account  
**Operation**: Stores SHA256 hash of PO document on-chain  
**Stellar Operation**: `manageData(key: "PO:{id}", value: "{sha256_hash}")`

### 2. Commercial Invoice (CI) - manageData Operation
**Agent**: Fulfillment Agent  
**Account**: Seller Account  
**Operation**: Stores SHA256 hash of CI document on-chain  
**Stellar Operation**: `manageData(key: "CI:{id}", value: "{sha256_hash}")`

### 3. Warehouse Receipt (WR) - manageData Operation
**Agent**: Fulfillment Agent  
**Account**: Seller Account  
**Operation**: Stores SHA256 hash of WR document on-chain  
**Stellar Operation**: `manageData(key: "WR:{id}", value: "{sha256_hash}")`

### 4. XLM Payment - Payment Operation
**Agent**: Payment Agent  
**From**: Escrow Account  
**To**: Seller Account  
**Amount**: Total order value in XLM (calculated from USD at ~$0.10/XLM)  
**Stellar Operation**: `payment(destination: seller, asset: XLM, amount: total_xlm)`

---

## 📊 Real-Time Communication Visualization

### What's New
The UI now displays **full request/response payloads** for every agent-to-agent interaction, including:

#### Request Data Shows:
- From/To agents
- HTTP method and endpoint
- **Complete request payload** (buyer info, seller info, order details, keypairs, etc.)
- Timestamp

#### Response Data Shows:
- From/To agents
- HTTP status code
- Success/error message
- **Complete response data** (IDs, transaction hashes, verification results, etc.)
- Timestamp

#### Stellar Transaction Data Shows:
- Operation type (manageData or payment)
- Account public keys
- Transaction hash
- Explorer URL
- Asset and amount (for payments)

### Visualization Modes

#### 1. Flow View (Linear)
- Shows agents in left-to-right sequence
- Animated data packets flow between agents
- Communication details panel below the flow
- Displays latest request/response with full JSON payload
- **Minimal dark UI** with compact cards

#### 2. Network View (Graph)
- Canvas-based circular network graph
- Real-time animated connections with data packets
- Floating info box in top-right corner
- Shows latest communication with full payload
- Stellar transactions highlighted with star particles

---

## 🎯 Demo Flow with Real Payments

### Step-by-Step Process

1. **UI → Buyer Agent**
   - **Request**: POST /start with buyer credentials and prompt
   - **Payload**: `{ buyer_name, buyer_lei, buyer_account, prompt_text }`
   - **Response**: `{ job_id, parsed_request }`

2. **Buyer Agent → Search Agent**
   - **Request**: POST /search with product requirements
   - **Payload**: `{ product, quantity, requirements }`
   - **Response**: `{ sellers: [...], confidence_scores }`

3. **Buyer Agent → Validation Agent**
   - **Request**: POST /validate with LEIs
   - **Payload**: `{ buyer_lei, seller_lei }`
   - **Response**: `{ valid: true, buyer: {...}, seller: {...} }`

4. **Buyer Agent → PO Agent** ⭐ **REAL STELLAR TX**
   - **Request**: POST /generate with full order details + **REAL ESCROW KEYPAIR**
   - **Payload**: 
     ```json
     {
       "buyer": { "name", "lei", "account" },
       "seller": { "name", "lei", "account" },
       "order": { "product", "quantity", "unit_price_usd", ... },
       "escrow_keypair": {
         "public": "GB27XH...",
         "secret": "SC54WR..." // REAL SECRET KEY
       }
     }
     ```
   - **Response**: `{ po_id, po_tx_id, stellar_explorer_url, total_xlm }`
   - **On-Chain**: PO hash stored under escrow account

5. **PO Agent → Stellar Testnet** ⭐ **manageData(PO)**
   - **Transaction**: `manageData` operation from Escrow Account
   - **Data**: `PO:{id} = {sha256_hash}`
   - **Result**: TX hash visible on Stellar Explorer

6. **PO Agent → Fulfillment Agent** ⭐ **REAL STELLAR TXs**
   - **Request**: POST /fulfill with PO + **REAL SELLER KEYPAIR**
   - **Payload**:
     ```json
     {
       "po": { ... },
       "seller_keypair": {
         "public": "GBPFMDZ...",
         "secret": "SA3RAY6..." // REAL SECRET KEY
       }
     }
     ```
   - **Response**: `{ ci_id, ci_tx_id, wr_id, wr_tx_id, stellar_urls }`
   - **On-Chain**: CI and WR hashes stored under seller account

7. **Fulfillment Agent → Stellar Testnet** ⭐ **manageData(CI) & manageData(WR)**
   - **Transactions**: Two `manageData` operations from Seller Account
   - **Data**: 
     - `CI:{id} = {ci_hash}`
     - `WR:{id} = {wr_hash}`
   - **Result**: TX hashes visible on Stellar Explorer

8. **Fulfillment Agent → DvP Agent**
   - **Request**: POST /verify with PO, CI, WR documents
   - **Payload**: `{ po: {...}, ci: {...}, wr: {...} }`
   - **Response**: `{ match: true, checks: [6 verification results] }`
   - **Verification**: SHA256 hashes, amounts, quantities, dates, etc.

9. **DvP Agent → Payment Agent** ⭐ **REAL STELLAR PAYMENT TX**
   - **Request**: POST /release with DvP report + **REAL ESCROW KEYPAIR**
   - **Payload**:
     ```json
     {
       "po": { ... },
       "dvp_report": { match: true, ... },
       "escrow_keypair": {
         "public": "GB27XH...",
         "secret": "SC54WR..." // REAL SECRET KEY
       }
     }
     ```
   - **Response**: `{ payment_id, payment_tx_id, stellar_explorer_url, status }`
   - **On-Chain**: XLM payment from Escrow to Seller

10. **Payment Agent → Stellar Testnet** ⭐ **payment(XLM)**
    - **Transaction**: `payment` operation from Escrow to Seller
    - **Asset**: XLM (native)
    - **Amount**: Total order value in XLM
    - **Result**: Settlement COMPLETED, TX hash visible on Stellar Explorer

---

## 🧪 Testing with Real Payments

### Prerequisites
```bash
# 1. Install dependencies
npm install

# 2. Create and fund test accounts (if not already done)
node scripts/create_test_accounts.js
node scripts/fund_escrow.js

# The accounts are already created and funded:
# - Buyer: GBVEGE... (10,000 XLM)
# - Seller: GBPFMD... (10,000 XLM)
# - Escrow: GB27XH... (10,000 XLM)
```

### Start the System
```bash
# Terminal 1: Start all microservices
npm run services

# Terminal 2: Start React frontend
cd client && npm start

# The browser will open at http://localhost:3000
```

### Run the Demo
1. **Enter a prompt** (default is pre-filled):
   ```
   Looking for 100,000 Men's T-shirts with South Indian Cultural Heritage Design 
   made from Non Synthetic dye. Offer: 9 USD per t-shirt. Delivery: by 2025-11-30.
   ```

2. **Click "Start Purchase"** and watch:
   - Real-time agent communication with full payloads
   - Animated data packets flowing between agents
   - Stellar transactions being posted to testnet
   - Payment settlement completing on-chain

3. **Toggle between views**:
   - **Flow View**: Linear sequence with detailed payload panel
   - **Network View**: Graph visualization with floating info box

4. **Inspect communications**:
   - Request payloads show what data is sent (including keypairs in use)
   - Response payloads show transaction hashes and results
   - Stellar operations show on-chain details

### Verify On-Chain
After the demo completes, verify transactions on Stellar:

1. **Escrow Account** (PO + Payment):
   ```
   https://stellar.expert/explorer/testnet/account/GB27XHTEUUQRJZQP5TIVMP6SOW7VSVYCNZD5OYD3NO2U2UL6VV3CW245
   ```
   - Check `manageData` entry for PO hash
   - Check `payment` operation sending XLM to seller

2. **Seller Account** (CI + WR + Received Payment):
   ```
   https://stellar.expert/explorer/testnet/account/GBPFMDZ5VNL56YNMXOQ35RUFRS3S6LZN66SB2OYOQXHK3X46UGTBJBBP
   ```
   - Check `manageData` entries for CI and WR hashes
   - Check `payment` operation receiving XLM from escrow

3. **Individual Transactions**:
   - Copy any TX hash from the UI communication logs
   - Visit: `https://stellar.expert/explorer/testnet/tx/{TX_HASH}`

---

## 💡 Key Improvements

### Real vs. Simulated
**Before**: Mock transactions, no blockchain interaction, dummy keys  
**After**: Real Stellar transactions, on-chain settlement, funded testnet accounts

### Communication Transparency
**Before**: Only showed agent names and endpoints  
**After**: Full request/response bodies, transaction details, keypairs in use

### Payment Proof
**Before**: "Payment released" message  
**After**: Real XLM transfer with TX hash and explorer link

### Document Integrity
**Before**: Hashes calculated but not stored  
**After**: SHA256 hashes posted on-chain via `manageData`

---

## 🔒 Security Considerations

### In Demo (Current)
- ✅ Testnet accounts with test XLM (no real value)
- ✅ Secret keys hardcoded for demo purposes
- ✅ All transactions visible on public testnet
- ✅ Using real Stellar SDK and API

### For Production
- ❌ **NEVER hardcode secret keys**
- ✅ Use secure key management (HSM, KMS, or secure enclave)
- ✅ Implement proper authentication and authorization
- ✅ Use Stellar mainnet accounts
- ✅ Implement rate limiting and monitoring
- ✅ Add transaction signing via user wallets (e.g., Freighter, Albedo)
- ✅ Implement multi-signature escrow for larger amounts

---

## 📝 Transaction Cost

Each demo run creates:
- **3 manageData operations**: ~0.00003 XLM each
- **1 payment operation**: ~0.00001 XLM base fee
- **Total cost per demo**: ~0.0001 XLM (~$0.00001 USD)

With 10,000 XLM per account, you can run **~100,000 demos** before needing to refund.

---

## 🎬 Demo Script for Judges

### Opening (30 seconds)
"We've built a fully autonomous multi-agent system for global trade finance, with **real settlement on Stellar Testnet**. Watch as seven AI agents orchestrate a $900,000 international purchase order, with every step—validation, document posting, and payment—recorded on the Stellar blockchain."

### The Flow (2 minutes)
1. "I enter a natural language prompt describing what I want to buy"
2. "The Buyer Agent parses it and calls the Search Agent to find sellers"
3. "Validation Agent checks vLEI credentials for both parties"
4. "PO Agent generates a purchase order and **posts its hash to Stellar** using the Escrow account's real keypair"
5. "You can see the transaction hash appear instantly—this is a **real Stellar transaction**"
6. "Fulfillment Agent creates the Commercial Invoice and Warehouse Receipt, **posting both to Stellar** from the Seller's account"
7. "DvP Agent verifies all documents match—quantities, amounts, dates, and hashes"
8. "Payment Agent releases **real XLM from Escrow to Seller**—another live blockchain transaction"
9. "The entire flow completes in seconds, with all steps transparent and verifiable"

### Visualization (30 seconds)
"Notice the real-time communication logger—every request shows the **full payload**, including which accounts are signing transactions. Toggle to Network View to see the agent interaction graph with live data packets flowing between nodes."

### Verification (30 seconds)
"Click any transaction hash to see it on Stellar's testnet explorer. The PO, CI, and WR hashes are stored on-chain. The payment is a real XLM transfer. Everything is auditable and immutable."

### Closing (30 seconds)
"This is a complete, end-to-end demonstration of autonomous agents conducting international trade with blockchain settlement. It's real code, real transactions, and a real glimpse of how global commerce can be automated with trust and transparency."

---

## 🚀 Next Steps

### Immediate Enhancements
- [ ] Add transaction failure handling and retry logic
- [ ] Implement multi-signature escrow for higher value trades
- [ ] Add memo fields to payment operations for reference IDs
- [ ] Create transaction history dashboard with all past trades

### Production Readiness
- [ ] Migrate to Stellar mainnet accounts
- [ ] Implement secure key management (KMS/HSM)
- [ ] Add user authentication with Stellar wallet integration
- [ ] Deploy microservices to Kubernetes cluster
- [ ] Set up monitoring and alerting for failed transactions
- [ ] Add comprehensive error handling and rollback mechanisms

### Advanced Features
- [ ] Support for custom Stellar assets (tokenized fiat, stablecoins)
- [ ] Path payment operations for multi-currency settlement
- [ ] Smart contract integration with Soroban
- [ ] Atomic swap support for complex trade flows
- [ ] Real-time exchange rate integration for USD/XLM conversion

---

## 📚 Additional Resources

- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Testnet Explorer](https://stellar.expert/explorer/testnet)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Friendbot (Testnet Faucet)](https://laboratory.stellar.org/#account-creator?network=test)

---

## ✅ Summary

This system now provides:
- ✅ Real Stellar testnet integration with funded accounts
- ✅ On-chain PO, CI, and WR document hash posting
- ✅ Real XLM payment settlement via blockchain
- ✅ Complete request/response transparency in UI
- ✅ Full transaction verification via Stellar Explorer
- ✅ Minimal, modern dark-themed UI
- ✅ Two visualization modes (Flow + Network)
- ✅ Ready for hackathon demo with judges

**Total demo time**: ~15-20 seconds for full end-to-end flow  
**Blockchain transactions**: 4 real txs per demo (3 manageData + 1 payment)  
**Verifiability**: 100% transparent and auditable on Stellar testnet

