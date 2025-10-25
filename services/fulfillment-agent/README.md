# Fulfillment Agent

## Overview
The Fulfillment Agent simulates order fulfillment by generating Commercial Invoices (CI) and Warehouse Receipts (WR), then posting both documents to Stellar Testnet.

## Endpoints

### POST /fulfill
Processes fulfillment for a purchase order.

**Request Body:**
```json
{
  "po": {
    "po_id": "PO-1234567890",
    "buyer": {...},
    "seller": {...},
    "line_items": [...],
    "total_usd": 900000
  },
  "seller_keypair": {
    "secret": "SXXXXX..."
  }
}
```

**Response:**
```json
{
  "ci_id": "CI-1234567890",
  "ci": {...},
  "ci_tx_id": "abc123...",
  "ci_explorer_url": "https://stellar.expert/explorer/testnet/tx/...",
  "wr_id": "WR-1234567891",
  "wr": {...},
  "wr_tx_id": "def456...",
  "wr_explorer_url": "https://stellar.expert/explorer/testnet/tx/..."
}
```

### GET /ci/:ci_id
Retrieves a Commercial Invoice by ID.

### GET /wr/:wr_id
Retrieves a Warehouse Receipt by ID.

## Documents Generated

**Commercial Invoice (CI)**: Details the goods sold, pricing, and payment terms.

**Warehouse Receipt (WR)**: Confirms goods are stored and ready for delivery.

## Stellar Integration
Both CI and WR are posted to Stellar using `manageData` operations with SHA256 hashes.

## Running

```bash
cd services/fulfillment-agent
npm install
npm start
```

Runs on port 3005.

