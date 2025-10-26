import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './design-system.css';
import './App.css';
import './typography.css';
import AgentVisualizer from './AgentVisualizer';
import AgentNetworkGraph from './AgentNetworkGraph';
import LoginScreen from './LoginScreen';
import MarketplaceTrades from './MarketplaceTrades';
import passkeyService from './services/PasskeyService';

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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accounts, setAccounts] = useState(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [seller, setSeller] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('flow'); // 'flow' or 'network'
  const [communications, setCommunications] = useState([]);
  const [activeTab, setActiveTab] = useState('trade'); // 'trade' or 'marketplace'
  const [savedTrades, setSavedTrades] = useState([]);
  const [walletBalance, setWalletBalance] = useState('0');

  // Load saved trades and authentication from localStorage on mount
  useEffect(() => {
    // Load trades
    const storedTrades = localStorage.getItem('stellarTrades');
    if (storedTrades) {
      try {
        setSavedTrades(JSON.parse(storedTrades));
      } catch (e) {
        console.error('Failed to load trades:', e);
      }
    }


    // Load authentication state
    const storedAuth = localStorage.getItem('stellarAuth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        setAccounts(authData.accounts);
        setIsAuthenticated(true);
        console.log('✅ Restored session from localStorage');
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    }
  }, []);

  // Save trades to localStorage whenever they change
  useEffect(() => {
    if (savedTrades.length > 0) {
      localStorage.setItem('stellarTrades', JSON.stringify(savedTrades));
    }
  }, [savedTrades]);

  // Save authentication state to localStorage
  useEffect(() => {
    if (isAuthenticated && accounts) {
      localStorage.setItem('stellarAuth', JSON.stringify({ accounts }));
    } else {
      localStorage.removeItem('stellarAuth');
    }
  }, [isAuthenticated, accounts]);

  // Fetch wallet balance when accounts are available
  useEffect(() => {
    const fetchWalletBalance = async () => {
      console.log('🔄 Fetching wallet balance...', { 
        hasAccounts: !!accounts, 
        hasBuyer: !!accounts?.buyer?.public, 
        hasPasskeyService: !!passkeyService 
      });
      
      if (accounts?.buyer?.public && passkeyService) {
        try {
          const balances = await passkeyService.getBalances();
          console.log('💰 Balances fetched:', balances);
          setWalletBalance(balances.buyer || '0');
        } catch (error) {
          console.error('❌ Error fetching wallet balance:', error);
          setWalletBalance('0');
        }
      } else {
        console.log('⚠️ Missing requirements for balance fetch:', {
          accounts: !!accounts,
          buyerPublic: !!accounts?.buyer?.public,
          passkeyService: !!passkeyService
        });
      }
    };

    fetchWalletBalance();
  }, [accounts, passkeyService]);

  const handleLoginSuccess = (createdAccounts) => {
    console.log('✅ Login successful! Accounts created:', createdAccounts);
    setAccounts(createdAccounts);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAccounts(null);
    setTimeline([]);
    setTransactions([]);
    setSeller(null);
    setError(null);
    setCommunications([]);
    setActiveTab('trade');
    setWalletBalance('0');
    localStorage.removeItem('stellarAuth');
    console.log('👋 Logged out - session cleared');
  };

  const refreshWalletBalance = async () => {
    if (accounts?.buyer?.public && passkeyService) {
      try {
        console.log('🔄 Manually refreshing wallet balance...');
        const balances = await passkeyService.getBalances();
        console.log('💰 Refreshed balances:', balances);
        setWalletBalance(balances.buyer || '0');
      } catch (error) {
        console.error('❌ Error refreshing wallet balance:', error);
        setWalletBalance('0');
      }
    }
  };


  const saveTrade = (tradeData) => {
    const newTrade = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...tradeData
    };
    setSavedTrades(prev => [newTrade, ...prev]);
    console.log('💾 Trade saved to marketplace:', newTrade.id);
    return newTrade.id;
  };

  const updateTrade = (tradeId, updates) => {
    console.log('🔄 updateTrade called for:', tradeId, 'with updates:', updates);
    
    setSavedTrades(prev => {
      const tradeIndex = prev.findIndex(t => t.id === tradeId);
      
      if (tradeIndex === -1) {
        console.warn('⚠️ Trade not found:', tradeId);
        return prev;
      }
      
      const trade = prev[tradeIndex];
      
      // Merge documents and transactions properly
      const mergedTrade = {
        ...trade,
        ...updates,
        documents: {
          ...(trade.documents || {}),
          ...(updates.documents || {})
        },
        transactions: updates.transactions || trade.transactions || [],
        timeline: updates.timeline || trade.timeline || [],
        lastUpdated: new Date().toISOString()
      };
      
      console.log('✅ Trade merged:', {
        id: tradeId,
        oldStatus: trade.status,
        newStatus: mergedTrade.status,
        oldStage: trade.currentStage,
        newStage: mergedTrade.currentStage,
        documents: mergedTrade.documents,
        transactionCount: mergedTrade.transactions?.length
      });
      
      const updated = [
        ...prev.slice(0, tradeIndex),
        mergedTrade,
        ...prev.slice(tradeIndex + 1)
      ];
      
      // Immediately save to localStorage for real-time sync
      localStorage.setItem('stellarTrades', JSON.stringify(updated));
      return updated;
    });
  };

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

    // Use local variable for trade ID (not state - avoids async issues)
    let activeTradeId = null;

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
        buyer: validationRes.data.buyer.entityName || validationRes.data.buyer.entity_name,
        seller: validationRes.data.seller.entityName || validationRes.data.seller.entity_name,
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

      // 💾 CREATE TRADE IN MARKETPLACE (appears immediately after PO)
      activeTradeId = saveTrade({
        status: 'in-progress',
        currentStage: 'PO Generated',
        buyer: {
          name: accounts.buyer.name,
          lei: accounts.buyer.lei,
          account: accounts.buyer.public
        },
        seller: {
          name: topSeller.name,
          lei: topSeller.lei,
          account: accounts.seller.public
        },
        product: startRes.data.parsed_request.product,
        quantity: startRes.data.parsed_request.quantity,
        unitPrice: startRes.data.parsed_request.unit_price_usd,
        totalUSD: poRes.data.po.total_usd,
        totalXLM: poRes.data.po.total_xlm,
        deliveryDate: startRes.data.parsed_request.delivery_date,
        documents: {
          po: poRes.data.po_id,
          ci: null,
          wr: null
        },
        transactions: [{
          type: 'PO',
          txId: poRes.data.po_tx_id,
          url: poRes.data.stellar_explorer_url,
          timestamp: new Date().toISOString()
        }],
        timeline: [...timeline]
      });
      console.log('💾 Trade created with ID:', activeTradeId);

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

      // 🔄 UPDATE TRADE: Fulfillment complete
      if (activeTradeId) {
        const allTransactions = [
          { type: 'PO', txId: poRes.data.po_tx_id, url: poRes.data.stellar_explorer_url, timestamp: new Date().toISOString() },
          { type: 'CI', txId: fulfillmentRes.data.ci_tx_id, url: fulfillmentRes.data.ci_explorer_url, timestamp: new Date().toISOString() },
          { type: 'WR', txId: fulfillmentRes.data.wr_tx_id, url: fulfillmentRes.data.wr_explorer_url, timestamp: new Date().toISOString() }
        ];
        
        updateTrade(activeTradeId, {
          status: 'in-progress',
          currentStage: 'Fulfillment Complete',
          documents: {
            po: poRes.data.po_id,
            ci: fulfillmentRes.data.ci_id,
            wr: fulfillmentRes.data.wr_id
          },
          transactions: allTransactions,
          timeline: [...timeline]
        });
      }

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

      // 🔄 UPDATE TRADE: DvP verification complete
      if (activeTradeId) {
        updateTrade(activeTradeId, {
          status: 'in-progress',
          currentStage: 'DvP Verified',
          dvpVerified: true,
          timeline: [...timeline]
        });
      }

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

      // 🔄 UPDATE TRADE: Mark as completed with ALL transactions
      if (activeTradeId) {
        const allFinalTransactions = [
          { type: 'PO', txId: poRes.data.po_tx_id, url: poRes.data.stellar_explorer_url, timestamp: new Date().toISOString() },
          { type: 'CI', txId: fulfillmentRes.data.ci_tx_id, url: fulfillmentRes.data.ci_explorer_url, timestamp: new Date().toISOString() },
          { type: 'WR', txId: fulfillmentRes.data.wr_tx_id, url: fulfillmentRes.data.wr_explorer_url, timestamp: new Date().toISOString() },
          { type: 'Payment', txId: paymentRes.data.payment_tx_id, url: paymentRes.data.stellar_explorer_url, timestamp: new Date().toISOString() }
        ];
        
        updateTrade(activeTradeId, {
          status: 'completed',
          currentStage: 'Completed',
          documents: {
            po: poRes.data.po_id,
            ci: fulfillmentRes.data.ci_id,
            wr: fulfillmentRes.data.wr_id
          },
          transactions: allFinalTransactions,
          timeline: [...timeline],
          completedAt: new Date().toISOString()
        });
      }

    } catch (err) {
      setError(err.message || 'An error occurred');
      addTimelineEvent('error', 'failed', err.message);
      setCurrentStage('❌ Trade Failed');
      
      // Capture whatever transactions were completed before failure
      const completedTransactions = transactions.map(tx => ({
        type: tx.type,
        txId: tx.txId,
        url: tx.url,
        timestamp: new Date().toISOString()
      }));
      
      console.log('💾 Saving failed trade with', completedTransactions.length, 'completed transactions');
      
      // 🔄 UPDATE TRADE: Mark as failed (or create if PO wasn't reached)
      if (activeTradeId) {
        updateTrade(activeTradeId, {
          status: 'failed',
          currentStage: 'Failed',
          error: err.message,
          timeline: [...timeline],
          transactions: completedTransactions, // Use actual completed transactions
          failedAt: new Date().toISOString()
        });
      } else {
        // Trade failed before PO was created
        saveTrade({
          status: 'failed',
          currentStage: 'Failed',
          buyer: {
            name: accounts.buyer.name,
            lei: accounts.buyer.lei,
            account: accounts.buyer.public
          },
          seller: seller ? {
            name: seller.name,
            lei: seller.lei,
            account: accounts.seller.public
          } : null,
          product: prompt.substring(0, 100),
          quantity: null,
          unitPrice: null,
          totalUSD: null,
          totalXLM: null,
          error: err.message,
          timeline: [...timeline],
          transactions: completedTransactions
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <h1>🌟 Stellar Integra</h1>
        <p>Agent-driven buyer→seller trade with Stellar Testnet escrow settlement</p>
          </div>
          <div className="header-actions">
            <div className="account-info">
              <div className="account-badge">
                🔐 <strong>{accounts.buyer.name}</strong>
              </div>
              <div className="account-address">{accounts.buyer.public.substring(0, 8)}...</div>
              <div className="wallet-balance">
                💰 {parseFloat(walletBalance).toLocaleString()} XLM
                <button 
                  className="refresh-balance-btn" 
                  onClick={refreshWalletBalance}
                  title="Refresh Balance"
                >
                  🔄
                </button>
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`tab-button ${activeTab === 'trade' ? 'active' : ''}`}
          onClick={() => setActiveTab('trade')}
        >
          <span className="tab-icon">🚀</span>
          <span>Trade Flow</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          <span className="tab-icon">📊</span>
          <span>Marketplace</span>
          {savedTrades.length > 0 && (
            <span className="trades-badge">{savedTrades.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'marketplace' ? (
        <MarketplaceTrades trades={savedTrades} />
      ) : (
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
              {timeline.map((event, idx) => {
                const getStageIcon = (stage) => {
                  const stageLower = stage.toLowerCase();
                  if (stageLower.includes('initiat')) return '🤵';
                  if (stageLower.includes('search')) return '🔍';
                  if (stageLower.includes('validat')) return '🔐';
                  if (stageLower.includes('po_gen') || stageLower.includes('purchase order')) return '📝';
                  if (stageLower.includes('fulfillment')) return '📦';
                  if (stageLower.includes('dvp') || stageLower.includes('verifying')) return '⚖️';
                  if (stageLower.includes('payment') || stageLower.includes('releasing')) return '💰';
                  return '📋';
                };

                const getStatusIcon = (status) => {
                  if (status === 'completed') return '✅';
                  if (status === 'in-progress') return '⏳';
                  return '❌';
                };

                return (
                <div key={idx} className={`timeline-event ${event.status}`}>
                  <div className="timeline-marker">
                      <span className="timeline-stage-icon">{getStageIcon(event.stage)}</span>
                      <span className="timeline-status-icon">{getStatusIcon(event.status)}</span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-stage">{event.stage}</div>
                    <div className="timeline-details">{event.details}</div>
                    <div className="timeline-time">{event.timestamp}</div>
                  </div>
                </div>
                );
              })}
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
      )}
    </div>
  );
}

export default App;

