# Buyer Agent

## Overview
The Buyer Agent initiates the purchase flow by accepting natural language prompts from buyers, parsing them into structured requests, and managing job state throughout the trade lifecycle.

## Endpoints

### POST /start
Initiates a new purchase request.

**Request Body:**
```json
{
  "buyer_name": "Tommy Hilfiger",
  "buyer_lei": "5493001KJTIIGC8Y1R12",
  "buyer_account": "GXXXXX...",
  "prompt_text": "Looking for 100,000 Men's T-shirts..."
}
```

**Response:**
```json
{
  "job_id": "job_1234567890",
  "stage": "initiated",
  "message": "Purchase request received and parsed",
  "parsed_request": {
    "product": "Men's T-shirts with South Indian Cultural Heritage Design",
    "quantity": 100000,
    "unit_price_usd": 9,
    "delivery_date": "2025-11-30",
    "requirements": ["non synthetic dye", "cultural heritage design"]
  }
}
```

### GET /status/:job_id
Retrieves the current status of a job.

### POST /update/:job_id
Internal endpoint for other services to update job status.

## Running

```bash
cd services/buyer-agent
npm install
npm start
```

Runs on port 3001.

