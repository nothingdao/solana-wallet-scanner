import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  WalletMultiButton,
  WalletDisconnectButton
} from '@solana/wallet-adapter-react-ui';
import WalletActions from './WalletActions';
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
  riskScore?: number;
  recommendations?: string[];
}

// Mock data for fallback when API is not available
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
      tokenAccount: 'mock-account-1'
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
      tokenAccount: 'mock-account-2'
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
      tokenAccount: 'mock-account-3'
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
      tokenAccount: 'mock-account-4'
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
  riskScore: 35,
  recommendations: [
    '🚨 Immediately revoke delegate approval for malicious token',
    '🗑️ Close accounts containing scam tokens',
    '🔍 Research suspicious tokens before interacting'
  ]
};

const WalletScanner: React.FC = () => {
  const { connection } = useConnection();
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
      // Try to call the real API first
      try {
        setScanProgress(10);
        const response = await fetch('/.netlify/functions/scan-wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

      // Fallback to mock data with realistic progress simulation
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          🛡️ Solana Wallet Security Scanner
        </h1>
        <p className="text-gray-600 text-lg">
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

      {/* Wallet Connection */}
      <div className="bg-white rounded-lg border p-6 text-center space-y-4">
        <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
        <p className="text-gray-600">
          Connect your Solana wallet to scan for security threats
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !rounded-lg" />
          {connected && <WalletDisconnectButton className="!bg-gray-600 hover:!bg-gray-700 !rounded-lg" />}
        </div>

        {connected && publicKey && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✅ Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </p>
          </div>
        )}
      </div>

      {/* Scan Section */}
      {connected && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Scan Your Wallet</h3>
            <button
              onClick={scanWallet}
              disabled={isScanning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
            >
              {isScanning ? '🔄 Scanning...' : '🔍 Start Security Scan'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 flex items-center gap-2">
                <span className="text-lg">❌</span>
                {error}
              </p>
            </div>
          )}

          {isScanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Scanning wallet for threats...</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan Results */}
      {scanResult && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{scanResult.totalTokens}</div>
              <div className="text-sm text-gray-600 font-medium">Tokens</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{scanResult.totalNFTs}</div>
              <div className="text-sm text-gray-600 font-medium">NFTs</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{scanResult.suspiciousTokens}</div>
              <div className="text-sm text-gray-600 font-medium">Suspicious</div>
            </div>
            <div className="bg-white rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{scanResult.maliciousTokens}</div>
              <div className="text-sm text-gray-600 font-medium">Malicious</div>
            </div>
          </div>

          {/* Risk Score */}
          {scanResult.riskScore !== undefined && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">Security Risk Score</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${scanResult.riskScore <= 30 ? 'bg-green-500' :
                        scanResult.riskScore <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${scanResult.riskScore}%` }}
                    />
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {scanResult.riskScore}/100
                </div>
              </div>
            </div>
          )}

          {/* Delegate Approvals Warning */}
          {scanResult.delegateApprovals > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Active Delegate Approvals Detected
              </h4>
              <p className="text-orange-700">
                You have {scanResult.delegateApprovals} tokens with active delegate approvals.
                These can be revoked to improve security.
              </p>
            </div>
          )}

          {/* Recommendations */}
          {scanResult.recommendations && scanResult.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-800 mb-3">Security Recommendations</h4>
              <ul className="space-y-2">
                {scanResult.recommendations.map((rec, index) => (
                  <li key={index} className="text-blue-700 text-sm flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Token List */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Token Analysis</h3>
              <p className="text-gray-600">Review your tokens and take action on risky assets</p>
            </div>

            <div className="divide-y">
              {scanResult.tokens.map((token, index) => (
                <div key={index} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold">
                      {token.symbol?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{token.name}</div>
                      <div className="text-sm text-gray-600 font-medium">{token.symbol}</div>
                      <div className="text-xs text-gray-500">
                        Amount: {token.uiAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                      </div>
                      {token.issues.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {token.issues.map((issue, i) => (
                            <div key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              {issue}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(token.riskLevel)}`}>
                        <span className="text-base">{getRiskIcon(token.riskLevel)}</span>
                        <span className="capitalize">{token.riskLevel}</span>
                      </div>
                      {token.delegate && (
                        <div className="text-xs text-orange-600 mt-1 font-medium">
                          Has delegate approval
                        </div>
                      )}
                    </div>

                    {(token.riskLevel !== 'safe' || token.delegate) && (
                      <WalletActions
                        token={token}
                        onSuccess={handleActionSuccess}
                        onError={handleActionError}
                      />
                    )}
                  </div>
                </div>
              ))}

              {scanResult.tokens.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No tokens found in this wallet
                </div>
              )}
            </div>
          </div>

          {/* NFT List */}
          {scanResult.nfts.length > 0 && (
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold">NFT Analysis</h3>
                <p className="text-gray-600">Review your NFTs for potential risks</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {scanResult.nfts.map((nft, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      {nft.image ? (
                        <img src={nft.image} alt={nft.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="text-gray-400 text-4xl">🖼️</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium truncate">{nft.name || 'Unknown NFT'}</div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(nft.riskLevel)}`}>
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

export default WalletScanner;
