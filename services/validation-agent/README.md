# Validation Agent

## Overview
The Validation Agent verifies vLEI credentials for both buyer and seller entities, ensuring they are legitimate and authorized to trade.

## Endpoints

### POST /validate
Validates both buyer and seller LEI credentials.

**Request Body:**
```json
{
  "buyer_lei": "5493001KJTIIGC8Y1R12",
  "seller_lei": "5493001XJUPITER0001"
}
```

**Response:**
```json
{
  "valid": true,
  "buyer": {
    "lei": "5493001KJTIIGC8Y1R12",
    "valid": true,
    "entity_name": "Tommy Hilfiger Corporation",
    "status": "ISSUED",
    "issuer": "GLEIF",
    "expires_at": "2026-01-15T10:00:00Z"
  },
  "seller": {
    "lei": "5493001XJUPITER0001",
    "valid": true,
    "entity_name": "Jupiter Knitting Mills Pvt Ltd",
    "status": "ISSUED",
    "issuer": "GLEIF",
    "expires_at": "2026-03-20T08:30:00Z"
  },
  "validated_at": "2025-10-25T12:00:00Z",
  "validation_id": "val_1234567890"
}
```

### GET /check/:lei
Quick validation check for a single LEI.

## Running

```bash
cd services/validation-agent
npm install
npm start
```

Runs on port 3003.

