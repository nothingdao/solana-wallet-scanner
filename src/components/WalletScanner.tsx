import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import TokenDisplay from './TokenDisplay';
import TransactionAlert from './TransactionAlert';

// Types
interface TokenAccount {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
  image?: string;
  description?: string;
  website?: string;
  twitter?: string;
  verified?: boolean;
  price?: number;
  priceChange24h?: number;
  marketCap?: number;
  volume24h?: number;
  liquidity?: number;
  valueUsd?: number;
  riskLevel: 'safe' | 'suspicious' | 'malicious';
  issues: string[];
  delegate?: string;
  closeAuthority?: string;
  tokenAccount?: string;
}

interface NFTAccount {
  mint: string;
  name?: string;
  image?: string;
  collection?: string;
  riskLevel: 'safe' | 'suspicious' | 'malicious';
  issues: string[];
}

interface ScanResult {
  tokens: TokenAccount[];
  nfts: NFTAccount[];
  totalTokens: number;
  totalNFTs: number;
  suspiciousTokens: number;
  maliciousTokens: number;
  delegateApprovals: number;
  totalValueUsd?: number;
  riskScore?: number;
  recommendations?: string[];
}

const WalletScanner: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const handleScan = async () => {
    if (!publicKey || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    setScanning(true);
    setError('');
    setAlert(null);

    try {
      const response = await fetch('/.netlify/functions/scan-wallet', {
        method: 'POST',
        body: JSON.stringify({ walletAddress: publicKey.toString() })
      });
      
      const result = await response.json();
      setScanResult(result);
      setAlert({
        message: `Scan completed! Found ${result.totalTokens} tokens with ${result.maliciousTokens} malicious and ${result.suspiciousTokens} suspicious.`,
        type: 'info'
      });
    } catch (error) {
      console.error('Scan failed:', error);
      setError('Failed to scan wallet. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleActionSuccess = (message: string) => {
    setAlert({ message, type: 'success' });
  };

  const handleTokenAction = (action: string, token: TokenAccount) => {
    if (action === 'revoke') {
      handleActionSuccess(`Revoking approval for ${token.symbol}...`);
    } else if (action === 'close') {
      handleActionSuccess(`Closing account for ${token.symbol}...`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Solana Wallet Security Scanner</h1>
        <p className="text-gray-600 mb-6">
          Scan your wallet for scam tokens and malicious approvals
        </p>
        <WalletMultiButton />
      </div>

      {publicKey && (
        <div className="text-center">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : 'Scan Wallet'}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
          <p className="text-red-800 flex items-center gap-2">
            <span>❌</span>
            {error}
          </p>
        </div>
      )}

      {alert && (
        <TransactionAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {scanning && (
        <div className="flex flex-col items-center mt-8">
          <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <div className="text-blue-600 font-medium">Scanning wallet, please wait...</div>
        </div>
      )}

      {scanResult && (
        <div className="mt-8 space-y-4">
          {scanResult.tokens.length === 0 && (
            <div className="text-gray-500">No tokens found in this wallet.</div>
          )}
          {scanResult.tokens.map(token => (
            <TokenDisplay
              key={token.tokenAccount || token.mint}
              token={token}
              onAction={handleTokenAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletScanner;
