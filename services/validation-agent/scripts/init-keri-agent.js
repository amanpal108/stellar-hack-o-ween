#!/usr/bin/env node

/**
 * KERI Agent Initialization Script
 * Creates a new KERI agent identity for the validation agent
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create KERI agent directory structure
const keriDir = path.join(__dirname, '../keri');
const agentDir = path.join(keriDir, 'agent');
const credentialsDir = path.join(keriDir, 'credentials');

// Ensure directories exist
[keriDir, agentDir, credentialsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Generate KERI agent configuration
const agentConfig = {
  agentId: `validation-agent-${Date.now()}`,
  version: '1.0.0',
  created: new Date().toISOString(),
  network: 'testnet', // Change to 'mainnet' for production
  endpoints: {
    http: 'http://localhost:3003',
    keri: 'http://localhost:3003/keri'
  },
  capabilities: [
    'vlei-verification',
    'agent-verification',
    'credential-issuance',
    'credential-verification'
  ],
  supportedCredentials: [
    'vLEI',
    'AgentIdentity',
    'TradingAuthorization',
    'ComplianceCertificate'
  ]
};

// Generate agent key pair
const agentKeys = crypto.generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Create agent identity document
const agentIdentity = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://keri.one/credentials/v1'
  ],
  type: ['VerifiableCredential', 'AgentIdentity'],
  issuer: {
    id: agentConfig.agentId,
    name: 'Stellar Integra Validation Agent'
  },
  issuanceDate: new Date().toISOString(),
  credentialSubject: {
    id: agentConfig.agentId,
    type: 'ValidationAgent',
    name: 'Stellar Integra Validation Agent',
    description: 'KERI-based validation agent for vLEI and agent verification',
    capabilities: agentConfig.capabilities,
    publicKey: agentKeys.publicKey,
    endpoints: agentConfig.endpoints
  },
  proof: {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    verificationMethod: `${agentConfig.agentId}#key-1`,
    proofPurpose: 'assertionMethod',
    proofValue: 'PLACEHOLDER_SIGNATURE' // Will be signed when used
  }
};

// Save configuration files
fs.writeFileSync(
  path.join(agentDir, 'config.json'),
  JSON.stringify(agentConfig, null, 2)
);

fs.writeFileSync(
  path.join(agentDir, 'identity.json'),
  JSON.stringify(agentIdentity, null, 2)
);

fs.writeFileSync(
  path.join(agentDir, 'keys.json'),
  JSON.stringify({
    publicKey: agentKeys.publicKey,
    privateKey: agentKeys.privateKey,
    keyId: 'key-1',
    algorithm: 'Ed25519'
  }, null, 2)
);

// Create VLEI verification configuration
const vleiConfig = {
  gleifEndpoint: 'https://api.gleif.org/api/v1/lei-records',
  verificationMethod: 'api',
  cacheTimeout: 3600000, // 1 hour
  retryAttempts: 3,
  timeout: 10000
};

fs.writeFileSync(
  path.join(keriDir, 'vlei-config.json'),
  JSON.stringify(vleiConfig, null, 2)
);

// Create agent registry for known agents
const agentRegistry = {
  agents: {},
  lastUpdated: new Date().toISOString(),
  version: '1.0.0'
};

fs.writeFileSync(
  path.join(keriDir, 'agent-registry.json'),
  JSON.stringify(agentRegistry, null, 2)
);

console.log('🎉 KERI Agent initialized successfully!');
console.log(`📋 Agent ID: ${agentConfig.agentId}`);
console.log(`🔑 Keys generated and stored securely`);
console.log(`📁 Configuration saved to: ${keriDir}`);
console.log('\n🚀 Next steps:');
console.log('1. Run: npm run keri:status');
console.log('2. Start the validation agent: npm start');
console.log('3. Register with other agents in the network');
