# Service Mapping & Responsibilities

## Service Overview

| Service | Port | Primary Responsibility | Key Technologies |
|---------|------|----------------------|------------------|
| **buyer-agent** | 3001 | Parse buyer prompts, manage job lifecycle | Express, NLP parsing |
| **search-agent** | 3002 | Match and rank sellers from registry | Express, keyword matching |
| **validation-agent** | 3003 | Verify vLEI credentials | Express, mock vLEI registry |
| **po-agent** | 3004 | Generate PO, post to Stellar | Express, stellar-sdk, crypto |
| **fulfillment-agent** | 3005 | Generate CI & WR, post to Stellar | Express, stellar-sdk, crypto |
| **dvp-agent** | 3006 | Verify document consistency | Express, validation logic |
| **payment-agent** | 3007 | Release escrow payment on Stellar | Express, stellar-sdk |

---

## Service Dependencies

```
buyer-agent (3001)
    ↓ calls
search-agent (3002)
    ↓ calls
validation-agent (3003)
    ↓ calls
po-agent (3004) ──→ Stellar Testnet
    ↓ calls
fulfillment-agent (3005) ──→ Stellar Testnet
    ↓ calls
dvp-agent (3006)
    ↓ calls
payment-agent (3007) ──→ Stellar Testnet
```

---

## Endpoint Details

### buyer-agent (3001)

**POST /start**
- Input: Purchase prompt + buyer details
- Output: Job ID + parsed request
- Action: Initiates trade flow

**GET /status/:job_id**
- Input: Job ID
- Output: Current job state + timeline
- Action: Query job status

**POST /update/:job_id**
- Input: Job ID + updates
- Output: Updated job
- Action: Internal state management

---

### search-agent (3002)

**POST /search**
- Input: Product, quantity, requirements
- Output: Ranked array of sellers
- Action: Searches agent registry, ranks by confidence
- Algorithm: Keyword matching + capability check

---

### validation-agent (3003)

**POST /validate**
- Input: Buyer LEI + Seller LEI
- Output: Validation result for both parties
- Action: Checks mock vLEI registry
- Checks: Status, expiration, verification

**GET /check/:lei**
- Input: Single LEI
- Output: Validation result
- Action: Quick LEI check

---

### po-agent (3004)

**POST /generate**
- Input: Buyer, seller, order details, escrow keypair
- Output: PO JSON + Stellar TX ID
- Action: 
  1. Generate structured PO
  2. Calculate USD → XLM conversion
  3. Compute SHA256 hash
  4. Post via manageData operation
  5. Save PO to file
- Stellar: `manageData(PO:<id>, hash)` + memo

**GET /po/:po_id**
- Input: PO ID
- Output: Full PO JSON
- Action: Retrieve PO

---

### fulfillment-agent (3005)

**POST /fulfill**
- Input: PO + seller keypair
- Output: CI + WR JSONs + Stellar TX IDs
- Action:
  1. Generate CI from PO
  2. Generate WR with warehouse info
  3. Post both to Stellar
  4. Save to files
- Stellar: Two transactions (CI, WR)

**GET /ci/:ci_id**
- Input: CI ID
- Output: Commercial Invoice JSON

**GET /wr/:wr_id**
- Input: WR ID
- Output: Warehouse Receipt JSON

---

### dvp-agent (3006)

**POST /verify**
- Input: PO, CI, WR
- Output: Match boolean + detailed report
- Action: Runs 6 verification checks
- Checks:
  1. PO ID linkage
  2. Total amount match
  3. Quantity consistency
  4. Unit price exact match
  5. Party LEI consistency
  6. Document status validation

---

### payment-agent (3007)

**POST /release**
- Input: PO, DvP report, escrow keypair
- Output: Payment record + Stellar TX ID
- Action:
  1. Verify DvP passed
  2. Create payment transaction
  3. Send XLM from escrow to seller
  4. Record payment
- Stellar: Payment operation with memo

**POST /check-escrow**
- Input: Escrow public key
- Output: Balance + funded status
- Action: Queries Stellar for account balance

**GET /payment/:payment_id**
- Input: Payment ID
- Output: Payment record

---

## Data Formats

### Job State (buyer-agent)
```json
{
  "job_id": "job_1234567890",
  "buyer_name": "Tommy Hilfiger",
  "buyer_lei": "5493001KJTIIGC8Y1R12",
  "stage": "initiated",
  "parsed_request": { ... },
  "timeline": [
    { "stage": "initiated", "timestamp": "..." }
  ]
}
```

### Seller Ranking (search-agent)
```json
{
  "agentID": "agent:jn-001",
  "name": "Jupiter Knitting",
  "confidence": 0.92,
  "matches": ["keyword:textile", "requirement:non synthetic"],
  "capabilities": { ... }
}
```

### Validation Result (validation-agent)
```json
{
  "valid": true,
  "buyer": {
    "lei": "...",
    "valid": true,
    "entity_name": "Tommy Hilfiger Corporation"
  },
  "seller": { ... }
}
```

### DvP Report (dvp-agent)
```json
{
  "match": true,
  "checks": [
    { "name": "po_id_linkage", "passed": true, "details": "..." },
    { "name": "total_amount", "passed": true, "details": "..." }
  ],
  "errors": [],
  "summary": "6/6 checks passed"
}
```

---

## Stellar Operations

### Document Posting (PO, CI, WR)

```javascript
Operation.manageData({
  name: "PO:<po_id>",  // Max 64 bytes
  value: Buffer.from(sha256_hash)  // Max 64 bytes
})
Memo: "PO:<po_id>"
```

### Payment Release

```javascript
Operation.payment({
  destination: seller_account,
  asset: Asset.native(),  // XLM
  amount: total_xlm
})
Memo: "Payment:<po_id>"
```

---

## Error Handling

### Common Error Responses

- **400 Bad Request**: Invalid input, DvP failed
- **404 Not Found**: Job/PO/CI/WR not found
- **500 Internal Server Error**: Service error, Stellar error

### Stellar Error Handling

All Stellar-posting services catch errors and:
1. Log the error
2. Continue execution (for demo)
3. Return null TX ID if failed
4. Include error in response

---

## Configuration

### Ports
Defined in each service's `index.js`:
- Default: 3001-3007 (consecutive)
- Configurable via environment variables (future)

### Stellar Network
- Network: `StellarSdk.Networks.TESTNET`
- Horizon: `https://horizon-testnet.stellar.org`
- Explorer: `https://stellar.expert/explorer/testnet`

### XLM Conversion Rate
- Fixed: **1 XLM = 0.5 USD**
- Location: `services/po-agent/index.js`
- Formula: `total_xlm = total_usd / xlm_rate`

---

## Testing Strategy

### Unit Tests
- Search matching algorithm
- Validation logic
- DvP verification rules
- Mock data consistency

### Integration Test
- Full E2E flow
- All 7 services
- Mock Stellar mode
- Data consistency checks

### Manual Testing
- Run demo script
- Use React UI
- Check Stellar Explorer
- Verify timeline

---

## Deployment Notes

### Development
```bash
npm run start:all  # Runs all 7 services with concurrently
```

### Production Considerations
- Use process manager (PM2)
- Implement health checks
- Add load balancing
- Use environment variables for config
- Implement proper logging
- Add monitoring (Prometheus/Grafana)

### Kubernetes (Future)
- One deployment per service
- Service discovery via DNS
- ConfigMaps for configuration
- Secrets for keypairs
- Horizontal pod autoscaling

---

## Performance

### Latency (Approximate)
- buyer-agent: ~50ms (parsing)
- search-agent: ~30ms (in-memory search)
- validation-agent: ~20ms (mock lookup)
- po-agent: ~5s (Stellar submit)
- fulfillment-agent: ~10s (2 Stellar txs)
- dvp-agent: ~100ms (verification)
- payment-agent: ~5s (Stellar payment)

**Total E2E**: ~20-25 seconds

### Bottlenecks
1. Stellar transaction submission (~5s each)
2. Sequential service calls (future: parallelize where possible)

### Optimization Ideas
- Batch Stellar operations
- Cache validation results
- Parallel document posting
- WebSocket for real-time updates

