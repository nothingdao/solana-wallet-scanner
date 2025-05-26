import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  WalletMultiButton,
  WalletDisconnectButton
} from '@solana/wallet-adapter-react-ui';

// Types
interface TokenAccount {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
  image?: string;
  price?: number;
  priceChange24h?: number;
  valueUsd?: number;
  riskLevel: 'safe' | 'suspicious' | 'malicious';
  issues: string[];
  delegate?: string;
  verified?: boolean;
}

interface ScanResult {
  tokens: TokenAccount[];
  totalTokens: number;
  suspiciousTokens: number;
  maliciousTokens: number;
  delegateApprovals: number;
  totalValueUsd?: number;
  riskScore?: number;
}

// Mock data for demo
const mockScanResult: ScanResult = {
  tokens: [
    {
      mint: '11111111111111111111111111111112',
      amount: 1000000000,
      decimals: 9,
      uiAmount: 1.0,
      symbol: 'SOL',
      name: 'Solana',
      riskLevel: 'safe',
      issues: [],
      price: 89.31,
      priceChange24h: -4.14,
      valueUsd: 89.31,
      verified: true
    },
    {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: 500000000,
      decimals: 6,
      uiAmount: 500.0,
      symbol: 'USDC',
      name: 'USD Coin',
      riskLevel: 'safe',
      issues: [],
      price: 1.00,
      priceChange24h: 0.01,
      valueUsd: 500.00,
      verified: true
    },
    {
      mint: 'FakeToken123456789',
      amount: 999999999,
      decimals: 9,
      uiAmount: 999.999999,
      symbol: 'SOLANA',
      name: '🚀 SOLANA GIVEAWAY 🚀',
      riskLevel: 'malicious',
      issues: ['Suspicious symbol mimicking SOL', 'Excessive supply', 'No verified metadata'],
      delegate: 'malicious-delegate-address',
      price: 0.000001,
      valueUsd: 0.001,
      verified: false
    }
  ],
  totalTokens: 3,
  suspiciousTokens: 0,
  maliciousTokens: 1,
  delegateApprovals: 1,
  totalValueUsd: 589.31,
  riskScore: 25
};

const MinimalWalletScanner: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const scanWallet = async () => {
    if (!publicKey || !connected) return;

    setIsScanning(true);
    setAlert(null);

    // Simulate scanning
    setTimeout(() => {
      setScanResult(mockScanResult);
      setAlert({
        message: `Scan complete! Found ${mockScanResult.maliciousTokens} threats`,
        type: mockScanResult.maliciousTokens > 0 ? 'error' : 'success'
      });
      setIsScanning(false);
    }, 2000);
  };

  const handleAction = (action: string, token: TokenAccount) => {
    setAlert({
      message: `${action === 'revoke' ? 'Revoking approval' : 'Closing account'} for ${token.symbol}...`,
      type: 'info'
    });
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      safe: 'bg-green-100 text-green-800 border-green-200',
      suspicious: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      malicious: 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      safe: '✅',
      suspicious: '⚠️',
      malicious: '🚨'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[risk as keyof typeof colors]}`}>
        {icons[risk as keyof typeof icons]} {risk.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Wallet Security Scanner</h1>
        <p className="text-gray-600">Protect your Solana wallet from scams and threats</p>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`rounded-lg p-4 ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          alert.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
          <div className="flex justify-between items-center">
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="text-lg leading-none opacity-70 hover:opacity-100">×</button>
          </div>
        </div>
      )}

      {/* Wallet Connection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center space-y-4">
        <div className="flex justify-center gap-3">
          <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !rounded-lg !font-medium" />
          {connected && <WalletDisconnectButton className="!bg-gray-600 hover:!bg-gray-700 !rounded-lg !font-medium" />}
        </div>

        {connected && publicKey && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </div>
            <button
              onClick={scanWallet}
              disabled={isScanning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isScanning ? 'Scanning...' : 'Scan Wallet'}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {scanResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{scanResult.totalTokens}</div>
              <div className="text-sm text-gray-600">Tokens</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{scanResult.totalTokens - scanResult.suspiciousTokens - scanResult.maliciousTokens}</div>
              <div className="text-sm text-gray-600">Safe</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{scanResult.suspiciousTokens}</div>
              <div className="text-sm text-gray-600">Suspicious</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{scanResult.maliciousTokens}</div>
              <div className="text-sm text-gray-600">Malicious</div>
            </div>
          </div>

          {/* Portfolio Value */}
          {scanResult.totalValueUsd && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white text-center">
              <div className="text-sm font-medium text-blue-100 mb-1">Total Value</div>
              <div className="text-3xl font-bold">${scanResult.totalValueUsd.toLocaleString()}</div>
              {scanResult.riskScore && (
                <div className="text-sm text-blue-100 mt-2">
                  Risk Score: {scanResult.riskScore}/100
                </div>
              )}
            </div>
          )}

          {/* Security Alerts */}
          {(scanResult.maliciousTokens > 0 || scanResult.delegateApprovals > 0) && (
            <div className="space-y-3">
              {scanResult.maliciousTokens > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <span className="text-lg">🚨</span>
                    <span className="font-medium">
                      {scanResult.maliciousTokens} malicious token{scanResult.maliciousTokens > 1 ? 's' : ''} detected
                    </span>
                  </div>
                </div>
              )}

              {scanResult.delegateApprovals > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-800">
                    <span className="text-lg">⚠️</span>
                    <span className="font-medium">
                      {scanResult.delegateApprovals} active delegate approval{scanResult.delegateApprovals > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Token List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Token Details</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {scanResult.tokens.map((token, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Token Icon */}
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {token.symbol?.charAt(0) || '?'}
                      </div>

                      {/* Token Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{token.name}</span>
                          <span className="text-sm text-gray-500">{token.symbol}</span>
                          {token.verified && <span className="text-blue-500 text-xs">✓</span>}
                        </div>
                        <div className="text-sm text-gray-600">
                          {token.uiAmount.toLocaleString()} tokens
                          {token.valueUsd && (
                            <span className="ml-2">
                              (${token.valueUsd.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Risk & Actions */}
                    <div className="flex items-center gap-3">
                      {getRiskBadge(token.riskLevel)}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {token.delegate && (
                          <button
                            onClick={() => handleAction('revoke', token)}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium"
                          >
                            Revoke
                          </button>
                        )}

                        {token.riskLevel === 'malicious' && (
                          <button
                            onClick={() => handleAction('close', token)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Issues */}
                  {token.issues.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {token.issues.map((issue, i) => (
                        <div key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                          <span>⚠️</span>
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalWalletScanner;
