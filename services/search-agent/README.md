# Search Agent

## Overview
The Search Agent matches buyer requirements against a registry of seller agents using keyword matching, quantity capabilities, and description analysis.

## Endpoints

### POST /search
Searches for matching sellers.

**Request Body:**
```json
{
  "product": "Men's T-shirts with South Indian Cultural Heritage Design",
  "quantity": 100000,
  "requirements": ["non synthetic dye", "cultural heritage design", "south indian design"]
}
```

**Response:**
```json
[
  {
    "agentID": "agent:jn-001",
    "name": "Jupiter Knitting",
    "lei": "5493001XJUPITER0001",
    "stellar_account": "GDjupiter...",
    "description": "vLEI verified textile seller...",
    "confidence": 0.92,
    "matches": ["quantity_match", "keyword:textile", "requirement:non synthetic dye"],
    "capabilities": {
      "min_quantity": 10000,
      "max_quantity": 500000,
      "lead_time_days": 30
    },
    "endpoint": "http://localhost:3004"
  }
]
```

## Ranking Logic
- Quantity match: +0.3
- Keyword in product: +0.1 per match
- Keyword in requirements: +0.15 per match
- Requirement in description: +0.2 per match

## Running

```bash
cd services/search-agent
npm install
npm start
```

Runs on port 3002.

