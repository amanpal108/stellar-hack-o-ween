# Stellar Integra - Frontend

## Overview
React-based frontend that provides an interactive UI for the agent-driven trade flow.

## Features

- **Purchase Request Input**: Text area pre-filled with example prompt
- **Real-time Progress**: Shows current processing stage
- **Matched Seller Display**: Card showing seller details, confidence, and capabilities
- **Trade Timeline**: Visual timeline of all stages (Initiated → Ordered → Fulfilled → Paid)
- **Stellar Transaction Links**: Direct links to view transactions on Stellar Expert

## Components

### Main Interface
- Purchase prompt input (textarea)
- "Start Purchase" button
- Current stage indicator
- Matched seller card
- Trade timeline with status indicators
- Stellar transaction list with explorer links

### Status Indicators
- ✅ Completed
- ⏳ In Progress
- ❌ Failed

## Running

```bash
cd client
npm install
npm start
```

The app will run on `http://localhost:3000`.

Make sure all backend services are running first:
```bash
npm run start:all
```

## API Integration

The frontend connects to all 7 microservices:
- buyer-agent (3001)
- search-agent (3002)
- validation-agent (3003)
- po-agent (3004)
- fulfillment-agent (3005)
- dvp-agent (3006)
- payment-agent (3007)

## Design

Modern, responsive UI with:
- Gradient purple background
- Card-based layout
- Smooth animations
- Color-coded status indicators
- Mobile-friendly design

