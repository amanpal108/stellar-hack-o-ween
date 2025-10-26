import React from 'react';
import './TradeDetails.css';

function TradeDetails({ trade, onClose }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  return (
    <div className="trade-details-container">
      <div className="details-header">
        <button className="back-button" onClick={onClose}>
          ← Back to Marketplace
        </button>
      </div>

      <div className="details-content">
        <div className="details-title">
          <h2>Trade #{trade.id}</h2>
          <div className={`status-large ${trade.status}`}>
            {trade.status === 'completed' ? '✅ Completed' : 
             trade.status === 'failed' ? '❌ Failed' : '⏳ Pending'}
          </div>
        </div>

        {/* Same content as modal but in full page layout */}
        <div className="details-grid">
          {/* Left Column */}
          <div className="details-column">
            {/* Trade Parties */}
            <div className="detail-card">
              <h3>Trade Parties</h3>
              <div className="party-detail-full">
                {trade.buyer && (
                  <div className="party-section">
                    <div className="party-title">🏢 Buyer</div>
                    <div className="party-data">
                      <div><strong>Name:</strong> {trade.buyer.name}</div>
                      <div><strong>LEI:</strong> <code>{trade.buyer.lei}</code></div>
                      <div><strong>Account:</strong> <code className="small-code">{trade.buyer.account}</code></div>
                    </div>
                  </div>
                )}

                {trade.seller ? (
                  <div className="party-section">
                    <div className="party-title">🏭 Seller</div>
                    <div className="party-data">
                      <div><strong>Name:</strong> {trade.seller.name}</div>
                      <div><strong>LEI:</strong> <code>{trade.seller.lei}</code></div>
                      <div><strong>Account:</strong> <code className="small-code">{trade.seller.account}</code></div>
                    </div>
                  </div>
                ) : (
                  <div className="party-section">
                    <div className="party-title">🏭 Seller</div>
                    <div className="party-data">
                      <div className="no-data">Not assigned yet</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div className="detail-card">
              <h3>Order Information</h3>
              <div className="info-grid">
                {trade.product && (
                  <div className="info-item">
                    <span className="info-label">Product</span>
                    <span className="info-value">{trade.product}</span>
                  </div>
                )}
                {trade.quantity && (
                  <div className="info-item">
                    <span className="info-label">Quantity</span>
                    <span className="info-value">{trade.quantity.toLocaleString()} units</span>
                  </div>
                )}
                {trade.unitPrice && (
                  <div className="info-item">
                    <span className="info-label">Unit Price</span>
                    <span className="info-value">${trade.unitPrice} USD</span>
                  </div>
                )}
                {trade.totalUSD && (
                  <div className="info-item highlight-item">
                    <span className="info-label">Total (USD)</span>
                    <span className="info-value">${trade.totalUSD.toLocaleString()}</span>
                  </div>
                )}
                {trade.totalXLM && (
                  <div className="info-item highlight-item">
                    <span className="info-label">Total (XLM)</span>
                    <span className="info-value">{trade.totalXLM} XLM</span>
                  </div>
                )}
                {trade.deliveryDate && (
                  <div className="info-item">
                    <span className="info-label">Delivery Date</span>
                    <span className="info-value">{trade.deliveryDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="details-column">
            {/* Error Message (for failed trades) */}
            {trade.error && (
              <div className="detail-card error-card">
                <h3>❌ Error Details</h3>
                <div className="error-message">
                  {trade.error}
                </div>
              </div>
            )}

            {/* Documents */}
            {trade.documents && (trade.documents.po || trade.documents.ci || trade.documents.wr) && (
              <div className="detail-card">
                <h3>Trade Documents</h3>
                <div className="documents-list">
                  {trade.documents.po && (
                    <div className="doc-item">
                      <span className="doc-icon-large">📄</span>
                      <div className="doc-content">
                        <div className="doc-type-large">Purchase Order</div>
                        <div className="doc-id-large">{trade.documents.po}</div>
                      </div>
                    </div>
                  )}
                  {trade.documents.ci && (
                    <div className="doc-item">
                      <span className="doc-icon-large">📋</span>
                      <div className="doc-content">
                        <div className="doc-type-large">Commercial Invoice</div>
                        <div className="doc-id-large">{trade.documents.ci}</div>
                      </div>
                    </div>
                  )}
                  {trade.documents.wr && (
                    <div className="doc-item">
                      <span className="doc-icon-large">🏭</span>
                      <div className="doc-content">
                        <div className="doc-type-large">Warehouse Receipt</div>
                        <div className="doc-id-large">{trade.documents.wr}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stellar Transactions */}
            {trade.transactions && trade.transactions.length > 0 && (
              <div className="detail-card">
                <h3>Stellar Transactions ({trade.transactions.length})</h3>
                <div className="stellar-timeline">
                  {trade.transactions.map((tx, idx) => (
                    <div key={idx} className="stellar-timeline-step">
                      <div className="stellar-step-marker">
                        {tx.type === 'PO' ? '📄' : 
                         tx.type === 'CI' ? '📋' : 
                         tx.type === 'WR' ? '🏭' : 
                         tx.type === 'Payment' ? '💰' : '🔗'}
                      </div>
                      <div className="stellar-step-content">
                        <div className="stellar-step-name">{tx.type} Transaction</div>
                        {tx.url ? (
                          <a 
                            href={tx.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="stellar-tx-link"
                          >
                            <div className="stellar-tx-id">
                              {tx.txId ? `${tx.txId.substring(0, 8)}...${tx.txId.substring(tx.txId.length - 8)}` : 'View Transaction'}
                            </div>
                            <div className="stellar-explorer-badge">
                              <span>Stellar Expert</span>
                              <span className="stellar-arrow">↗</span>
                            </div>
                          </a>
                        ) : (
                          <div className="stellar-tx-simulated">Simulated Transaction</div>
                        )}
                        <div className="stellar-step-time">
                          {tx.timestamp ? formatDate(tx.timestamp) : 'Just now'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {trade.timeline && trade.timeline.length > 0 && (
              <div className="detail-card">
                <h3>Execution Timeline</h3>
                <div className="execution-timeline">
                  {trade.timeline.map((event, idx) => (
                    <div key={idx} className={`execution-step ${event.status}`}>
                      <div className="step-marker">
                        {event.status === 'completed' ? '✅' : 
                         event.status === 'in-progress' ? '⏳' : '❌'}
                      </div>
                      <div className="step-content">
                        <div className="step-name">{event.stage}</div>
                        {event.details && <div className="step-details">{event.details}</div>}
                        <div className="step-time">{event.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradeDetails;
