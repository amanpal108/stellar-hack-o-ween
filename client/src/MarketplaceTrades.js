import React, { useState, useEffect } from 'react';
import './MarketplaceTrades.css';
import TradeDetails from './TradeDetails';

function MarketplaceTrades({ trades }) {
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Debug: Log trades when component receives new props
  useEffect(() => {
    console.log('📊 Marketplace received', trades.length, 'trades');
    trades.forEach(trade => {
      console.log(`  Trade #${trade.id}: ${trade.status} - ${trade.currentStage}`);
    });
  }, [trades]);

  const getStatusBadge = (status, currentStage) => {
    const statusConfig = {
      completed: { icon: '✅', color: 'success', text: 'Completed' },
      failed: { icon: '❌', color: 'error', text: 'Failed' },
      'in-progress': { icon: '⏳', color: 'pending', text: currentStage || 'In Progress' },
      pending: { icon: '⏳', color: 'pending', text: 'Pending' },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (selectedTrade) {
    return (
      <TradeDetails 
        trade={selectedTrade} 
        onClose={() => setSelectedTrade(null)} 
      />
    );
  }

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h1>📊 Marketplace Trades</h1>
        <p className="marketplace-subtitle">
          All trade transactions recorded on Stellar Testnet
        </p>
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-label">Total Trades</span>
            <span className="stat-value">{trades.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Completed</span>
            <span className="stat-value success">{trades.filter(t => t.status === 'completed').length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">In Progress</span>
            <span className="stat-value pending">{trades.filter(t => t.status === 'in-progress').length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Failed</span>
            <span className="stat-value error">{trades.filter(t => t.status === 'failed').length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Volume</span>
            <span className="stat-value">
              ${trades.reduce((sum, t) => sum + (t.totalUSD || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="trades-list">
        {trades.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Trades Yet</h3>
            <p>Complete your first trade to see it listed here</p>
          </div>
        ) : (
          <>
            {trades.map((trade) => {
              const statusBadge = getStatusBadge(trade.status, trade.currentStage);
              
              return (
                <div 
                  key={trade.id} 
                  className={`trade-card ${trade.status}`}
                  onClick={() => setSelectedTrade(trade)}
                >
                  <div className="trade-card-header">
                    <div className="trade-id">
                      <span className="trade-label">Trade ID</span>
                      <span className="trade-value">#{trade.id}</span>
                    </div>
                    <div className={`status-badge ${statusBadge.color}`}>
                      <span>{statusBadge.icon}</span>
                      <span>{statusBadge.text}</span>
                    </div>
                  </div>

                  <div className="trade-card-body">
                    <div className="trade-parties">
                      <div className="party">
                        <span className="party-label">Buyer</span>
                        <span className="party-name">{trade.buyer?.name || 'Unknown'}</span>
                      </div>
                      <div className="arrow">→</div>
                      <div className="party">
                        <span className="party-label">Seller</span>
                        <span className="party-name">{trade.seller?.name || 'Not assigned'}</span>
                      </div>
                    </div>

                    <div className="trade-details-preview">
                      <div className="detail-row">
                        <span className="detail-label">Product:</span>
                        <span className="detail-value">{trade.product || 'N/A'}</span>
                      </div>
                      {trade.quantity && (
                        <div className="detail-row">
                          <span className="detail-label">Quantity:</span>
                          <span className="detail-value">{trade.quantity.toLocaleString()} units</span>
                        </div>
                      )}
                      {trade.totalUSD && (
                        <div className="detail-row">
                          <span className="detail-label">Total:</span>
                          <span className="detail-value highlight">
                            ${trade.totalUSD.toLocaleString()} {trade.totalXLM && `(${trade.totalXLM} XLM)`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="trade-card-footer">
                    <div className="trade-date">
                      <span className="date-icon">🕐</span>
                      <span>{formatDate(trade.timestamp)}</span>
                    </div>
                    <div className="transaction-count">
                      {trade.transactions?.length || 0} transactions on Stellar
                    </div>
                  </div>

                  <div className="click-hint">
                    Click to view details →
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default MarketplaceTrades;

