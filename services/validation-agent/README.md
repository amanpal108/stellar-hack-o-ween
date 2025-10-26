# KERI-Based Validation Agent

## Overview
The Validation Agent provides real vLEI verification using the GLEIF API and implements KERI (Key Event Receipt Infrastructure) for agent-to-agent verification. This replaces the previous mock validation system with real-world credential verification.

## Features

- **Real VLEI Verification**: Direct integration with GLEIF API for authentic LEI validation
- **KERI Agent Network**: Full KERI implementation for secure agent-to-agent communication
- **Credential Management**: Issue and verify agent identity credentials
- **Caching**: Intelligent caching of verification results to improve performance
- **Batch Processing**: Verify multiple LEIs simultaneously

## Setup

### 1. Initialize KERI Agent
```bash
cd services/validation-agent
npm install
npm run keri:init
```

### 2. Check Status
```bash
npm run keri:status
```

### 3. Start Agent
```bash
npm start
```

## API Endpoints

### VLEI Verification

#### POST /validate
Validates both buyer and seller LEI credentials using real GLEIF API.

**Request Body:**
```json
{
  "buyer_lei": "54930012QJWZMYHNJW95",
  "seller_lei": "3358004DXAMRWRUIYJ05"
}
```

**Response:**
```json
{
  "valid": true,
  "buyer": {
    "lei": "54930012QJWZMYHNJW95",
    "valid": true,
    "entityName": "Tommy Hilfiger Corporation",
    "entityType": "Corporation",
    "status": "ACTIVE",
    "jurisdiction": "US",
    "registrationDate": "2012-06-06T00:00:00Z",
    "lastUpdateDate": "2024-01-15T10:00:00Z",
    "validatedAt": "2025-01-25T12:00:00Z",
    "reason": "Valid LEI"
  },
  "seller": {
    "lei": "3358004DXAMRWRUIYJ05",
    "valid": true,
    "entityName": "Jupiter Knitting Mills Pvt Ltd",
    "entityType": "Private Limited Company",
    "status": "ACTIVE",
    "jurisdiction": "IN",
    "registrationDate": "2015-03-20T00:00:00Z",
    "lastUpdateDate": "2024-03-20T08:30:00Z",
    "validatedAt": "2025-01-25T12:00:00Z",
    "reason": "Valid LEI"
  },
  "validated_at": "2025-01-25T12:00:00Z",
  "validation_id": "val_1737811200000",
  "verification_method": "GLEIF_API",
  "agent_id": "validation-agent-1737811200000"
}
```

#### GET /vlei/check/:lei
Quick VLEI check for a single LEI.

#### POST /vlei/verify-multiple
Verify multiple LEIs at once.

**Request Body:**
```json
{
  "leis": ["54930012QJWZMYHNJW95", "3358004DXAMRWRUIYJ05"]
}
```

#### GET /vlei/status
Get VLEI service status and cache statistics.

#### DELETE /vlei/cache
Clear VLEI verification cache.

### KERI Agent Network

#### POST /keri/register
Register a new agent in the KERI network.

**Request Body:**
```json
{
  "agentId": "buyer-agent-123",
  "agentInfo": {
    "name": "Buyer Agent",
    "capabilities": ["trade-execution", "payment-processing"],
    "endpoints": {
      "http": "http://localhost:3001",
      "keri": "http://localhost:3001/keri"
    }
  }
}
```

#### POST /keri/verify
Verify an agent's identity using KERI credentials.

**Request Body:**
```json
{
  "agentId": "buyer-agent-123",
  "credential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "AgentIdentity"],
    "issuer": {...},
    "credentialSubject": {...},
    "proof": {...}
  }
}
```

#### GET /keri/credential
Get this agent's verification credential.

#### GET /keri/status
Get KERI agent status and registry information.

### Health & Status

#### GET /health
Comprehensive health check for all services.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-25T12:00:00Z",
  "services": {
    "keri": {
      "agentId": "validation-agent-1737811200000",
      "status": "active",
      "capabilities": ["vlei-verification", "agent-verification"],
      "registeredAgents": 5,
      "lastUpdated": "2025-01-25T12:00:00Z"
    },
    "vlei": {
      "service": "VLEI Verification Service",
      "status": "active",
      "gleifEndpoint": "https://api.gleif.org/api/v1/lei-records",
      "cacheStats": {
        "totalEntries": 25,
        "validEntries": 20,
        "expiredEntries": 5,
        "cacheTimeout": 3600000
      }
    }
  }
}
```

## Configuration

The agent uses several configuration files:

- `keri/agent/config.json` - KERI agent configuration
- `keri/agent/identity.json` - Agent identity document
- `keri/agent/keys.json` - Agent cryptographic keys
- `keri/vlei-config.json` - VLEI service configuration
- `keri/agent-registry.json` - Registered agents registry

## Security Features

- **Cryptographic Signatures**: All KERI events are cryptographically signed
- **Credential Verification**: Agent credentials are verified before acceptance
- **Secure Key Management**: Private keys are stored securely
- **API Rate Limiting**: Built-in protection against abuse
- **Cache Security**: Verification results are cached securely

## Error Handling

The agent provides comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **API Errors**: Graceful degradation with fallback responses
- **Validation Errors**: Detailed error messages with specific reasons
- **Authentication Errors**: Clear indication of credential issues

## Running

```bash
cd services/validation-agent
npm install
npm run keri:init  # Initialize KERI agent (first time only)
npm start
```

Runs on port 3003.

## Development

```bash
npm run dev  # Start with nodemon for development
npm run keri:status  # Check KERI agent status
```

