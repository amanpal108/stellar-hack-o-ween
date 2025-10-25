# DvP (Delivery vs Payment) Agent

## Overview
The DvP Agent verifies that the Purchase Order, Commercial Invoice, and Warehouse Receipt are consistent and match exactly before authorizing payment release.

## Endpoints

### POST /verify
Performs DvP verification on PO, CI, and WR.

**Request Body:**
```json
{
  "po": { "po_id": "PO-123", "total_usd": 900000, ... },
  "ci": { "ci_id": "CI-456", "po_id": "PO-123", ... },
  "wr": { "wr_id": "WR-789", "po_id": "PO-123", ... }
}
```

**Response:**
```json
{
  "verification_id": "DVP-1234567890",
  "verified_at": "2025-10-25T12:00:00Z",
  "match": true,
  "documents": {
    "po_id": "PO-123",
    "ci_id": "CI-456",
    "wr_id": "WR-789"
  },
  "checks": [
    {
      "name": "po_id_linkage",
      "passed": true,
      "details": "PO ID referenced correctly in CI and WR"
    },
    {
      "name": "total_amount",
      "passed": true,
      "details": "Total USD: PO=900000, CI=900000"
    }
  ],
  "errors": [],
  "summary": "6/6 checks passed"
}
```

## Verification Checks

1. **PO ID Linkage**: CI and WR reference the correct PO
2. **Total Amount**: PO and CI totals match exactly
3. **Quantity Match**: Same quantities across all documents
4. **Unit Price Match**: Exact unit price match (no tolerance)
5. **Parties Match**: Buyer and seller LEIs consistent
6. **Document Status**: All documents in valid states

## Running

```bash
cd services/dvp-agent
npm install
npm start
```

Runs on port 3006.

