/**
 * Integration Test
 * End-to-end test of the complete trade flow
 * Note: This test uses mock Stellar transactions (no real testnet calls)
 */

const axios = require('axios');

const SERVICES = {
  buyer: 'http://localhost:3001',
  search: 'http://localhost:3002',
  validation: 'http://localhost:3003',
  po: 'http://localhost:3004',
  fulfillment: 'http://localhost:3005',
  dvp: 'http://localhost:3006',
  payment: 'http://localhost:3007'
};

describe('End-to-End Trade Flow', () => {
  let jobId;
  let parsedRequest;
  let selectedSeller;
  let validationResult;
  let poData;
  let fulfillmentData;
  let dvpReport;
  let paymentData;

  test('Step 1: Buyer initiates purchase request', async () => {
    const response = await axios.post(`${SERVICES.buyer}/start`, {
      buyer_name: 'Tommy Hilfiger',
      buyer_lei: '5493001KJTIIGC8Y1R12',
      buyer_account: 'GBUYER_TEST',
      prompt_text: "Looking for 100,000 Men's T-shirts with South Indian Cultural Heritage Design made from Non Synthetic dye. Offer: 9 USD per t-shirt. Delivery: by 2025-11-30."
    });

    expect(response.status).toBe(200);
    expect(response.data.job_id).toBeDefined();
    expect(response.data.stage).toBe('initiated');
    
    jobId = response.data.job_id;
    parsedRequest = response.data.parsed_request;

    expect(parsedRequest.quantity).toBe(100000);
    expect(parsedRequest.unit_price_usd).toBe(9);
  });

  test('Step 2: Search agent finds matching sellers', async () => {
    const response = await axios.post(`${SERVICES.search}/search`, {
      product: parsedRequest.product,
      quantity: parsedRequest.quantity,
      requirements: parsedRequest.requirements
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    selectedSeller = response.data[0];
    expect(selectedSeller.name).toBe('Jupiter Knitting');
    expect(selectedSeller.lei).toBe('5493001XJUPITER0001');
    expect(selectedSeller.confidence).toBeGreaterThan(0.8);
  });

  test('Step 3: Validation agent verifies both parties', async () => {
    const response = await axios.post(`${SERVICES.validation}/validate`, {
      buyer_lei: '5493001KJTIIGC8Y1R12',
      seller_lei: selectedSeller.lei
    });

    expect(response.status).toBe(200);
    expect(response.data.valid).toBe(true);
    expect(response.data.buyer.valid).toBe(true);
    expect(response.data.seller.valid).toBe(true);

    validationResult = response.data;
  });

  test('Step 4: PO agent generates purchase order', async () => {
    const response = await axios.post(`${SERVICES.po}/generate`, {
      buyer: {
        name: 'Tommy Hilfiger',
        lei: '5493001KJTIIGC8Y1R12',
        account: 'GBUYER_TEST'
      },
      seller: {
        name: selectedSeller.name,
        lei: selectedSeller.lei,
        account: selectedSeller.stellar_account
      },
      order: {
        product: parsedRequest.product,
        quantity: parsedRequest.quantity,
        unit_price_usd: parsedRequest.unit_price_usd,
        delivery_date: parsedRequest.delivery_date,
        requirements: parsedRequest.requirements
      },
      escrow_keypair: {
        secret: null // Mock mode
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.po_id).toBeDefined();
    expect(response.data.po).toBeDefined();
    
    poData = response.data;
    
    expect(poData.po.total_usd).toBe(900000);
    expect(poData.po.status).toBe('issued');
    expect(poData.po.buyer.lei).toBe('5493001KJTIIGC8Y1R12');
    expect(poData.po.seller.lei).toBe(selectedSeller.lei);
  });

  test('Step 5: Fulfillment agent generates CI and WR', async () => {
    const response = await axios.post(`${SERVICES.fulfillment}/fulfill`, {
      po: poData.po,
      seller_keypair: {
        secret: null // Mock mode
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.ci_id).toBeDefined();
    expect(response.data.wr_id).toBeDefined();
    
    fulfillmentData = response.data;
    
    expect(fulfillmentData.ci.po_id).toBe(poData.po_id);
    expect(fulfillmentData.ci.total_usd).toBe(poData.po.total_usd);
    expect(fulfillmentData.wr.po_id).toBe(poData.po_id);
    expect(fulfillmentData.wr.status).toBe('stored');
  });

  test('Step 6: DvP agent verifies document consistency', async () => {
    const response = await axios.post(`${SERVICES.dvp}/verify`, {
      po: poData.po,
      ci: fulfillmentData.ci,
      wr: fulfillmentData.wr
    });

    expect(response.status).toBe(200);
    expect(response.data.match).toBe(true);
    expect(response.data.verification_id).toBeDefined();
    expect(response.data.checks).toBeDefined();
    expect(response.data.errors).toHaveLength(0);
    
    dvpReport = response.data;
    
    // Verify all checks passed
    dvpReport.checks.forEach(check => {
      expect(check.passed).toBe(true);
    });
  });

  test('Step 7: Payment agent releases payment', async () => {
    const response = await axios.post(`${SERVICES.payment}/release`, {
      po: poData.po,
      dvp_report: dvpReport,
      escrow_keypair: {
        secret: null // Mock mode
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.payment_id).toBeDefined();
    expect(response.data.payment).toBeDefined();
    
    paymentData = response.data;
    
    expect(['completed', 'simulated']).toContain(paymentData.payment.status);
    expect(paymentData.payment.amount_usd).toBe(poData.po.total_usd);
    expect(paymentData.payment.to_account).toBe(poData.po.seller.account);
  });

  test('Step 8: Verify complete trade flow', () => {
    // Verify data consistency across all steps
    expect(jobId).toBeDefined();
    expect(selectedSeller.name).toBe('Jupiter Knitting');
    expect(validationResult.valid).toBe(true);
    expect(poData.po_id).toBeDefined();
    expect(fulfillmentData.ci.po_id).toBe(poData.po_id);
    expect(fulfillmentData.wr.po_id).toBe(poData.po_id);
    expect(dvpReport.match).toBe(true);
    expect(['completed', 'simulated']).toContain(paymentData.payment.status);
    
    // Verify financial consistency
    const totalAmount = 900000; // 100,000 * $9
    expect(poData.po.total_usd).toBe(totalAmount);
    expect(fulfillmentData.ci.total_usd).toBe(totalAmount);
    expect(paymentData.payment.amount_usd).toBe(totalAmount);
  });
});

describe('Integration Test: Failure Scenarios', () => {
  test('Should reject payment if DvP verification fails', async () => {
    const mockPO = {
      po_id: 'PO-FAIL-001',
      buyer: { lei: 'LEI-BUYER', account: 'GBUYER' },
      seller: { lei: 'LEI-SELLER', account: 'GSELLER' },
      line_items: [{ quantity: 100000, unit_price_usd: 9, total_usd: 900000 }],
      total_usd: 900000,
      status: 'issued'
    };

    const mockCI = {
      ci_id: 'CI-FAIL-001',
      po_id: 'PO-FAIL-001',
      buyer: { lei: 'LEI-BUYER' },
      seller: { lei: 'LEI-SELLER' },
      line_items: [{ quantity: 50000, unit_price_usd: 9, total_usd: 450000 }], // Wrong quantity
      total_usd: 450000,
      status: 'issued'
    };

    const mockWR = {
      wr_id: 'WR-FAIL-001',
      po_id: 'PO-FAIL-001',
      goods: [{ quantity: 50000 }],
      status: 'stored'
    };

    // DvP should fail
    const dvpResponse = await axios.post(`${SERVICES.dvp}/verify`, {
      po: mockPO,
      ci: mockCI,
      wr: mockWR
    });

    expect(dvpResponse.data.match).toBe(false);

    // Payment should be rejected
    try {
      await axios.post(`${SERVICES.payment}/release`, {
        po: mockPO,
        dvp_report: dvpResponse.data,
        escrow_keypair: { secret: null }
      });
      fail('Payment should have been rejected');
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toContain('DvP verification failed');
    }
  });
});

