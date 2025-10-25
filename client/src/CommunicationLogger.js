import React, { useState, useEffect } from 'react';
import './CommunicationLogger.css';

const CommunicationLogger = ({ communications }) => {
  const [visible, setVisible] = useState(true);

  return (
    <div className={`communication-logger ${visible ? 'visible' : 'collapsed'}`}>
      <div className="logger-header">
        <span className="logger-title">📡 Real-Time Agent Communication</span>
        <button 
          className="toggle-logger"
          onClick={() => setVisible(!visible)}
        >
          {visible ? '−' : '+'}
        </button>
      </div>
      
      {visible && (
        <div className="logger-content">
          {communications.length === 0 ? (
            <div className="logger-empty">
              <span>Waiting for agent communication...</span>
            </div>
          ) : (
            <div className="communication-list">
              {communications.map((comm, idx) => (
                <div 
                  key={idx} 
                  className={`communication-item ${comm.type}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="comm-header">
                    <span className="comm-from">{comm.from}</span>
                    <span className="comm-arrow">→</span>
                    <span className="comm-to">{comm.to}</span>
                    <span className="comm-time">{comm.timestamp}</span>
                  </div>
                  <div className="comm-body">
                    <span className="comm-method">{comm.method}</span>
                    <span className="comm-endpoint">{comm.endpoint}</span>
                  </div>
                  {comm.status && (
                    <div className="comm-status">
                      <span className={`status-badge ${comm.status >= 200 && comm.status < 300 ? 'success' : 'error'}`}>
                        {comm.status}
                      </span>
                      <span className="comm-message">{comm.message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunicationLogger;

