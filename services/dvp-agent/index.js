const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3006;

app.use(cors());
app.use(express.json());

/**
 * POST /verify
 * Performs Delivery vs Payment (DvP) verification
 * Matches PO, CI, and WR to ensure consistency
 * Returns: Match result and detailed report
 */
app.post('/verify', async (req, res) => {
  try {
    const { po, ci, wr } = req.body;
    
    console.log('🔍 [DVP-AGENT] Verifying DvP match:', {
      po_id: po.po_id,
      ci_id: ci.ci_id,
      wr_id: wr.wr_id
    });

    const report = {
      verification_id: `DVP-${Date.now()}`,
      verified_at: new Date().toISOString(),
      documents: {
        po_id: po.po_id,
        ci_id: ci.ci_id,
        wr_id: wr.wr_id
      },
      checks: [],
      match: true,
      errors: []
    };

    // Check 1: PO ID matches in CI and WR
    const poIdMatch = ci.po_id === po.po_id && wr.po_id === po.po_id;
    report.checks.push({
      name: 'po_id_linkage',
      passed: poIdMatch,
      details: `PO ID ${po.po_id} referenced correctly in CI and WR`
    });
    if (!poIdMatch) {
      report.errors.push('PO ID mismatch in CI or WR');
      report.match = false;
    }

    // Check 2: Total amount matches
    const amountMatch = ci.total_usd === po.total_usd;
    report.checks.push({
      name: 'total_amount',
      passed: amountMatch,
      details: `Total USD: PO=${po.total_usd}, CI=${ci.total_usd}`
    });
    if (!amountMatch) {
      report.errors.push('Total amount mismatch between PO and CI');
      report.match = false;
    }

    // Check 3: Line items quantity match
    const poQuantity = po.line_items.reduce((sum, item) => sum + item.quantity, 0);
    const ciQuantity = ci.line_items.reduce((sum, item) => sum + item.quantity, 0);
    const wrQuantity = wr.goods.reduce((sum, item) => sum + item.quantity, 0);
    
    const quantityMatch = poQuantity === ciQuantity && ciQuantity === wrQuantity;
    report.checks.push({
      name: 'quantity_match',
      passed: quantityMatch,
      details: `Quantities: PO=${poQuantity}, CI=${ciQuantity}, WR=${wrQuantity}`
    });
    if (!quantityMatch) {
      report.errors.push('Quantity mismatch across documents');
      report.match = false;
    }

    // Check 4: Line items unit price match (exact)
    let priceMatch = true;
    po.line_items.forEach((poItem, idx) => {
      const ciItem = ci.line_items[idx];
      if (ciItem && poItem.unit_price_usd !== ciItem.unit_price_usd) {
        priceMatch = false;
        report.errors.push(`Unit price mismatch for item ${idx}: PO=${poItem.unit_price_usd}, CI=${ciItem.unit_price_usd}`);
      }
    });
    report.checks.push({
      name: 'unit_price_match',
      passed: priceMatch,
      details: 'Unit prices match exactly across PO and CI'
    });
    if (!priceMatch) {
      report.match = false;
    }

    // Check 5: Buyer and seller match
    const partiesMatch = (
      po.buyer.lei === ci.buyer.lei &&
      po.seller.lei === ci.seller.lei
    );
    report.checks.push({
      name: 'parties_match',
      passed: partiesMatch,
      details: 'Buyer and seller LEIs match across documents'
    });
    if (!partiesMatch) {
      report.errors.push('Buyer or seller mismatch');
      report.match = false;
    }

    // Check 6: Document statuses
    const statusCheck = po.status === 'issued' && ci.status === 'issued' && wr.status === 'stored';
    report.checks.push({
      name: 'document_status',
      passed: statusCheck,
      details: `PO: ${po.status}, CI: ${ci.status}, WR: ${wr.status}`
    });
    if (!statusCheck) {
      report.errors.push('Invalid document statuses');
      report.match = false;
    }

    // Summary
    const passedChecks = report.checks.filter(c => c.passed).length;
    const totalChecks = report.checks.length;
    report.summary = `${passedChecks}/${totalChecks} checks passed`;

    if (report.match) {
      console.log(`✅ [DVP-AGENT] Verification PASSED (${report.summary})`);
    } else {
      console.log(`❌ [DVP-AGENT] Verification FAILED (${report.summary})`);
      console.log(`   Errors:`, report.errors);
    }

    res.json(report);

  } catch (error) {
    console.error('❌ [DVP-AGENT] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 [DVP-AGENT] Running on http://localhost:${PORT}`);
});

module.exports = app;

