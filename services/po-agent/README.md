# PO Agent

## Overview
The PO (Purchase Order) Agent generates structured purchase orders and posts them to Stellar Testnet using the `manageData` operation to create an immutable reference.

## Endpoints

### POST /generate
Generates a purchase order and posts to Stellar.

**Request Body:**
```json
{
  "buyer": {
    "name": "Tommy Hilfiger",
    "lei": "5493001KJTIIGC8Y1R12",
    "account": "GXXXXX..."
  },
  "seller": {
    "name": "Jupiter Knitting",
    "lei": "5493001XJUPITER0001",
    "account": "GDXXXXX..."
  },
  "order": {
    "product": "Men's T-shirts",
    "quantity": 100000,
    "unit_price_usd": 9,
    "delivery_date": "2025-11-30",
    "requirements": ["non synthetic dye"]
  },
  "escrow_keypair": {
    "secret": "SXXXXX..."
  }
}
```

**Response:**
```json
{
  "po_id": "PO-1234567890",
  "po": {
    "po_id": "PO-1234567890",
    "buyer": {...},
    "seller": {...},
    "total_usd": 900000,
    "total_xlm": "1800000.0000000",
    "status": "issued"
  },
  "po_tx_id": "abc123...",
  "stellar_explorer_url": "https://stellar.expert/explorer/testnet/tx/abc123..."
}
```

### GET /po/:po_id
Retrieves a purchase order by ID.

## Stellar Integration
- Computes SHA256 hash of PO JSON
- Posts hash using `manageData` operation with key `PO:<po_id>`
- Includes PO ID in transaction memo
- Returns transaction hash for verification

## Running

```bash
cd services/po-agent
npm install
npm start
```

Runs on port 3004.

