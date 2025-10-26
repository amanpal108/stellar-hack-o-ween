import React, { useState } from 'react';
import './LoginScreen.css';
import passkeyService from './services/PasskeyService';

function LoginScreen({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState(null);
  const [showBiometric, setShowBiometric] = useState(false);

  const handleSetupAccount = async () => {
    console.log('🚀 Setup button clicked!');
    console.log('Current state before:', { loading, error });
    
    setLoading(true);
    setError(null);
    setProgress(0);
    setProgressMessage('Initializing...');

    try {
      // Step 1: Quick authentication check (no simulation)
      console.log('🔐 Checking authentication...');
      const authResult = await passkeyService.authenticateWithBiometric();
      
      if (!authResult || !authResult.success) {
        throw new Error('Authentication failed');
      }

      if (authResult.wallet) {
        console.log('✅ Real passkey authentication completed!');
        console.log('🔑 Wallet public key:', authResult.publicKey);
      } else {
        console.log('✅ Proceeding with wallet creation');
      }
      
      // Step 2: Initialize all wallets
      const accounts = await passkeyService.initializeAllWallets(
        (message, progressValue) => {
          setProgressMessage(message);
          setProgress(progressValue);
        }
      );

      // Step 3: Success!
      setProgressMessage('Setup Complete! 🎉');
      setProgress(100);
      
      // Wait a moment to show success message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Notify parent component
      onLoginSuccess(accounts);
      
    } catch (err) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to setup account');
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <div className="stellar-logo">
            <svg viewBox="0 0 100 100" className="stellar-icon">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3"/>
              <circle cx="50" cy="50" r="8" fill="currentColor"/>
              <circle cx="20" cy="50" r="5" fill="currentColor"/>
              <circle cx="80" cy="50" r="5" fill="currentColor"/>
              <circle cx="50" cy="20" r="5" fill="currentColor"/>
              <circle cx="50" cy="80" r="5" fill="currentColor"/>
              <line x1="50" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="2"/>
              <line x1="50" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2"/>
              <line x1="50" y1="50" x2="50" y2="20" stroke="currentColor" strokeWidth="2"/>
              <line x1="50" y1="50" x2="50" y2="80" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h1>🌟 Stellar Integra</h1>
          <p className="subtitle">Secure Multi-Agent Trading Platform</p>
        </div>

        <div className="login-content">
          {!loading && !error && (
            <div className="welcome-section">
              <h2>Welcome to Stellar Integra</h2>
              <p className="description">
                Experience seamless, agent-driven trade execution on the Stellar network 
                with biometric authentication and instant wallet setup.
              </p>
              

              <div className="wallet-info">
                <h3>What will be created:</h3>
                <ul>
                  <li>
                    <strong>Buyer Wallet</strong> - Tommy Hilfiger
                    <span className="badge">10,000 XLM</span>
                  </li>
                  <li>
                    <strong>Seller Wallet</strong> - Jupiter Knitting
                    <span className="badge">10,000 XLM</span>
                  </li>
                  <li>
                    <strong>Escrow Wallet</strong> - Marketplace Escrow
                    <span className="badge">10,000 XLM</span>
                  </li>
                </ul>
              </div>

              <button 
                className="setup-button"
                onClick={handleSetupAccount}
              >
                <span className="button-icon">🔐</span>
                <span>Setup Wallets & Start Trading</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="loading-section">
              <div className="progress-section">
                  <div className="progress-icon">⚙️</div>
                  <h3>{progressMessage}</h3>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{progress}%</p>
                  
                  <div className="status-messages">
                    {progress >= 20 && <div className="status-item completed">✅ Buyer wallet created</div>}
                    {progress >= 30 && <div className="status-item completed">✅ Buyer wallet funded</div>}
                    {progress >= 50 && <div className="status-item completed">✅ Seller wallet created</div>}
                    {progress >= 60 && <div className="status-item completed">✅ Seller wallet funded</div>}
                    {progress >= 80 && <div className="status-item completed">✅ Escrow wallet created</div>}
                    {progress >= 90 && <div className="status-item completed">✅ Escrow wallet funded</div>}
                    {progress === 100 && <div className="status-item completed">✅ All wallets ready!</div>}
                  </div>
                </div>
            </div>
          )}

          {error && (
            <div className="error-section">
              <div className="error-icon">❌</div>
              <h3>Setup Failed</h3>
              <p className="error-message">{error}</p>
              <button 
                className="retry-button"
                onClick={handleSetupAccount}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="login-footer">
          <p className="security-note">
            🔒 Your keys are generated locally and secured with device biometrics
          </p>
          <p className="network-info">
            Connected to: <strong>Stellar Testnet</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;

