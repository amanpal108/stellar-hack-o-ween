/**
 * KERI Service Module
 * Handles agent-to-agent verification and credential management
 * Uses signify-ts for KERI implementation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Import signify-ts for KERI functionality
let SignifyClient, SaltyCreator, Manager;
try {
  const signify = require('signify-ts');
  SignifyClient = signify.SignifyClient;
  SaltyCreator = signify.SaltyCreator;
  Manager = signify.Manager;
} catch (error) {
  console.warn('⚠️ signify-ts not available, using simplified KERI implementation');
}

class KERIService {
  constructor() {
    this.keriDir = path.join(__dirname, '../keri');
    this.agentDir = path.join(this.keriDir, 'agent');
    this.credentialsDir = path.join(this.keriDir, 'credentials');
    this.agentConfig = this.loadAgentConfig();
    this.agentKeys = this.loadAgentKeys();
    this.agentRegistry = this.loadAgentRegistry();
    this.signifyClient = null;
    
    // Initialize signify-ts if available
    this.initializeSignify();
  }

  /**
   * Initialize signify-ts client if available
   */
  async initializeSignify() {
    if (SignifyClient) {
      try {
        // For now, we'll use a simplified approach without full signify-ts integration
        // This can be enhanced later when the full KERI infrastructure is needed
        console.log('✅ signify-ts available, using simplified KERI implementation');
      } catch (error) {
        console.warn('⚠️ signify-ts initialization failed:', error.message);
      }
    }
  }

  /**
   * Load agent configuration
   */
  loadAgentConfig() {
    try {
      const configPath = path.join(this.agentDir, 'config.json');
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      throw new Error('Agent configuration not found. Run: npm run keri:init');
    }
  }

  /**
   * Load agent keys
   */
  loadAgentKeys() {
    try {
      const keysPath = path.join(this.agentDir, 'keys.json');
      return JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    } catch (error) {
      throw new Error('Agent keys not found. Run: npm run keri:init');
    }
  }

  /**
   * Load agent registry
   */
  loadAgentRegistry() {
    try {
      const registryPath = path.join(this.keriDir, 'agent-registry.json');
      return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    } catch (error) {
      return { agents: {}, lastUpdated: new Date().toISOString(), version: '1.0.0' };
    }
  }

  /**
   * Save agent registry
   */
  saveAgentRegistry() {
    const registryPath = path.join(this.keriDir, 'agent-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(this.agentRegistry, null, 2));
  }

  /**
   * Generate a simplified KERI event for agent communication
   */
  generateKERIEvent(eventType, data) {
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const event = {
      v: 'KERI10JSON00011c_',
      t: eventType,
      d: crypto.createHash('sha256').update(JSON.stringify(data) + timestamp).digest('hex').substring(0, 44),
      i: this.agentConfig.agentId,
      s: '0',
      p: '',
      dt: timestamp,
      et: eventType,
      kt: '1',
      k: [this.agentKeys.publicKey],
      nt: '1',
      n: [this.agentKeys.publicKey],
      bt: '0',
      b: [],
      br: [],
      ba: [],
      c: [],
      ee: {
        s: '0',
        d: crypto.createHash('sha256').update(JSON.stringify(data) + timestamp).digest('hex').substring(0, 44),
        br: [],
        ba: []
      },
      di: '',
      data: data,
      eventId: eventId
    };

    // Sign the event
    event.sig = this.signEvent(event);
    return event;
  }

  /**
   * Sign a KERI event
   */
  signEvent(event) {
    const eventString = JSON.stringify(event, null, 0);
    const signature = crypto.sign(null, Buffer.from(eventString), this.agentKeys.privateKey);
    return {
      [this.agentKeys.keyId]: signature.toString('base64')
    };
  }

  /**
   * Verify a KERI event signature
   */
  verifyEvent(event) {
    try {
      const { sig, ...eventWithoutSig } = event;
      const eventString = JSON.stringify(eventWithoutSig, null, 0);
      
      // Get the first signature (assuming single signer for now)
      const keyId = Object.keys(sig)[0];
      const signature = sig[keyId];
      
      // Verify signature
      const verifier = crypto.createVerify('sha256');
      verifier.update(eventString);
      return verifier.verify(this.agentKeys.publicKey, Buffer.from(signature, 'base64'));
    } catch (error) {
      console.error('❌ Error verifying KERI event:', error.message);
      return false;
    }
  }

  /**
   * Register a new agent in the registry
   */
  async registerAgent(agentId, agentInfo) {
    this.agentRegistry.agents[agentId] = {
      ...agentInfo,
      registeredAt: new Date().toISOString(),
      status: 'active'
    };
    this.agentRegistry.lastUpdated = new Date().toISOString();
    this.saveAgentRegistry();
    
    console.log(`✅ Registered agent: ${agentId}`);
  }

  /**
   * Verify agent identity
   */
  async verifyAgent(agentId, agentCredential) {
    try {
      // Check if agent is in registry
      if (!this.agentRegistry.agents[agentId]) {
        return {
          valid: false,
          reason: 'Agent not found in registry'
        };
      }

      // Verify credential signature
      const credentialValid = this.verifyEvent(agentCredential);
      if (!credentialValid) {
        return {
          valid: false,
          reason: 'Invalid credential signature'
        };
      }

      // Check credential expiration
      const now = new Date();
      const expiresAt = new Date(agentCredential.credentialSubject.expiresAt);
      if (expiresAt < now) {
        return {
          valid: false,
          reason: 'Credential expired'
        };
      }

      return {
        valid: true,
        agentId,
        agentName: agentCredential.credentialSubject.name,
        verifiedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error verifying agent:', error.message);
      return {
        valid: false,
        reason: 'Verification error: ' + error.message
      };
    }
  }

  /**
   * Create a verification credential for this agent
   */
  createVerificationCredential() {
    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://keri.one/credentials/v1'
      ],
      type: ['VerifiableCredential', 'AgentVerification'],
      issuer: {
        id: this.agentConfig.agentId,
        name: 'Stellar Integra Validation Agent'
      },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: this.agentConfig.agentId,
        type: 'ValidationAgent',
        name: 'Stellar Integra Validation Agent',
        capabilities: this.agentConfig.capabilities,
        publicKey: this.agentKeys.publicKey,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${this.agentConfig.agentId}#${this.agentKeys.keyId}`,
        proofPurpose: 'assertionMethod',
        proofValue: 'PLACEHOLDER_SIGNATURE'
      }
    };

    // Sign the credential
    const credentialString = JSON.stringify(credential, null, 0);
    const signature = crypto.sign(null, Buffer.from(credentialString), this.agentKeys.privateKey);
    credential.proof.proofValue = signature.toString('base64');

    return credential;
  }

  /**
   * Get agent status
   */
  getAgentStatus() {
    return {
      agentId: this.agentConfig.agentId,
      status: 'active',
      capabilities: this.agentConfig.capabilities,
      registeredAgents: Object.keys(this.agentRegistry.agents).length,
      lastUpdated: this.agentRegistry.lastUpdated
    };
  }
}

module.exports = KERIService;
