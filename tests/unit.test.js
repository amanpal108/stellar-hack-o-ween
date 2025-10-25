/**
 * Unit Tests
 * Tests core logic of individual services
 */

const axios = require('axios');

const SERVICES = {
  buyer: 'http://localhost:3001',
  search: 'http://localhost:3002',
  validation: 'http://localhost:3003',
  dvp: 'http://localhost:3006'
};

describe('Buyer Agent', () => {
  test('should parse purchase prompt correctly', async () => {
    const response = await axios.post(`${SERVICES.buyer}/start`, {
      buyer_name: 'Test Buyer',
      buyer_lei: '5493001KJTIIGC8Y1R12',
      buyer_account: 'GTEST',
      prompt_text: "Looking for 100,000 Men's T-shirts with South Indian Cultural Heritage Design made from Non Synthetic dye. Offer: 9 USD per t-shirt. Delivery: by 2025-11-30."
    });

    expect(response.data.job_id).toBeDefined();
    expect(response.data.parsed_request).toBeDefined();
    expect(response.data.parsed_request.quantity).toBe(100000);
    expect(response.data.parsed_request.unit_price_usd).toBe(9);
    expect(response.data.parsed_request.requirements).toContain('non synthetic dye');
  });
});

describe('Search Agent', () => {
  test('should find matching sellers', async () => {
    const response = await axios.post(`${SERVICES.search}/search`, {
      product: "Men's T-shirts with South Indian Cultural Heritage Design",
      quantity: 100000,
      requirements: ['non synthetic dye', 'cultural heritage design', 'south indian design']
    });

    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
    
    const topSeller = response.data[0];
    expect(topSeller.name).toBeDefined();
    expect(topSeller.lei).toBeDefined();
    expect(topSeller.confidence).toBeGreaterThan(0);
    expect(topSeller.confidence).toBeLessThanOrEqual(1);
  });

  test('should rank Jupiter Knitting highest for matching requirements', async () => {
    const response = await axios.post(`${SERVICES.search}/search`, {
      product: "Men's T-shirts with South Indian Cultural Heritage Design",
      quantity: 100000,
      requirements: ['non synthetic dye', 'cultural heritage design', 'south indian']
    });

    const topSeller = response.data[0];
    expect(topSeller.name).toBe('Jupiter Knitting');
    expect(topSeller.confidence).toBeGreaterThan(0.7);
  });
});

describe('Validation Agent', () => {
  test('should validate known LEIs', async () => {
    const response = await axios.post(`${SERVICES.validation}/validate`, {
      buyer_lei: '5493001KJTIIGC8Y1R12',
      seller_lei: '5493001XJUPITER0001'
    });

    expect(response.data.valid).toBe(true);
    expect(response.data.buyer.valid).toBe(true);
    expect(response.data.seller.valid).toBe(true);
    expect(response.data.buyer.entity_name).toBe('Tommy Hilfiger Corporation');
    expect(response.data.seller.entity_name).toBe('Jupiter Knitting Mills Pvt Ltd');
  });

  test('should reject unknown LEIs', async () => {
    const response = await axios.post(`${SERVICES.validation}/validate`, {
      buyer_lei: 'UNKNOWN_LEI_12345',
      seller_lei: '5493001XJUPITER0001'
    });

    expect(response.data.valid).toBe(false);
    expect(response.data.buyer.valid).toBe(false);
  });
});

describe('DvP Agent', () => {
  test('should verify matching documents', async () => {
    const mockPO = {
      po_id: 'PO-TEST-001',
      buyer: { lei: 'LEI-BUYER' },
      seller: { lei: 'LEI-SELLER' },
      line_items: [{ quantity: 100000, unit_price_usd: 9, total_usd: 900000 }],
      total_usd: 900000,
      status: 'issued'
    };

    const mockCI = {
      ci_id: 'CI-TEST-001',
      po_id: 'PO-TEST-001',
      buyer: { lei: 'LEI-BUYER' },
      seller: { lei: 'LEI-SELLER' },
      line_items: [{ quantity: 100000, unit_price_usd: 9, total_usd: 900000 }],
      total_usd: 900000,
      status: 'issued'
    };

    const mockWR = {
      wr_id: 'WR-TEST-001',
      po_id: 'PO-TEST-001',
      goods: [{ quantity: 100000 }],
      status: 'stored'
    };

    const response = await axios.post(`${SERVICES.dvp}/verify`, {
      po: mockPO,
      ci: mockCI,
      wr: mockWR
    });

    expect(response.data.match).toBe(true);
    expect(response.data.checks).toBeDefined();
    expect(response.data.errors).toHaveLength(0);
  });

  test('should detect quantity mismatch', async () => {
    const mockPO = {
      po_id: 'PO-TEST-002',
      buyer: { lei: 'LEI-BUYER' },
      seller: { lei: 'LEI-SELLER' },
      line_items: [{ quantity: 100000, unit_price_usd: 9, total_usd: 900000 }],
      total_usd: 900000,
      status: 'issued'
    };

    const mockCI = {
      ci_id: 'CI-TEST-002',
      po_id: 'PO-TEST-002',
      buyer: { lei: 'LEI-BUYER' },
      seller: { lei: 'LEI-SELLER' },
      line_items: [{ quantity: 95000, unit_price_usd: 9, total_usd: 855000 }], // Different quantity
      total_usd: 855000,
      status: 'issued'
    };

    const mockWR = {
      wr_id: 'WR-TEST-002',
      po_id: 'PO-TEST-002',
      goods: [{ quantity: 95000 }],
      status: 'stored'
    };

    const response = await axios.post(`${SERVICES.dvp}/verify`, {
      po: mockPO,
      ci: mockCI,
      wr: mockWR
    });

    expect(response.data.match).toBe(false);
    expect(response.data.errors.length).toBeGreaterThan(0);
  });
});

describe('Service Health Checks', () => {
  const services = [
    { name: 'buyer-agent', port: 3001 },
    { name: 'search-agent', port: 3002 },
    { name: 'validation-agent', port: 3003 },
    { name: 'po-agent', port: 3004 },
    { name: 'fulfillment-agent', port: 3005 },
    { name: 'dvp-agent', port: 3006 },
    { name: 'payment-agent', port: 3007 }
  ];

  test.each(services)('$name should be running', async ({ name, port }) => {
    try {
      await axios.get(`http://localhost:${port}`, { timeout: 2000 });
    } catch (error) {
      // Services may not have a GET / endpoint, but they should respond
      expect([404, 'ECONNREFUSED']).not.toContain(error.code);
    }
  });
});

