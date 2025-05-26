import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  WalletMultiButton,
  WalletDisconnectButton
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

// Mock data
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
      tokenAccount: 'mock-account-1',
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
      tokenAccount: 'mock-account-2',
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
      tokenAccount: 'mock-account-3',
      price: 0.000001,
      valueUsd: 0.001,
      verified: false
    },
    {
      mint: 'SuspiciousToken987654321',
      amount: 1000000,
      decimals: 6,
      uiAmount: 1.0,
      symbol: 'SHIB',
      name: 'Shiba Inu Clone',
      riskLevel: 'suspicious',
      issues: ['Unverified creator', 'Low liquidity'],
      tokenAccount: 'mock-account-4',
      price: 0.00001,
      valueUsd: 0.00001,
      verified: false
    }
  ],
  nfts: [
    {
      mint: 'NFT123456789',
      name: 'Suspicious NFT Collection',
      riskLevel: 'suspicious',
      issues: ['Unverified collection', 'Suspicious metadata']
    }
  ],
  totalTokens: 4,
  totalNFTs: 1,
  suspiciousTokens: 1,
  maliciousTokens: 1,
  delegateApprovals: 1,
  totalValueUsd: 589.31,
  riskScore: 35,
  recommendations: [
    '🚨 Immediately revoke delegate approval for malicious token',
    '🗑️ Close accounts containing scam tokens',
    '🔍 Research suspicious tokens before interacting'
  ]
};

const CompactWalletScanner: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const scanWallet = async () => {
    if (!publicKey || !connected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setError('');
    setAlert(null);

    try {
      // Try real API first
      try {
        setScanProgress(10);
        const response = await fetch('/.netlify/functions/scan-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: publicKey.toString() }),
        });

        setScanProgress(50);

        if (response.ok) {
          const result = await response.json();
          setScanProgress(100);
          setScanResult(result);
          setAlert({
            message: `Scan completed! Found ${result.totalTokens} tokens with ${result.maliciousTokens} malicious and ${result.suspiciousTokens} suspicious.`,
            type: 'info'
          });
          setIsScanning(false);
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock data for demo');
      }

      // Fallback to mock data with progress simulation
      const progressSteps = [20, 40, 60, 80, 95, 100];
      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setScanProgress(step);
      }

      setScanResult(mockScanResult);
      setAlert({
        message: 'Demo scan completed! This is using mock data. Deploy to Netlify for real scanning.',
        type: 'info'
      });

    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to scan wallet. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleActionSuccess = (message: string) => {
    setAlert({ message, type: 'success' });
  };

  const handleActionError = (message: string) => {
    setAlert({ message, type: 'error' });
  };

  const handleTokenAction = (action: string, token: TokenAccount) => {
    if (action === 'revoke') {
      handleActionSuccess(`Revoking approval for ${token.symbol}...`);
    } else if (action === 'close') {
      handleActionSuccess(`Closing account for ${token.symbol}...`);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'suspicious': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'malicious': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return '✅';
      case 'suspicious': return '⚠️';
      case 'malicious': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          🛡️ Solana Wallet Security Scanner
        </h1>
        <p className="text-gray-600 mt-1">
          Protect your wallet from scam tokens, malicious approvals, and security threats
        </p>
      </div>

      {/* Alerts */}
      {alert && (
        <TransactionAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Wallet Connection & Scan */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex gap-3">
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !rounded-lg" />
            {connected && <WalletDisconnectButton className="!bg-gray-600 hover:!bg-gray-700 !rounded-lg" />}
          </div>

          {connected && publicKey && (
            <>
              <div className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded border border-green-200">
                Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </div>
              <button
                onClick={scanWallet}
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded font-medium transition-colors"
              >
                {isScanning ? '🔄 Scanning...' : '🔍 Scan Wallet'}
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
            <p className="text-red-800 flex items-center gap-2">
              <span>❌</span>
              {error}
            </p>
          </div>
        )}

        {isScanning && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Scanning wallet for threats...</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {scanResult && (
        <div className="space-y-4">
          {/* Portfolio Summary - Compact */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-100">Total Portfolio Value</div>
                <div className="text-2xl font-bold">${scanResult.totalValueUsd?.toLocaleString() || '0'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100">Risk Score</div>
                <div className="text-xl font-bold">{scanResult.riskScore || 0}/100</div>
              </div>
            </div>
          </div>

          {/* Summary Cards - Compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded border p-3 text-center">
              <div className="text-xl font-bold text-blue-600">{scanResult.totalTokens}</div>
              <div className="text-xs text-gray-600">Tokens</div>
            </div>
            <div className="bg-white rounded border p-3 text-center">
              <div className="text-xl font-bold text-green-600">{scanResult.totalTokens - scanResult.suspiciousTokens - scanResult.maliciousTokens}</div>
              <div className="text-xs text-gray-600">Safe</div>
            </div>
            <div className="bg-white rounded border p-3 text-center">
              <div className="text-xl font-bold text-yellow-600">{scanResult.suspiciousTokens}</div>
              <div className="text-xs text-gray-600">Suspicious</div>
            </div>
            <div className="bg-white rounded border p-3 text-center">
              <div className="text-xl font-bold text-red-600">{scanResult.maliciousTokens}</div>
              <div className="text-xs text-gray-600">Malicious</div>
            </div>
          </div>

          {/* Security Alerts - Compact */}
          {(scanResult.maliciousTokens > 0 || scanResult.delegateApprovals > 0 || scanResult.suspiciousTokens > 0) && (
            <div className="space-y-2">
              {scanResult.maliciousTokens > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex items-center gap-2 text-red-800 text-sm">
                    <span>🚨</span>
                    <span className="font-medium">
                      {scanResult.maliciousTokens} malicious token{scanResult.maliciousTokens > 1 ? 's' : ''} detected
                    </span>
                  </div>
                </div>
              )}

              {scanResult.delegateApprovals > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <div className="flex items-center gap-2 text-orange-800 text-sm">
                    <span>⚠️</span>
                    <span className="font-medium">
                      {scanResult.delegateApprovals} active delegate approval{scanResult.delegateApprovals > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {scanResult.suspiciousTokens > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <span>🔍</span>
                    <span className="font-medium">
                      {scanResult.suspiciousTokens} suspicious token{scanResult.suspiciousTokens > 1 ? 's' : ''} flagged
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations - Compact */}
          {scanResult.recommendations && scanResult.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="font-medium text-blue-800 mb-2 text-sm">Security Recommendations</h4>
              <ul className="space-y-1">
                {scanResult.recommendations.map((rec, index) => (
                  <li key={index} className="text-blue-700 text-xs flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Token List - Compact */}
          <div className="bg-white rounded border">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-medium text-gray-900">Token Analysis ({scanResult.totalTokens} tokens)</h3>
            </div>

            <div className="divide-y max-h-96 overflow-y-auto">
              {scanResult.tokens.map((token, index) => (
                <TokenDisplay
                  key={index}
                  token={token}
                  onAction={handleTokenAction}
                />
              ))}

              {scanResult.tokens.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No tokens found in this wallet
                </div>
              )}
            </div>
          </div>

          {/* NFT List - Compact */}
          {scanResult.nfts.length > 0 && (
            <div className="bg-white rounded border">
              <div className="p-3 border-b bg-gray-50">
                <h3 className="font-medium text-gray-900">NFT Analysis ({scanResult.totalNFTs} NFTs)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
                {scanResult.nfts.map((nft, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                      {nft.image ? (
                        <img src={nft.image} alt={nft.name} className="w-full h-full object-cover rounded" />
                      ) : (
                        <div className="text-gray-400 text-2xl">🖼️</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm truncate">{nft.name || 'Unknown NFT'}</div>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(nft.riskLevel)}`}>
                        <span>{getRiskIcon(nft.riskLevel)}</span>
                        <span className="capitalize">{nft.riskLevel}</span>
                      </div>
                      {nft.issues.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {nft.issues.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactWalletScanner;
