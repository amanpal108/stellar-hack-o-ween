import React, { useState, useEffect } from 'react';
import './AgentVisualizer.css';

const AGENTS = [
  { id: 'buyer', name: 'Buyer Agent', icon: '🤵', color: '#667eea', port: 3001 },
  { id: 'search', name: 'Search Agent', icon: '🔍', color: '#48bb78', port: 3002 },
  { id: 'validation', name: 'Validation Agent', icon: '🔐', color: '#ed8936', port: 3003 },
  { id: 'po', name: 'PO Agent', icon: '📝', color: '#9f7aea', port: 3004 },
  { id: 'fulfillment', name: 'Fulfillment Agent', icon: '📦', color: '#38b2ac', port: 3005 },
  { id: 'dvp', name: 'DvP Agent', icon: '⚖️', color: '#f56565', port: 3006 },
  { id: 'payment', name: 'Payment Agent', icon: '💰', color: '#ecc94b', port: 3007 }
];

const AgentVisualizer = ({ currentStage, timeline, communications }) => {
  const [activeConnections, setActiveConnections] = useState([]);
  // Determine active agent based on stage
  const getActiveAgent = () => {
    if (!currentStage) return null;
    
    const stage = currentStage.toLowerCase();
    if (stage.includes('initiat')) return 'buyer';
    if (stage.includes('search')) return 'search';
    if (stage.includes('validat')) return 'validation';
    if (stage.includes('purchase order')) return 'po';
    if (stage.includes('fulfillment')) return 'fulfillment';
    if (stage.includes('verifying') || stage.includes('documents')) return 'dvp';
    if (stage.includes('payment') || stage.includes('releasing')) return 'payment';
    return null;
  };

  const activeAgent = getActiveAgent();

  // Get completed agents based on timeline
  const completedAgents = new Set();
  timeline.forEach(event => {
    if (event.status === 'completed') {
      const stage = event.stage.toLowerCase();
      if (stage.includes('initiat')) completedAgents.add('buyer');
      if (stage.includes('search')) completedAgents.add('search');
      if (stage.includes('validat')) completedAgents.add('validation');
      if (stage.includes('po_gen')) completedAgents.add('po');
      if (stage.includes('fulfillment')) completedAgents.add('fulfillment');
      if (stage.includes('dvp')) completedAgents.add('dvp');
      if (stage.includes('payment')) completedAgents.add('payment');
    }
  });

  // Get current active index
  const activeIndex = activeAgent ? AGENTS.findIndex(a => a.id === activeAgent) : -1;

  // Monitor communications for active connections
  useEffect(() => {
    if (!communications || communications.length === 0) return;
    
    const latestComm = communications[0];
    if (latestComm.type === 'request' || latestComm.type === 'stellar') {
      // Map communication to agent connection
      const fromAgent = mapToAgentId(latestComm.from);
      const toAgent = mapToAgentId(latestComm.to);
      
      if (fromAgent && toAgent) {
        const connection = { from: fromAgent, to: toAgent, timestamp: Date.now() };
        setActiveConnections(prev => [connection, ...prev.slice(0, 2)]); // Keep last 3
        
        // Remove after animation completes
        setTimeout(() => {
          setActiveConnections(prev => prev.filter(c => c.timestamp !== connection.timestamp));
        }, 1500);
      }
    }
  }, [communications]);

  // Map communication names to agent IDs
  const mapToAgentId = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('buyer')) return 'buyer';
    if (lower.includes('search')) return 'search';
    if (lower.includes('validation')) return 'validation';
    if (lower.includes('po')) return 'po';
    if (lower.includes('fulfillment')) return 'fulfillment';
    if (lower.includes('dvp')) return 'dvp';
    if (lower.includes('payment')) return 'payment';
    if (lower.includes('stellar')) return 'stellar';
    return null;
  };

  // Check if connection is currently active
  const isConnectionActive = (fromId, toId) => {
    return activeConnections.some(conn => 
      conn.from === fromId && conn.to === toId
    );
  };

  return (
    <div className="agent-visualizer">
      <h2>🤖 Agent Network</h2>
      
      <div className="agent-flow">
        {AGENTS.map((agent, index) => {
          const isActive = agent.id === activeAgent;
          const isCompleted = completedAgents.has(agent.id);
          const isPending = !isActive && !isCompleted;
          
          return (
            <React.Fragment key={agent.id}>
              <div 
                className={`agent-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
                style={{ '--agent-color': agent.color }}
              >
                <div className="agent-icon">{agent.icon}</div>
                <div className="agent-name">{agent.name}</div>
                <div className="agent-port">:{agent.port}</div>
                
                {isActive && (
                  <div className="pulse-ring"></div>
                )}
                
                {isCompleted && (
                  <div className="check-mark">✓</div>
                )}
              </div>
              
              {index < AGENTS.length - 1 && (
                <div className={`agent-connector ${index < activeIndex || isCompleted ? 'active' : ''} ${isConnectionActive(agent.id, AGENTS[index + 1].id) ? 'communicating' : ''}`}>
                  <div className="connector-line"></div>
                  <div className="connector-arrow">→</div>
                  {isConnectionActive(agent.id, AGENTS[index + 1].id) && (
                    <div className="data-packet">📦</div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {activeAgent && (
        <div className="agent-status">
          <div className="status-pulse"></div>
          <span>
            <strong>{AGENTS.find(a => a.id === activeAgent)?.name}</strong> is processing...
          </span>
        </div>
      )}

      <div className="stellar-indicator">
        {(completedAgents.has('po') || completedAgents.has('fulfillment') || completedAgents.has('payment')) && (
          <>
            <div className="stellar-logo">⭐</div>
            <span>On-chain: </span>
            {completedAgents.has('po') && <span className="stellar-badge">PO</span>}
            {completedAgents.has('fulfillment') && (
              <>
                <span className="stellar-badge">CI</span>
                <span className="stellar-badge">WR</span>
              </>
            )}
            {completedAgents.has('payment') && <span className="stellar-badge">Payment</span>}
          </>
        )}
      </div>

      {/* Show latest communication with details */}
      {communications && communications.length > 0 && (
        <div className="comm-details-panel">
          <div className="comm-details-header">
            <span className="comm-indicator">📡</span>
            <span>Latest Communication</span>
          </div>
          
          {communications[0].type === 'request' && (
            <div className="comm-request">
              <div className="comm-flow">
                <span className="comm-from-badge">{communications[0].from}</span>
                <span className="comm-arrow">→</span>
                <span className="comm-to-badge">{communications[0].to}</span>
              </div>
              <div className="comm-method-line">
                <span className="method-badge">{communications[0].method}</span>
                <span className="endpoint-text">{communications[0].endpoint}</span>
              </div>
              {communications[0].data && (
                <div className="comm-data-section">
                  <div className="comm-data-label">📤 Request Payload:</div>
                  <pre className="comm-data-payload">{communications[0].data}</pre>
                </div>
              )}
              <div className="comm-timestamp">{communications[0].timestamp}</div>
            </div>
          )}
          
          {communications[0].type === 'response' && communications.length > 1 && (
            <div className="comm-response">
              <div className="comm-flow">
                <span className="comm-from-badge">{communications[0].from}</span>
                <span className="comm-arrow">←</span>
                <span className="comm-to-badge">{communications[0].to}</span>
              </div>
              <div className="response-status">
                <span className={`status-badge ${communications[0].status >= 200 && communications[0].status < 300 ? 'success' : 'error'}`}>
                  {communications[0].status}
                </span>
                <span className="response-message">{communications[0].message}</span>
              </div>
              {communications[0].data && (
                <div className="comm-data-section">
                  <div className="comm-data-label">📥 Response Data:</div>
                  <pre className="comm-data-payload">{communications[0].data}</pre>
                </div>
              )}
              <div className="comm-timestamp">{communications[0].timestamp}</div>
            </div>
          )}
          
          {communications[0].type === 'stellar' && (
            <div className="comm-stellar">
              <div className="comm-flow">
                <span className="comm-from-badge stellar">{communications[0].from}</span>
                <span className="comm-arrow">⭐</span>
                <span className="comm-to-badge stellar">Stellar Testnet</span>
              </div>
              <div className="comm-method-line">
                <span className="method-badge stellar">{communications[0].endpoint}</span>
              </div>
              {communications[0].data && (
                <div className="comm-data-section">
                  <div className="comm-data-label">⭐ Transaction Details:</div>
                  <pre className="comm-data-payload">{communications[0].data}</pre>
                </div>
              )}
              {communications[0].message && (
                <div className="stellar-tx">{communications[0].message}</div>
              )}
              <div className="comm-timestamp">{communications[0].timestamp}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentVisualizer;

