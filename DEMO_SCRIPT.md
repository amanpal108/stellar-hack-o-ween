# 🎬 Demo Script for Judges (60 seconds)

## Setup (Pre-demo, ~2 minutes)

```bash
# Clone and install
git clone <repo-url>
cd stellar-hackathon
npm install

# Create and fund test accounts
node scripts/create_test_accounts.js
node scripts/fund_escrow.js

# Start all services (in background or separate terminal)
npm run start:all
```

---

## Demo Flow (60 seconds)

### Option A: Automated CLI Demo (Recommended for Speed)

**Terminal Command:**
```bash
npm run demo
```

**What to Say:**

> "I'll now run our end-to-end demo that orchestrates 7 AI agents to complete a B2B trade on Stellar testnet."

**[Run command - takes ~20 seconds]**

**Point out as it runs:**

1. **"The buyer agent parses a natural language prompt"** → Show parsed JSON
2. **"Search agent matches sellers from our registry"** → Jupiter Knitting at 92% confidence
3. **"Validation agent verifies vLEI credentials"** → Both parties validated
4. **"PO agent generates the purchase order and posts to Stellar"** → Point to Stellar TX URL
5. **"Fulfillment agent creates Commercial Invoice and Warehouse Receipt, both on-chain"** → 2 more Stellar TXs
6. **"DvP agent verifies all documents match exactly"** → 6/6 checks passed
7. **"Payment agent releases $900k from escrow to seller"** → Final Stellar payment TX

**Show the summary:**
> "All four Stellar transactions are live on testnet - click any link to verify on Stellar Explorer."

---

### Option B: Visual UI Demo (Best for Impact) ⭐ RECOMMENDED

**Browser:** `http://localhost:3000`

**What to Say:**

> "Let me show you our multi-agent visualization system. We've built two views to show how agents coordinate in real-time."

**Actions:**

1. **Show the pre-filled prompt** (read the first line):
   - "Looking for 100,000 Men's T-shirts with South Indian Cultural Heritage Design..."

2. **Click "Start Purchase"** button

3. **🎬 HIGHLIGHT THE VISUALIZATION** (~20 seconds):
   
   **Flow View (Default):**
   - "Watch as each agent lights up in sequence..."
   - **Point to glowing agent**: "See how the active agent pulses with this animation?"
   - **Point to checkmarks**: "Green checkmarks appear as each agent completes"
   - **Point to arrows**: "These animated arrows show data flowing between agents"
   - **Point to Stellar badges**: "Golden badges appear when documents hit the blockchain"
   
   **Toggle to Network View:**
   - Click "🕸️ Network View" button
   - "This shows the same process as a network graph"
   - **Point to connections**: "See how search and validation run in parallel?"
   - **Point to particles**: "These floating stars indicate Stellar blockchain activity"
   - **Point to node**: "The active agent glows and pulses in real-time"

4. **Show matched seller:**
   - **Matched Seller Card appears**: "Jupiter Knitting matched with 92% confidence"
   - "The system found the perfect seller based on requirements"

5. **Show timeline:**
   - **Timeline populates**: "Each step is tracked with timestamps"
   - "You can see the complete audit trail"

6. **Show Stellar transactions:**
   - **Stellar Transactions appear**: "Here are the four on-chain transactions"
   - **Click a Stellar transaction link**: "This opens Stellar Explorer"
   - Point out the `manageData` operation with the document hash

7. **Show final state:**
   - "Trade complete in under 25 seconds"
   - "All seven agents coordinated seamlessly"
   - "Four blockchain transactions, all verifiable"

**Key Talking Points:**

> "The visualization isn't just pretty—it helps users understand what's happening. In a production system, this builds trust and transparency. You can see exactly which agent is processing, when documents hit the blockchain, and the complete flow of data."

---

## Key Points to Emphasize

### 1. Multi-Agent Visualization (10s) ⭐ NEW!
- "Two visualization modes - Flow View and Network View"
- "Real-time animations show which agent is processing"
- "You can literally see the agents communicating"
- "Stellar badges appear when documents hit the blockchain"
- "This makes a complex system understandable at a glance"

### 2. Multi-Agent Orchestration (5s)
- "Seven specialized microservices working together"
- "Each agent has a single responsibility - search, validation, payment, etc."
- "The visualization shows both sequential and parallel operations"

### 3. Stellar Integration (10s)
- "Four transactions on Stellar Testnet"
- "PO, CI, and WR stored as SHA256 hashes using manageData"
- "Final payment is a real XLM transfer from escrow to seller"
- "Everything is verifiable and immutable"

### 3. DvP Verification (5s)
- "Before releasing payment, we verify delivery documents match the order exactly"
- "Quantity, price, parties - everything must match"
- "Only after 6/6 checks pass does payment release"

### 4. vLEI Compliance (5s)
- "Both parties validated using Legal Entity Identifiers"
- "Tommy Hilfiger and Jupiter Knitting verified via mock vLEI registry"

---

## Q&A Preparation

### "How does this scale?"
> "Each agent is a stateless microservice. We can horizontally scale any bottleneck. Stellar handles transaction finality in 5 seconds."

### "What about real-world data?"
> "We use mock vLEI for the demo, but the architecture supports GLEIF API integration. Same for Google A2A or NANDA registry."

### "Why Stellar?"
> "Fast finality, low fees, built-in multi-signature support, and excellent SDK. Perfect for trade finance settlement."

### "What about privacy?"
> "We post hashes, not full documents. The actual PO/CI/WR can be shared off-chain via IPFS or encrypted channels. Stellar just proves existence and timestamp."

### "Production readiness?"
> "This is an MVP. For production: add key management (HSM), persistent DB, real signatures, auth, monitoring, and K8s deployment. But the core flow is production-viable."

---

## Backup: Manual Service Test

If services crash during demo:

```bash
# Quick health check
curl http://localhost:3001 http://localhost:3002 http://localhost:3003

# Restart services
pkill -f "node services"
npm run start:all

# Test search directly
curl -X POST http://localhost:3002/search \
  -H "Content-Type: application/json" \
  -d '{"product":"T-shirts","quantity":100000,"requirements":["non synthetic"]}'
```

---

## Stellar Explorer Navigation

When showing transactions:

1. **Point out the "Operations" tab** → Shows manageData or payment
2. **Point out the "Memo"** → Contains PO/CI/WR ID
3. **Point out the timestamp** → Immutable proof of when it happened
4. **For payment tx** → Show source (escrow) and destination (seller)

---

## Closing Statement (15s)

> "This demo shows how AI agents can orchestrate complex B2B trades with blockchain settlement. What makes it special is the real-time visualization—you can actually see the agents working together. Every step is automated, verified, and recorded on-chain. The Flow View shows the process, the Network View shows the architecture. Both update in real-time with beautiful animations. This is the future of trade finance - fast, transparent, trustless, and understandable."

**Bonus Line:**
> "And yes, those are real Stellar Testnet transactions. Click any link to verify on-chain. The visualization isn't mocked—it's showing actual agent activity as they communicate."

**Thank the judges and open for questions!** 🎉

---

## Quick Demo Flow (30 seconds)

1. Open UI → "Two visualization modes"
2. Start Purchase → "Watch Flow View"
3. Toggle to Network → "Same data, different perspective"  
4. Point to Stellar badges → "Real blockchain transactions"
5. Show final state → "Complete in 25 seconds"
6. **Mic drop** 🎤

