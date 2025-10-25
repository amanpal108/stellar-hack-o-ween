import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import AgentVisualizer from './AgentVisualizer';
import AgentNetworkGraph from './AgentNetworkGraph';

const SERVICES = {
  buyer: 'http://localhost:3001',
  search: 'http://localhost:3002',
  validation: 'http://localhost:3003',
  po: 'http://localhost:3004',
  fulfillment: 'http://localhost:3005',
  dvp: 'http://localhost:3006',
  payment: 'http://localhost:3007'
};

const DEFAULT_PROMPT = "Looking for 100,000 Men's T-shirts with South Indian Cultural Heritage Design made from Non Synthetic dye. Offer: 9 USD per t-shirt. Delivery: by 2025-11-30.";

// Demo credentials - Using REAL Stellar Testnet accounts
// These were generated and funded via scripts/create_test_accounts.js and scripts/fund_escrow.js
const DEMO_ACCOUNTS = {
  buyer: {
    name: "Tommy Hilfiger",
    lei: "5493001KJTIIGC8Y1R12",
    public: "GBVEGEGHFCGQ5FAJZ72ROXQDP7IGSXJNS7FUJ7Y25CJ7JFBUKFUMHRYP",
    secret: "SBWYF5JWAOKS752NH2VU4K2NXMZJGFOD3FS34JVECNDZQYEWWWWE4FUV"
  },
  seller: {
    name: "Jupiter Knitting",
    lei: "5493001XJUPITER0001",
    public: "GBPFMDZ5VNL56YNMXOQ35RUFRS3S6LZN66SB2OYOQXHK3X46UGTBJBBP",
    secret: "SA3RAY6RIK7X6WX6ORPWQF62LNJ3HLYYTKA3UYEXYTQW47J6KYFUWP4K"
  },
  escrow: {
    name: "Marketplace Escrow",
    public: "GB27XHTEUUQRJZQP5TIVMP6SOW7VSVYCNZD5OYD3NO2U2UL6VV3CW245",
    secret: "SC54WRDKCEOHY5FWEAHTUO63XXBKIT3OPYIFD3OVURHU6KTJHSHHFTLK"
  }
};

function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [seller, setSeller] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('flow'); // 'flow' or 'network'
  const [communications, setCommunications] = useState([]);
  const [accounts] = useState(DEMO_ACCOUNTS); // Using demo accounts

  const addTimelineEvent = (stage, status, details = '') => {
    setTimeline(prev => [...prev, {
      stage,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const addTransaction = (type, txId, url) => {
    if (txId) {
      setTransactions(prev => [...prev, { type, txId, url }]);
    }
  };

  const logCommunication = (from, to, method, endpoint, type = 'request', data = null) => {
    const comm = {
      from,
      to,
      method,
      endpoint,
      type,
      timestamp: new Date().toLocaleTimeString(),
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setCommunications(prev => [comm, ...prev].slice(0, 50)); // Keep last 50
  };

  const logResponse = (from, to, status, message, data = null) => {
    const comm = {
      from,
      to,
      method: 'RESPONSE',
      endpoint: '',
      type: status >= 200 && status < 300 ? 'response' : 'error',
      status,
      message,
      timestamp: new Date().toLocaleTimeString(),
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setCommunications(prev => [comm, ...prev].slice(0, 50));
  };

  const startPurchase = async () => {
    setLoading(true);
    setError(null);
    setTimeline([]);
    setTransactions([]);
    setSeller(null);
    setCommunications([]);

    // Helper function to add delay for visualization
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // Step 1: Initiate purchase
      setCurrentStage('Initiating Purchase...');
      addTimelineEvent('initiated', 'in-progress');
      
      const buyerStartPayload = {
        buyer_name: accounts.buyer.name,
        buyer_lei: accounts.buyer.lei,
        buyer_account: accounts.buyer.public,
        prompt_text: prompt
      };
      
      logCommunication('UI', 'Buyer Agent', 'POST', '/start', 'request', buyerStartPayload);
      await delay(800);
      
      const startRes = await axios.post(`${SERVICES.buyer}/start`, buyerStartPayload);
      logResponse('Buyer Agent', 'UI', 200, `Job created: ${startRes.data.job_id}`, startRes.data);
      await delay(1000);

      addTimelineEvent('initiated', 'completed', `Job ID: ${startRes.data.job_id}`);

      // Step 2: Search sellers
      setCurrentStage('Searching for Sellers...');
      addTimelineEvent('searching', 'in-progress');

      const searchPayload = {
        product: startRes.data.parsed_request.product,
        quantity: startRes.data.parsed_request.quantity,
        requirements: startRes.data.parsed_request.requirements
      };
      
      logCommunication('Buyer Agent', 'Search Agent', 'POST', '/search', 'request', searchPayload);
      await delay(800);
      
      const searchRes = await axios.post(`${SERVICES.search}/search`, searchPayload);
      logResponse('Search Agent', 'Buyer Agent', 200, `Found ${searchRes.data.length} sellers`, { 
        count: searchRes.data.length,
        topMatch: searchRes.data[0]?.name,
        confidence: searchRes.data[0]?.confidence
      });
      await delay(1000);

      const topSeller = searchRes.data[0];
      setSeller(topSeller);
      addTimelineEvent('searching', 'completed', `Found ${searchRes.data.length} sellers`);

      // Step 3: Validate
      setCurrentStage('Validating Credentials...');
      addTimelineEvent('validation', 'in-progress');

      const validationPayload = {
        buyer_lei: accounts.buyer.lei,
        seller_lei: topSeller.lei
      };
      
      logCommunication('Buyer Agent', 'Validation Agent', 'POST', '/validate', 'request', validationPayload);
      await delay(800);
      
      const validationRes = await axios.post(`${SERVICES.validation}/validate`, validationPayload);
      logResponse('Validation Agent', 'Buyer Agent', 200, 'Both parties verified', {
        buyer: validationRes.data.buyer.entity_name,
        seller: validationRes.data.seller.entity_name,
        valid: validationRes.data.valid
      });
      await delay(1000);

      if (!validationRes.data.valid) {
        throw new Error('Validation failed');
      }

      addTimelineEvent('validation', 'completed', 'Both parties verified');

      // Step 4: Generate PO
      setCurrentStage('Generating Purchase Order...');
      addTimelineEvent('po_generation', 'in-progress');

      const poPayload = {
        buyer: {
          name: accounts.buyer.name,
          lei: accounts.buyer.lei,
          account: accounts.buyer.public
        },
        seller: {
          name: topSeller.name,
          lei: topSeller.lei,
          account: accounts.seller.public // Using real seller account
        },
        order: {
          product: startRes.data.parsed_request.product,
          quantity: startRes.data.parsed_request.quantity,
          unit_price_usd: startRes.data.parsed_request.unit_price_usd,
          delivery_date: startRes.data.parsed_request.delivery_date,
          requirements: startRes.data.parsed_request.requirements
        },
        escrow_keypair: {
          public: accounts.escrow.public,
          secret: accounts.escrow.secret // REAL CREDENTIALS - will make real tx
        }
      };
      
      logCommunication('Buyer Agent', 'PO Agent', 'POST', '/generate', 'request', {
        buyer: poPayload.buyer.name,
        seller: poPayload.seller.name,
        total_usd: poPayload.order.quantity * poPayload.order.unit_price_usd,
        using_real_keys: true
      });
      await delay(800);
      
      const poRes = await axios.post(`${SERVICES.po}/generate`, poPayload);
      logResponse('PO Agent', 'Buyer Agent', 200, `PO generated: ${poRes.data.po_id}`, {
        po_id: poRes.data.po_id,
        total_usd: poRes.data.po.total_usd,
        total_xlm: poRes.data.po.total_xlm
      });
      await delay(1000);
      
      if (poRes.data.po_tx_id) {
        logCommunication('PO Agent', 'Stellar Testnet', 'POST', 'manageData(PO)', 'stellar', {
          operation: 'manageData',
          key: `PO:${poRes.data.po_id}`,
          from: accounts.escrow.public
        });
        await delay(1200);
        logResponse('Stellar Testnet', 'PO Agent', 200, `TX: ${poRes.data.po_tx_id.substring(0, 8)}...`, {
          tx_hash: poRes.data.po_tx_id,
          explorer: poRes.data.stellar_explorer_url
        });
        await delay(1000);
      }

      addTimelineEvent('po_generation', 'completed', `PO: ${poRes.data.po_id}`);
      addTransaction('PO', poRes.data.po_tx_id, poRes.data.stellar_explorer_url);

      // Step 5: Fulfillment
      setCurrentStage('Processing Fulfillment...');
      addTimelineEvent('fulfillment', 'in-progress');

      const fulfillmentPayload = {
        po: poRes.data.po,
        seller_keypair: {
          public: accounts.seller.public,
          secret: accounts.seller.secret // REAL CREDENTIALS
        }
      };
      
      logCommunication('PO Agent', 'Fulfillment Agent', 'POST', '/fulfill', 'request', {
        po_id: poRes.data.po_id,
        using_real_keys: true
      });
      await delay(800);
      
      const fulfillmentRes = await axios.post(`${SERVICES.fulfillment}/fulfill`, fulfillmentPayload);
      logResponse('Fulfillment Agent', 'PO Agent', 200, `CI & WR generated`, {
        ci_id: fulfillmentRes.data.ci_id,
        wr_id: fulfillmentRes.data.wr_id
      });
      await delay(1000);
      
      if (fulfillmentRes.data.ci_tx_id) {
        logCommunication('Fulfillment Agent', 'Stellar Testnet', 'POST', 'manageData(CI)', 'stellar', {
          operation: 'manageData',
          key: `CI:${fulfillmentRes.data.ci_id}`,
          from: accounts.seller.public
        });
        await delay(1200);
        logResponse('Stellar Testnet', 'Fulfillment Agent', 200, `TX: ${fulfillmentRes.data.ci_tx_id.substring(0, 8)}...`, {
          tx_hash: fulfillmentRes.data.ci_tx_id,
          explorer: fulfillmentRes.data.ci_explorer_url
        });
        await delay(800);
      }
      
      if (fulfillmentRes.data.wr_tx_id) {
        logCommunication('Fulfillment Agent', 'Stellar Testnet', 'POST', 'manageData(WR)', 'stellar', {
          operation: 'manageData',
          key: `WR:${fulfillmentRes.data.wr_id}`,
          from: accounts.seller.public
        });
        await delay(1200);
        logResponse('Stellar Testnet', 'Fulfillment Agent', 200, `TX: ${fulfillmentRes.data.wr_tx_id.substring(0, 8)}...`, {
          tx_hash: fulfillmentRes.data.wr_tx_id,
          explorer: fulfillmentRes.data.wr_explorer_url
        });
        await delay(1000);
      }

      addTimelineEvent('fulfillment', 'completed', `CI: ${fulfillmentRes.data.ci_id}, WR: ${fulfillmentRes.data.wr_id}`);
      addTransaction('CI', fulfillmentRes.data.ci_tx_id, fulfillmentRes.data.ci_explorer_url);
      addTransaction('WR', fulfillmentRes.data.wr_tx_id, fulfillmentRes.data.wr_explorer_url);

      // Step 6: DvP Verification
      setCurrentStage('Verifying Documents...');
      addTimelineEvent('dvp_verification', 'in-progress');

      const dvpPayload = {
        po: poRes.data.po,
        ci: fulfillmentRes.data.ci,
        wr: fulfillmentRes.data.wr
      };
      
      logCommunication('Fulfillment Agent', 'DvP Agent', 'POST', '/verify', 'request', {
        po_id: poRes.data.po_id,
        ci_id: fulfillmentRes.data.ci_id,
        wr_id: fulfillmentRes.data.wr_id,
        checks: 6
      });
      await delay(800);
      
      const dvpRes = await axios.post(`${SERVICES.dvp}/verify`, dvpPayload);
      logResponse('DvP Agent', 'Fulfillment Agent', 200, dvpRes.data.match ? 'Match verified ✓' : 'Match failed ✗', {
        match: dvpRes.data.match,
        passed_checks: dvpRes.data.checks.filter(c => c.passed).length,
        total_checks: dvpRes.data.checks.length
      });
      await delay(1000);

      if (!dvpRes.data.match) {
        throw new Error('DvP verification failed');
      }

      addTimelineEvent('dvp_verification', 'completed', dvpRes.data.summary);

      // Step 7: Payment
      setCurrentStage('Releasing Payment...');
      addTimelineEvent('payment', 'in-progress');

      const paymentPayload = {
        po: poRes.data.po,
        dvp_report: dvpRes.data,
        escrow_keypair: {
          public: accounts.escrow.public,
          secret: accounts.escrow.secret // REAL CREDENTIALS - will make real payment
        }
      };
      
      logCommunication('DvP Agent', 'Payment Agent', 'POST', '/release', 'request', {
        amount_xlm: poRes.data.po.total_xlm,
        amount_usd: poRes.data.po.total_usd,
        from: accounts.escrow.public,
        to: accounts.seller.public,
        using_real_keys: true
      });
      await delay(800);
      
      const paymentRes = await axios.post(`${SERVICES.payment}/release`, paymentPayload);
      logResponse('Payment Agent', 'DvP Agent', 200, `Payment ${paymentRes.data.payment.status}`, {
        payment_id: paymentRes.data.payment_id,
        status: paymentRes.data.payment.status,
        amount_xlm: paymentRes.data.payment.amount_xlm
      });
      await delay(1000);
      
      if (paymentRes.data.payment_tx_id && paymentRes.data.payment.status === 'completed') {
        logCommunication('Payment Agent', 'Stellar Testnet', 'POST', 'payment(XLM)', 'stellar', {
          operation: 'payment',
          asset: 'XLM',
          amount: paymentRes.data.payment.amount_xlm,
          from: accounts.escrow.public,
          to: accounts.seller.public
        });
        await delay(1200);
        logResponse('Stellar Testnet', 'Payment Agent', 200, `TX: ${paymentRes.data.payment_tx_id.substring(0, 8)}...`, {
          tx_hash: paymentRes.data.payment_tx_id,
          explorer: paymentRes.data.stellar_explorer_url,
          settlement: 'COMPLETED'
        });
        await delay(1000);
      }

      addTimelineEvent('payment', 'completed', `Payment: ${paymentRes.data.payment_id}`);
      addTransaction('Payment', paymentRes.data.payment_tx_id, paymentRes.data.stellar_explorer_url);

      setCurrentStage('✅ Trade Complete!');

    } catch (err) {
      setError(err.message || 'An error occurred');
      addTimelineEvent('error', 'failed', err.message);
      setCurrentStage('❌ Trade Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🌟 Stellar Trade Flow</h1>
        <p>Agent-driven buyer→seller trade with Stellar Testnet escrow settlement</p>
      </header>

      <div className="container">
        {/* Agent Visualization */}
        {(currentStage || timeline.length > 0) && (
          <div className="visualization-section">
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'flow' ? 'active' : ''}`}
                onClick={() => setViewMode('flow')}
              >
                📊 Flow View
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'network' ? 'active' : ''}`}
                onClick={() => setViewMode('network')}
              >
                🕸️ Network View
              </button>
            </div>
            
            {viewMode === 'flow' ? (
              <AgentVisualizer 
                currentStage={currentStage} 
                timeline={timeline} 
                communications={communications}
              />
            ) : (
              <AgentNetworkGraph 
                currentStage={currentStage} 
                timeline={timeline}
                communications={communications}
              />
            )}
          </div>
        )}

        {/* Input Section */}
        <div className="card input-section">
          <h2>📝 Purchase Request</h2>
          <textarea
            className="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your purchase requirements..."
            rows={4}
            disabled={loading}
          />
          <button
            className={`start-button ${loading ? 'loading' : ''}`}
            onClick={startPurchase}
            disabled={loading}
          >
            {loading ? '⏳ Processing...' : '🚀 Start Purchase'}
          </button>
        </div>

        {/* Current Stage */}
        {currentStage && (
          <div className="card current-stage">
            <h3>{currentStage}</h3>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="card error-card">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Seller Card */}
        {seller && (
          <div className="card seller-card">
            <h2>🏭 Matched Seller</h2>
            <div className="seller-info">
              <h3>{seller.name}</h3>
              <p className="confidence">Confidence: {(seller.confidence * 100).toFixed(0)}%</p>
              <p className="description">{seller.description}</p>
              <div className="seller-details">
                <div className="detail">
                  <strong>LEI:</strong> {seller.lei}
                </div>
                <div className="detail">
                  <strong>Agent ID:</strong> {seller.agentID}
                </div>
                <div className="detail">
                  <strong>Capacity:</strong> {seller.capabilities?.min_quantity?.toLocaleString()} - {seller.capabilities?.max_quantity?.toLocaleString()} units
                </div>
                <div className="detail">
                  <strong>Lead Time:</strong> {seller.capabilities?.lead_time_days} days
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="card timeline-card">
            <h2>📊 Trade Timeline</h2>
            <div className="timeline">
              {timeline.map((event, idx) => (
                <div key={idx} className={`timeline-event ${event.status}`}>
                  <div className="timeline-marker">
                    {event.status === 'completed' ? '✅' : 
                     event.status === 'in-progress' ? '⏳' : '❌'}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-stage">{event.stage}</div>
                    <div className="timeline-details">{event.details}</div>
                    <div className="timeline-time">{event.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stellar Transactions */}
        {transactions.length > 0 && (
          <div className="card transactions-card">
            <h2>⭐ Stellar Testnet Transactions</h2>
            <div className="transactions">
              {transactions.map((tx, idx) => (
                <div key={idx} className="transaction">
                  <div className="tx-type">{tx.type}</div>
                  {tx.url ? (
                    <a href={tx.url} target="_blank" rel="noopener noreferrer" className="tx-link">
                      View on Stellar Expert →
                    </a>
                  ) : (
                    <span className="tx-simulated">Simulated (no keypair provided)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

