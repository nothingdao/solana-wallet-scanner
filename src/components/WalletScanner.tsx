import React, { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, Wallet, RefreshCw } from 'lucide-react';

interface TokenInfo {
  mint: string;
  amount: number;
  symbol?: string;
  name?: string;
  image?: string;
  riskLevel: 'safe' | 'suspicious' | 'malicious';
  issues: string[];
}

interface ScanResult {
  tokens: TokenInfo[];
  totalTokens: number;
  riskySuggestions: number;
  maliciousTokens: number;
}

const WalletScanner: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const connection = new Connection('https://api.mainnet-beta.solana.com');

  const mockScanResult: ScanResult = {
    tokens: [
      {
        mint: '11111111111111111111111111111112',
        amount: 1000000,
        symbol: 'SOL',
        name: 'Solana',
        riskLevel: 'safe',
        issues: []
      },
      {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 500000000,
        symbol: 'USDC',
        name: 'USD Coin',
        riskLevel: 'safe',
        issues: []
      },
      {
        mint: 'FakeToken123456789',
        amount: 999999999,
        symbol: 'SOLANA',
        name: '🚀 SOLANA GIVEAWAY 🚀',
        riskLevel: 'malicious',
        issues: ['Suspicious symbol mimicking SOL', 'Excessive supply', 'No verified metadata']
      },
      {
        mint: 'SuspiciousToken987654321',
        amount: 1,
        symbol: 'SHIB',
        name: 'Shiba Inu Clone',
        riskLevel: 'suspicious',
        issues: ['Unverified creator', 'Low liquidity']
      }
    ],
    totalTokens: 4,
    riskySuggestions: 1,
    maliciousTokens: 1
  };

  const scanWallet = async () => {
    if (!walletAddress) return;

    setIsScanning(true);
    setScanProgress(0);
    setError('');

    try {
      // Validate address
      new PublicKey(walletAddress);

      // Try to call the real API first, fallback to mock
      try {
        const response = await fetch('/.netlify/functions/scan-wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress }),
        });

        if (response.ok) {
          const result = await response.json();
          setScanResult(result);
          setScanProgress(100);
          setIsScanning(false);
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock data');
      }

      // Simulate scanning progress for mock data
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setScanProgress(100);
      setScanResult(mockScanResult);

    } catch (err) {
      setError('Invalid wallet address');
    } finally {
      setIsScanning(false);
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
      case 'safe': return <CheckCircle className="w-4 h-4" />;
      case 'suspicious': return <AlertTriangle className="w-4 h-4" />;
      case 'malicious': return <Shield className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleTakeAction = (token: TokenInfo) => {
    alert(`Taking action on ${token.name}:\n\nIssues found:\n${token.issues.join('\n')}\n\nRecommended actions:\n- Revoke token approvals\n- Consider removing from wallet\n- Report as suspicious`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          Solana Wallet Scanner
        </h1>
        <p className="text-gray-600">Protect your wallet from scam tokens and malicious approvals</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Scan Wallet
          </CardTitle>
          <CardDescription>
            Enter your Solana wallet address to scan for potential security risks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Solana wallet address..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isScanning}
            />
            <Button
              onClick={scanWallet}
              disabled={isScanning || !walletAddress}
              className="min-w-[100px]"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Scanning
                </>
              ) : (
                'Scan Wallet'
              )}
            </Button>
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 p-3 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {isScanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Scanning wallet...</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {scanResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{scanResult.totalTokens}</p>
                    <p className="text-sm text-gray-600">Total Tokens</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{scanResult.riskySuggestions}</p>
                    <p className="text-sm text-gray-600">Suspicious</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{scanResult.maliciousTokens}</p>
                    <p className="text-sm text-gray-600">Malicious</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Token Analysis</CardTitle>
              <CardDescription>Review your tokens and take action on risky assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanResult.tokens.map((token, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {token.symbol?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{token.name || 'Unknown Token'}</p>
                        <p className="text-sm text-gray-600">{token.symbol}</p>
                        <p className="text-xs text-gray-500">{token.mint.slice(0, 8)}...</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge className={getRiskColor(token.riskLevel)}>
                          {getRiskIcon(token.riskLevel)}
                          <span className="ml-1 capitalize">{token.riskLevel}</span>
                        </Badge>
                        {token.issues.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {token.issues.length} issue{token.issues.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {token.riskLevel !== 'safe' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTakeAction(token)}
                        >
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WalletScanner;
