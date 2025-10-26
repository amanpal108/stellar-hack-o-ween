# 🌟 Stellar Integra MVP

**Agent-driven buyer→seller trade flow with REAL Stellar Testnet transactions**

A hackathon-ready MVP demonstrating an automated trade flow orchestrated by intelligent agents, with **real XLM payments** and immutable document posting on Stellar Testnet. Every transaction is verifiable on-chain.

## 🔐 NEW: Biometric Login with Passkey-Kit

**One-Click Wallet Setup!** This project now features a beautiful biometric login system powered by Stellar's passkey-kit:

- 🔐 **Biometric Authentication**: Secure device-level authentication (simulated for testnet)
- ⚡ **Instant Setup**: All 3 wallets (Buyer, Seller, Escrow) created and funded in ~15 seconds
- 💰 **Auto-Funding**: Each wallet automatically receives 10,000 XLM from Friendbot
- 🎨 **Beautiful UI**: Modern gradient design with real-time progress tracking
- 🔒 **Secure Keys**: Local key generation with session-based management

**No more manual scripts!** Just click "Setup Account with Biometric" and you're ready to trade.

👉 **See [PASSKEY_LOGIN_GUIDE.md](./PASSKEY_LOGIN_GUIDE.md) for detailed documentation**

---

## 🎯 Overview

This project implements a complete B2B trade flow where AI agents handle search, validation, document generation, and payment settlement. All critical documents (Purchase Orders, Commercial Invoices, Warehouse Receipts) are posted to Stellar Testnet for transparency and immutability.

### Trade Flow

```
Buyer Prompt → Search Sellers → Validate vLEI → Generate PO (→ Stellar)
  → Fulfill Order (CI + WR → Stellar) → DvP Verification → Payment Release (→ Stellar)
```

### Anchor customer Testimonial on the POC this weekend on the need for verifiable partners, and efficient settlement for cash. 
https://www.youtube.com/watch?v=OS88ioujfqw

### GLEIF and vLEI Reseources

https://vlei.com/
https://www.gleif.org/en/lei-solutions/better-knowledge-better-business





https://github.com/amanpal108/stellar-hack-o-ween/blob/main/README.md


### Key Features

- ✅ **Biometric Passkey Login**: One-click wallet setup with automatic funding (NEW!)
- ✅ **7 Microservices**: Modular agent architecture with Express APIs
- ✅ **REAL Stellar Testnet Integration**: Live blockchain transactions with funded accounts
  - Real manageData operations for PO, CI, and WR documents
  - Real XLM payment settlement from Escrow to Seller
  - All transactions verifiable on Stellar Explorer
- ✅ **Multi-Agent Visualization**: TWO stunning views showing real-time agent communication
  - **Flow View**: Linear sequential diagram with animated data packets
  - **Network Graph**: Interactive topology with live communication overlay
  - **Full Payload Display**: See complete request/response bodies including keypairs and transaction data
- ✅ **vLEI Validation**: Entity verification using Legal Entity Identifiers
- ✅ **DvP Matching**: Delivery vs Payment verification before settlement
- ✅ **React Frontend**: Beautiful gradient UI with biometric authentication
- ✅ **End-to-End Demo**: Complete automation from prompt to on-chain payment in ~20 seconds
- ✅ **Jest Tests**: Unit and integration tests

---

## 📁 Repository Structure

```
stellar-hackathon/
├── services/               # 7 microservices
│   ├── buyer-agent/       # Initiates purchase, manages job state
│   ├── search-agent/      # Finds and ranks matching sellers
│   ├── validation-agent/  # Validates vLEI credentials
│   ├── po-agent/          # Generates PO, posts to Stellar
│   ├── fulfillment-agent/ # Generates CI & WR, posts to Stellar
│   ├── dvp-agent/         # Verifies document consistency
│   └── payment-agent/     # Releases payment on Stellar
├── client/                # React frontend
├── scripts/               # Utility scripts
│   ├── create_test_accounts.js
│   ├── fund_escrow.js
│   └── run_demo_e2e.js
├── mocks/                 # Mock data
│   ├── agent_registry.json
│   └── mock_vlei_responses.json
├── tests/                 # Jest tests
│   ├── unit.test.js
│   └── integration.test.js
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+ LTS)
- **npm** (v9+)
- Internet connection (for Stellar Testnet)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd stellar-hack-o-ween

# Install all dependencies
npm install
```

### Setup Stellar Test Accounts

```bash
# 1. Generate test keypairs
node scripts/create_test_accounts.js

# 2. Fund accounts via Stellar Friendbot
node scripts/fund_escrow.js
```

This creates three accounts:
- **Buyer** (Tommy Hilfiger)
- **Seller** (Jupiter Knitting)
- **Escrow** (Marketplace)

The keys are saved to `scripts/test_accounts.json` (do not commit to production!).

---

## 🎮 Running the Demo

### Option 1: Automated E2E Demo (Recommended)

```bash
# Terminal 1: Start all services
npm run start:all

# Terminal 2: Run the demo script
npm run demo
```

The demo script will:
1. Send a purchase request
2. Search and match sellers
3. Validate credentials
4. Generate PO and post to Stellar
5. Fulfill order (CI + WR) and post to Stellar
6. Verify DvP matching
7. Release payment on Stellar

You'll see colored output with Stellar transaction links!

### Option 2: Interactive Frontend

```bash
# Terminal 1: Start all services
npm run start:all

# Terminal 2: Start the React app
npm run client
```

Open `http://localhost:3000` in your browser.

1. Review the pre-filled prompt (or edit it)
2. Click **"Start Purchase"**
3. **Watch THREE real-time visualizations:**
   - **Top**: Flow or Network view showing active agents
   - **Bottom-right**: Communication Logger showing live API calls 🆕
4. **Toggle between Flow View and Network View** to see different perspectives
5. **Watch the Communication Logger** - see every request/response as it happens!
   - Agent-to-agent calls in blue/green
   - Stellar transactions in gold ⭐
6. See matched seller details
7. View timeline and Stellar transactions
8. Click Stellar transaction links to verify on-chain

**Pro Tips:** 
- The visualizations sync in real-time showing agent states AND actual API communication
- The Communication Logger can be collapsed by clicking the "−" button
- Stellar transactions are highlighted in gold - watch for them!

---

## 🧪 Running Tests

```bash
# Make sure services are running first
npm run start:all

# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration test
npm run test:integration
```

### Test Coverage

- **Unit Tests**: Search matching, validation, DvP verification logic
- **Integration Test**: Full end-to-end happy path with all 7 services

---

## 🔑 Service Endpoints

| Service | Port | Key Endpoints |
|---------|------|---------------|
| **buyer-agent** | 3001 | `POST /start`, `GET /status/:job_id` |
| **search-agent** | 3002 | `POST /search` |
| **validation-agent** | 3003 | `POST /validate`, `GET /check/:lei` |
| **po-agent** | 3004 | `POST /generate`, `GET /po/:po_id` |
| **fulfillment-agent** | 3005 | `POST /fulfill`, `GET /ci/:ci_id`, `GET /wr/:wr_id` |
| **dvp-agent** | 3006 | `POST /verify` |
| **payment-agent** | 3007 | `POST /release`, `POST /check-escrow` |

See individual service READMEs for detailed API documentation.

---

## 📊 Stellar Integration Details

### What Gets Posted to Stellar?

1. **Purchase Order (PO)**: SHA256 hash via `manageData` operation
2. **Commercial Invoice (CI)**: SHA256 hash via `manageData`
3. **Warehouse Receipt (WR)**: SHA256 hash via `manageData`
4. **Payment**: Native XLM payment transaction

### Transaction Format

```javascript
// Example: PO posting
Operation: manageData({
  name: "PO:<po_id>",
  value: Buffer.from(sha256_hash)
})
Memo: "PO:<po_id>"
```

### View Transactions

All transactions link to Stellar Expert:
```
https://stellar.expert/explorer/testnet/tx/<tx_hash>
```

### XLM Conversion

Fixed demo rate: **1 XLM = 0.5 USD**

Example: $900,000 order = 1,800,000 XLM

---

## 📋 Example Flow Data

### Purchase Prompt

```
Looking for 100,000 Men's T-shirts with South Indian Cultural Heritage Design 
made from Non Synthetic dye. Offer: 9 USD per t-shirt. Delivery: by 2025-11-30.
```

### Matched Seller

```json
{
  "agentID": "agent:jn-001",
  "name": "Jupiter Knitting",
  "lei": "3358004DXAMRWRUIYJ05",
  "description": "vLEI verified textile seller that can fulfill South Indian cultural heritage designs with Non synthetic natural dyes within 30 days",
  "confidence": 0.92
}
```

### Generated Documents

- **PO-{timestamp}.json** → services/po-agent/pos/
- **CI-{timestamp}.json** → services/fulfillment-agent/cis/
- **WR-{timestamp}.json** → services/fulfillment-agent/wrs/

---

## 🎓 30-Second Demo Script (for Judges)

```bash
# Setup (one time)
npm install
node scripts/create_test_accounts.js
node scripts/fund_escrow.js

# Demo
npm run start:all  # Terminal 1
npm run demo       # Terminal 2

# Or use the UI
npm run client     # Terminal 2
# Open http://localhost:3000 and click "Start Purchase"
```

**What You'll See:**
1. Purchase request parsed ✅
2. Seller matched (Jupiter Knitting, 92% confidence) ✅
3. vLEI validation passed ✅
4. PO generated and posted to Stellar ⭐
5. CI & WR generated and posted to Stellar ⭐
6. DvP verification: 6/6 checks passed ✅
7. Payment released on Stellar ⭐

**Stellar Transactions**: Click the explorer links to see on-chain proof!

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│   React UI with Multi-Agent Visualization   │
│   📊 Flow View  |  🕸️ Network View         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│        7 Microservices (Express)            │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐   │
│  │Buyer │→ │Search│→ │Valid.│→ │  PO  │   │
│  │ 🤵  │  │ 🔍  │  │ 🔐  │  │ 📝  │   │
│  └──────┘  └──────┘  └──────┘  └──┬───┘   │
│                                     │       │
│  ┌──────┐  ┌──────┐  ┌──────┐    │       │
│  │ Pay  │← │ DvP  │← │Fulfil│←───┘       │
│  │ 💰  │  │ ⚖️  │  │ 📦  │           │
│  └──┬───┘  └──────┘  └──┬───┘             │
└─────┼─────────────────────┼─────────────────┘
      │                     │
┌─────▼─────────────────────▼─────┐
│    Stellar Testnet Horizon       │
│   (manageData + Payment Ops) ⭐  │
└──────────────────────────────────┘
```

### Real-Time Visualization

The frontend features **THREE stunning visualization components** working in harmony:

1. **📊 Flow View**: Linear diagram showing sequential agent execution
   - Active agent pulses with glowing animation
   - Completed agents show green checkmarks
   - Data flows shown with animated arrows
   - Stellar badges appear when documents are posted on-chain

2. **🕸️ Network View**: Interactive graph showing agent relationships
   - Canvas-based rendering with smooth animations
   - Shows parallel operations (search + validation)
   - Particle effects for Stellar activity
   - Dynamic connection highlighting

3. **📡 Communication Logger** (Bottom-right panel): Real-time API monitor 🆕
   - Shows every agent-to-agent request/response
   - Color-coded: blue (request), green (response), gold (Stellar)
   - Timestamps and HTTP details (POST, status codes)
   - Scrollable history of last 50 communications
   - Collapsible for clean view
   - Demonstrates the **actual** inter-agent communication happening live!

**This is the key differentiator**: You don't just see agent states change - you see the actual HTTP requests flowing between them in real-time!

See `VISUALIZATION_GUIDE.md` for detailed documentation.

### Data Flow

1. **Buyer Agent**: Parses natural language prompt
2. **Search Agent**: Keyword matching + ranking
3. **Validation Agent**: Mock vLEI registry lookup
4. **PO Agent**: Generates PO JSON, posts hash to Stellar
5. **Fulfillment Agent**: Generates CI + WR, posts to Stellar
6. **DvP Agent**: Verifies PO ↔ CI ↔ WR consistency
7. **Payment Agent**: Executes XLM payment transaction

---

## 📦 Document Schemas

### Purchase Order (PO)

```json
{
  "po_id": "PO-1234567890",
  "created_at": "2025-10-25T12:00:00Z",
  "buyer": {
    "name": "Tommy Hilfiger",
    "lei": "54930012QJWZMYHNJW95",
    "account": "GXXXXX..."
  },
  "seller": {
    "name": "Jupiter Knitting",
    "lei": "3358004DXAMRWRUIYJ05",
    "account": "GDXXXXX..."
  },
  "line_items": [
    {
      "description": "Men's T-shirts...",
      "quantity": 100000,
      "unit_price_usd": 9,
      "total_usd": 900000
    }
  ],
  "total_usd": 900000,
  "total_xlm": "1800000.0000000",
  "delivery_date": "2025-11-30",
  "status": "issued",
  "signature_buyer": "<base64>",
  "signature_seller": "<base64>"
}
```

### Commercial Invoice (CI)

Similar to PO with `ci_id`, `po_id` reference, and `payment_terms`.

### Warehouse Receipt (WR)

```json
{
  "wr_id": "WR-1234567890",
  "po_id": "PO-1234567890",
  "ci_id": "CI-1234567890",
  "warehouse": {
    "name": "Chennai Port Warehouse",
    "location": "Chennai, India"
  },
  "goods": [
    {
      "description": "Men's T-shirts...",
      "quantity": 100000,
      "condition": "new"
    }
  ],
  "status": "stored"
}
```

---

## 🔒 Security Notes

- **Test Accounts Only**: Never use these patterns in production
- **Mock Signatures**: Real implementation should use ED25519 signatures
- **vLEI**: Mock registry; production would query GLEIF API
- **Escrow**: Simplified single-account model for demo

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check if ports are already in use
lsof -i :3001-3007

# Kill existing processes
pkill -f "node services"
```

### Stellar transactions fail

```bash
# Check if escrow is funded
node -e "console.log(require('./scripts/test_accounts.json').escrow.public)"

# Fund manually via Friendbot
# https://friendbot.stellar.org?addr=<PUBLIC_KEY>
```

### Tests fail

```bash
# Ensure all services are running
npm run start:all

# Wait 5 seconds for services to initialize
sleep 5 && npm test
```

---

## 🎨 Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React 18 (CRA)
- **Blockchain**: Stellar SDK 11.x
- **Testing**: Jest 29
- **Styling**: Pure CSS (no frameworks)

---

## 📈 Future Enhancements

- [ ] Real vLEI integration with GLEIF
- [ ] Multi-signature escrow with time locks
- [ ] IPFS for full document storage
- [ ] WebSocket for real-time updates
- [ ] Kubernetes deployment configs
- [ ] GraphQL API layer
- [ ] Machine learning for better seller matching

---

## 🤝 Contributing

This is a hackathon MVP. For production use:
1. Implement proper key management (HSM/KMS)
2. Add authentication & authorization
3. Use persistent database (PostgreSQL)
4. Implement proper error handling & retries
5. Add comprehensive logging (Winston/Bunyan)
6. Set up CI/CD pipeline

---

## 📄 License

MIT License - feel free to use for hackathons, demos, and learning!

---

## 👥 Team

Built for the Stellar Hackathon 2025 🌟

---

---

## 🎥 Demo

Check out the live demo video here: [Watch Demo]((https://www.loom.com/share/a14cceb9357a4d3a98b06d53c70d81af))


---

---

## 👥 Pick deck 

Link: https://www.canva.com/design/DAG25s_Eoew/DJ0hLZFnydk2cyvsClOb1Q/view?utm_content=DAG25s_Eoew&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h38a4c7d4cc
Appendix: [https://www.canva.com/design/DAG25s_Eoew/HZPgNG93UaL0WON77F-MkQ/edit](https://northeastern-my.sharepoint.com/:p:/r/personal/gupta_pankh_northeastern_edu/_layouts/15/Doc.aspx?sourcedoc=%7BB97793CD-3ED3-4116-ABDA-90BCF61FCF51%7D&file=StellarIntegraV2%201.pptx&action=edit&mobileredirect=true&DefaultItemOpen=1&wdOrigin=APPHOME-WEB.DIRECT%2CAPPHOME-WEB.JUMPBACKIN&wdPreviousSession=d2e5ed13-9fb8-49f5-8111-f5d2c7746bf0&wdPreviousSessionSrc=AppHomeWeb&ct=1761495921566)

---

## 🔗 Quick Links

- [Stellar Testnet Explorer](https://stellar.expert/explorer/testnet)
- [Stellar SDK Docs](https://stellar.github.io/js-stellar-sdk/)
- [GLEIF vLEI](https://www.gleif.org/en/vlei/introducing-the-verifiable-lei-vlei)
- [Friendbot (Testnet Faucet)](https://friendbot.stellar.org)

---

**Happy Trading! 🚀✨**

