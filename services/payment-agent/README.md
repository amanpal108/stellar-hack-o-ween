# Payment Agent

## Overview
The Payment Agent releases funds from the escrow account to the seller after successful DvP verification. It executes real Stellar Testnet payment transactions.

## Endpoints

### POST /release
Releases payment after DvP verification.

**Request Body:**
```json
{
  "po": {
    "po_id": "PO-123",
    "total_xlm": "1800000.0000000",
    "total_usd": 900000,
    "seller": {
      "account": "GDXXXXX..."
    }
  },
  "dvp_report": {
    "verification_id": "DVP-456",
    "match": true,
    "errors": []
  },
  "escrow_keypair": {
    "public": "GESCROW...",
    "secret": "SESCROW..."
  }
}
```

**Response:**
```json
{
  "payment_id": "PAY-1234567890",
  "payment": {
    "payment_id": "PAY-1234567890",
    "po_id": "PO-123",
    "from_account": "GESCROW...",
    "to_account": "GDXXXXX...",
    "amount_xlm": "1800000.0000000",
    "amount_usd": 900000,
    "status": "completed",
    "tx_id": "abc123...",
    "completed_at": "2025-10-25T12:00:00Z"
  },
  "payment_tx_id": "abc123...",
  "stellar_explorer_url": "https://stellar.expert/explorer/testnet/tx/abc123..."
}
```

### GET /payment/:payment_id
Retrieves a payment record.

### POST /check-escrow
Checks if escrow account is funded.

**Request Body:**
```json
{
  "escrow_public_key": "GESCROW..."
}
```

## Running

```bash
cd services/payment-agent
npm install
npm start
```

Runs on port 3007.

