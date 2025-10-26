#!/usr/bin/env node

/**
 * KERI Agent Status Check Script
 * Checks the status of the KERI agent and its configuration
 */

const fs = require('fs');
const path = require('path');

const keriDir = path.join(__dirname, '../keri');
const agentDir = path.join(keriDir, 'agent');

console.log('🔍 Checking KERI Agent Status...\n');

// Check if KERI directory exists
if (!fs.existsSync(keriDir)) {
  console.log('❌ KERI directory not found. Run: npm run keri:init');
  process.exit(1);
}

// Check agent configuration
const configPath = path.join(agentDir, 'config.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('✅ Agent Configuration:');
  console.log(`   ID: ${config.agentId}`);
  console.log(`   Version: ${config.version}`);
  console.log(`   Network: ${config.network}`);
  console.log(`   Created: ${config.created}`);
  console.log(`   Capabilities: ${config.capabilities.join(', ')}`);
} else {
  console.log('❌ Agent configuration not found');
}

// Check agent identity
const identityPath = path.join(agentDir, 'identity.json');
if (fs.existsSync(identityPath)) {
  const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
  console.log('\n✅ Agent Identity:');
  console.log(`   Type: ${identity.type.join(', ')}`);
  console.log(`   Issuer: ${identity.issuer.name}`);
  console.log(`   Subject: ${identity.credentialSubject.name}`);
  console.log(`   Issued: ${identity.issuanceDate}`);
} else {
  console.log('\n❌ Agent identity not found');
}

// Check keys
const keysPath = path.join(agentDir, 'keys.json');
if (fs.existsSync(keysPath)) {
  const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  console.log('\n✅ Agent Keys:');
  console.log(`   Algorithm: ${keys.algorithm}`);
  console.log(`   Key ID: ${keys.keyId}`);
  console.log(`   Public Key: ${keys.publicKey.substring(0, 50)}...`);
} else {
  console.log('\n❌ Agent keys not found');
}

// Check VLEI configuration
const vleiConfigPath = path.join(keriDir, 'vlei-config.json');
if (fs.existsSync(vleiConfigPath)) {
  const vleiConfig = JSON.parse(fs.readFileSync(vleiConfigPath, 'utf8'));
  console.log('\n✅ VLEI Configuration:');
  console.log(`   GLEIF Endpoint: ${vleiConfig.gleifEndpoint}`);
  console.log(`   Verification Method: ${vleiConfig.verificationMethod}`);
  console.log(`   Cache Timeout: ${vleiConfig.cacheTimeout}ms`);
} else {
  console.log('\n❌ VLEI configuration not found');
}

// Check agent registry
const registryPath = path.join(keriDir, 'agent-registry.json');
if (fs.existsSync(registryPath)) {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const agentCount = Object.keys(registry.agents).length;
  console.log('\n✅ Agent Registry:');
  console.log(`   Registered Agents: ${agentCount}`);
  console.log(`   Last Updated: ${registry.lastUpdated}`);
} else {
  console.log('\n❌ Agent registry not found');
}

console.log('\n🎯 Status Summary:');
const allFilesExist = [
  configPath, identityPath, keysPath, vleiConfigPath, registryPath
].every(filePath => fs.existsSync(filePath));

if (allFilesExist) {
  console.log('✅ KERI Agent is fully configured and ready!');
  console.log('🚀 You can now start the validation agent with: npm start');
} else {
  console.log('⚠️  KERI Agent needs initialization. Run: npm run keri:init');
}

