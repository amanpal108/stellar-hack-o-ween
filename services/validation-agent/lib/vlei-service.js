/**
 * VLEI Service Module
 * Handles real VLEI verification with GLEIF registry
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class VLEIService {
  constructor() {
    this.keriDir = path.join(__dirname, '../keri');
    this.config = this.loadVLEIConfig();
    this.cache = new Map();
    this.cacheTimeout = this.config.cacheTimeout || 3600000; // 1 hour default
  }

  /**
   * Load VLEI configuration
   */
  loadVLEIConfig() {
    try {
      const configPath = path.join(this.keriDir, 'vlei-config.json');
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      // Return default config if file doesn't exist
      return {
        gleifEndpoint: 'https://api.gleif.org/api/v1/lei-records',
        verificationMethod: 'api',
        cacheTimeout: 3600000,
        retryAttempts: 3,
        timeout: 10000
      };
    }
  }

  /**
   * Verify a single LEI with GLEIF
   */
  async verifyLEI(lei) {
    try {
      // Check cache first
      const cached = this.getFromCache(lei);
      if (cached) {
        console.log(`📋 [VLEI] Using cached data for LEI: ${lei}`);
        return cached;
      }

      console.log(`🔍 [VLEI] Verifying LEI with GLEIF: ${lei}`);

      // Make request to GLEIF API
      const response = await this.makeGLEIFRequest(lei);
      
      if (!response.data || !response.data.data) {
        return {
          lei,
          valid: false,
          reason: 'No data returned from GLEIF',
          verifiedAt: new Date().toISOString()
        };
      }

      // GLEIF API returns data directly, not in an array
      const leiData = response.data.data;
      if (!leiData) {
        return {
          lei,
          valid: false,
          reason: 'LEI not found in GLEIF registry',
          verifiedAt: new Date().toISOString()
        };
      }

      // Parse GLEIF response
      const verification = this.parseGLEIFResponse(lei, leiData);
      
      // Cache the result
      this.setCache(lei, verification);
      
      return verification;

    } catch (error) {
      console.error(`❌ [VLEI] Error verifying LEI ${lei}:`, error.message);
      
      // Return error response
      return {
        lei,
        valid: false,
        reason: `Verification failed: ${error.message}`,
        verifiedAt: new Date().toISOString(),
        error: true
      };
    }
  }

  /**
   * Make request to GLEIF API with retry logic
   */
  async makeGLEIFRequest(lei, attempt = 1) {
    try {
      const response = await axios.get(`${this.config.gleifEndpoint}/${lei}`, {
        timeout: this.config.timeout,
        headers: {
          'Accept': 'application/vnd.api+json',
          'User-Agent': 'Stellar-Trade-Flow-Validation-Agent/1.0'
        }
      });

      return response;

    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        console.log(`🔄 [VLEI] Retry attempt ${attempt + 1} for LEI: ${lei}`);
        await this.delay(1000 * attempt); // Exponential backoff
        return this.makeGLEIFRequest(lei, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Parse GLEIF API response
   */
  parseGLEIFResponse(lei, leiData) {
    const attributes = leiData.attributes;
    
    // Check if LEI is active
    const isActive = attributes.entity.status === 'ACTIVE';
    
    // Check if LEI is not expired
    const now = new Date();
    const registrationDate = new Date(attributes.registration.initialRegistrationDate);
    const lastUpdateDate = new Date(attributes.registration.lastUpdateDate);
    
    // LEI is valid if active and not too old (less than 1 year since last update)
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    const isNotExpired = lastUpdateDate > oneYearAgo;

    const isValid = isActive && isNotExpired;

    return {
      lei,
      valid: isValid,
      entityName: attributes.entity.legalName.name,
      entityType: attributes.entity.legalForm?.legalFormName || 'Unknown',
      status: attributes.entity.status,
      jurisdiction: attributes.entity.jurisdiction,
      registrationDate: attributes.registration.initialRegistrationDate,
      lastUpdateDate: attributes.registration.lastUpdateDate,
      registrationStatus: attributes.registration.registrationStatus,
      nextRenewalDate: attributes.registration.nextRenewalDate,
      managingLou: attributes.registration.managingLOU,
      validatedAt: new Date().toISOString(),
      reason: isValid ? 'Valid LEI' : 
              !isActive ? 'LEI is not active' : 
              !isNotExpired ? 'LEI has not been updated recently' : 'Unknown validation error',
      gleifData: {
        id: leiData.id,
        type: leiData.type,
        attributes: {
          legalName: attributes.entity.legalName,
          legalForm: attributes.entity.legalForm,
          status: attributes.entity.status,
          jurisdiction: attributes.entity.jurisdiction
        }
      }
    };
  }

  /**
   * Verify multiple LEIs
   */
  async verifyMultipleLEIs(leis) {
    const results = {};
    
    // Process LEIs in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(leis, concurrencyLimit);
    
    for (const chunk of chunks) {
      const promises = chunk.map(lei => this.verifyLEI(lei));
      const chunkResults = await Promise.all(promises);
      
      chunkResults.forEach(result => {
        results[result.lei] = result;
      });
    }
    
    return results;
  }

  /**
   * Get cached verification result
   */
  getFromCache(lei) {
    const cached = this.cache.get(lei);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache for verification result
   */
  setCache(lei, data) {
    this.cache.set(lei, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 [VLEI] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [lei, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout
    };
  }

  /**
   * Utility: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility: Chunk array for batch processing
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get service status
   */
  getStatus() {
    const cacheStats = this.getCacheStats();
    return {
      service: 'VLEI Verification Service',
      status: 'active',
      gleifEndpoint: this.config.gleifEndpoint,
      cacheStats,
      config: {
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts,
        cacheTimeout: this.cacheTimeout
      }
    };
  }
}

module.exports = VLEIService;
