import React, { useEffect, useRef, useState } from 'react';
import './AgentNetworkGraph.css';

const AGENTS = [
  { id: 'buyer', name: 'Buyer', icon: '🤵', x: 50, y: 12 },
  { id: 'search', name: 'Search', icon: '🔍', x: 25, y: 30 },
  { id: 'validation', name: 'Validation', icon: '🔐', x: 75, y: 30 },
  { id: 'po', name: 'PO', icon: '📝', x: 35, y: 48 },
  { id: 'fulfillment', name: 'Fulfillment', icon: '📦', x: 65, y: 48 },
  { id: 'dvp', name: 'DvP', icon: '⚖️', x: 50, y: 66 },
  { id: 'payment', name: 'Payment', icon: '💰', x: 50, y: 88 }
];

const CONNECTIONS = [
  { from: 'buyer', to: 'search' },
  { from: 'buyer', to: 'validation' },
  { from: 'search', to: 'po' },
  { from: 'validation', to: 'po' },
  { from: 'po', to: 'fulfillment' },
  { from: 'fulfillment', to: 'dvp' },
  { from: 'dvp', to: 'payment' }
];

const AgentNetworkGraph = ({ currentStage, timeline, communications }) => {
  const canvasRef = useRef(null);
  const [activeConnections, setActiveConnections] = useState([]);

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

  const getCompletedAgents = () => {
    const completed = new Set();
    timeline.forEach(event => {
      if (event.status === 'completed') {
        const stage = event.stage.toLowerCase();
        if (stage.includes('initiat')) completed.add('buyer');
        if (stage.includes('search')) completed.add('search');
        if (stage.includes('validat')) completed.add('validation');
        if (stage.includes('po_gen')) completed.add('po');
        if (stage.includes('fulfillment')) completed.add('fulfillment');
        if (stage.includes('dvp')) completed.add('dvp');
        if (stage.includes('payment')) completed.add('payment');
      }
    });
    return completed;
  };

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
    return null;
  };

  // Monitor communications for active connections
  useEffect(() => {
    if (!communications || communications.length === 0) return;
    
    const latestComm = communications[0];
    if (latestComm.type === 'request') {
      const fromAgent = mapToAgentId(latestComm.from);
      const toAgent = mapToAgentId(latestComm.to);
      
      if (fromAgent && toAgent) {
        const connection = { from: fromAgent, to: toAgent, timestamp: Date.now() };
        setActiveConnections(prev => [connection, ...prev.slice(0, 2)]);
        
        setTimeout(() => {
          setActiveConnections(prev => prev.filter(c => c.timestamp !== connection.timestamp));
        }, 2000);
      }
    }
  }, [communications]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;

    const activeAgent = getActiveAgent();
    const completedAgents = getCompletedAgents();

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Draw connections
    CONNECTIONS.forEach(conn => {
      const fromAgent = AGENTS.find(a => a.id === conn.from);
      const toAgent = AGENTS.find(a => a.id === conn.to);
      
      const x1 = (fromAgent.x / 100) * w;
      const y1 = (fromAgent.y / 100) * h;
      const x2 = (toAgent.x / 100) * w;
      const y2 = (toAgent.y / 100) * h;

      const isActive = 
        (activeAgent === conn.to && completedAgents.has(conn.from)) ||
        (completedAgents.has(conn.from) && completedAgents.has(conn.to));

      const isCommunicating = activeConnections.some(
        ac => ac.from === conn.from && ac.to === conn.to
      );

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      
      if (isCommunicating) {
        ctx.strokeStyle = 'rgba(102, 126, 234, 1)';
        ctx.lineWidth = 5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#667eea';
      } else if (isActive) {
        ctx.strokeStyle = 'rgba(72, 187, 120, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();

      // Draw arrow
      if (isActive || isCommunicating) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLen = 12;
        const arrowX = x2 - Math.cos(angle) * 20;
        const arrowY = y2 - Math.sin(angle) * 20;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle - Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle + Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.strokeStyle = isCommunicating ? 'rgba(102, 126, 234, 1)' : 'rgba(72, 187, 120, 0.9)';
        ctx.lineWidth = isCommunicating ? 3 : 2;
        if (isCommunicating) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#667eea';
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw data packet for active communications
      if (isCommunicating) {
        const packetPos = 0.3 + (Date.now() % 1500) / 1500 * 0.4; // Animated position
        const packetX = x1 + (x2 - x1) * packetPos;
        const packetY = y1 + (y2 - y1) * packetPos;
        
        ctx.beginPath();
        ctx.arc(packetX, packetY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#667eea';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#667eea';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

  }, [currentStage, timeline, activeConnections]);

  const activeAgent = getActiveAgent();
  const completedAgents = getCompletedAgents();

  return (
    <div className="agent-network-graph">
      <canvas ref={canvasRef} className="network-canvas"></canvas>
      
      <div className="network-nodes">
        {AGENTS.map(agent => {
          const isActive = agent.id === activeAgent;
          const isCompleted = completedAgents.has(agent.id);
          
          return (
            <div
              key={agent.id}
              className={`network-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              style={{
                left: `${agent.x}%`,
                top: `${agent.y}%`
              }}
            >
              <div className="node-circle">
                <span className="node-icon">{agent.icon}</span>
                {isActive && <div className="node-pulse"></div>}
                {isCompleted && <div className="node-check">✓</div>}
              </div>
              <div className="node-label">{agent.name}</div>
            </div>
          );
        })}
      </div>

      {/* Stellar indicator */}
      {(completedAgents.has('po') || completedAgents.has('fulfillment') || completedAgents.has('payment')) && (
        <div className="stellar-overlay">
          <div className="stellar-particles">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              >⭐</div>
            ))}
          </div>
        </div>
      )}

      {/* Communication details overlay */}
      {communications && communications.length > 0 && (
        <div className="network-comm-overlay">
          {communications[0].type === 'request' && (
            <div className="network-comm-box request-box">
              <div className="comm-box-header">📤 Request</div>
              <div className="comm-box-content">
                <div className="comm-box-route">
                  {communications[0].from} → {communications[0].to}
                </div>
                <div className="comm-box-method">
                  {communications[0].method} {communications[0].endpoint}
                </div>
                {communications[0].data && (
                  <div className="comm-box-data">
                    <div className="comm-box-data-label">Payload:</div>
                    <pre>{communications[0].data}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {communications[0].type === 'response' && (
            <div className="network-comm-box response-box">
              <div className="comm-box-header">📥 Response</div>
              <div className="comm-box-content">
                <div className="comm-box-status">
                  <span className={`status-dot ${communications[0].status >= 200 && communications[0].status < 300 ? 'success' : 'error'}`}></span>
                  {communications[0].status} - {communications[0].message}
                </div>
                {communications[0].data && (
                  <div className="comm-box-data">
                    <div className="comm-box-data-label">Data:</div>
                    <pre>{communications[0].data}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {communications[0].type === 'stellar' && (
            <div className="network-comm-box stellar-box">
              <div className="comm-box-header">⭐ Stellar Transaction</div>
              <div className="comm-box-content">
                <div className="comm-box-route">
                  {communications[0].from} → Stellar Testnet
                </div>
                <div className="comm-box-method stellar-method">
                  {communications[0].endpoint}
                </div>
                {communications[0].data && (
                  <div className="comm-box-data">
                    <div className="comm-box-data-label">TX Details:</div>
                    <pre>{communications[0].data}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentNetworkGraph;

