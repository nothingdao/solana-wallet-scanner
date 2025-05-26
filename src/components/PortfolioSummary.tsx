import React from 'react';

interface PortfolioSummaryProps {
  totalValueUsd: number;
  totalTokens: number;
  totalNFTs: number;
  suspiciousTokens: number;
  maliciousTokens: number;
  delegateApprovals: number;
  riskScore: number;
  topTokens: Array<{
    symbol: string;
    name: string;
    valueUsd?: number;
    priceChange24h?: number;
  }>;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  totalValueUsd,
  totalTokens,
  totalNFTs,
  suspiciousTokens,
  maliciousTokens,
  delegateApprovals,
  riskScore,
  topTokens
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-600 bg-green-100';
    if (score <= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 30) return 'Low Risk';
    if (score <= 60) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Value */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-blue-100 mb-1">Total Portfolio Value</h2>
            <p className="text-3xl font-bold">{formatCurrency(totalValueUsd)}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Risk Score</div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(riskScore)}`}>
              {riskScore}/100 - {getRiskLabel(riskScore)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{totalTokens}</div>
          <div className="text-sm text-gray-600 font-medium">Tokens</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{totalNFTs}</div>
          <div className="text-sm text-gray-600 font-medium">NFTs</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">{suspiciousTokens}</div>
          <div className="text-sm text-gray-600 font-medium">Suspicious</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{maliciousTokens}</div>
          <div className="text-sm text-gray-600 font-medium">Malicious</div>
        </div>
      </div>

      {/* Top Holdings */}
      {topTokens.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-lg">Top Holdings</h3>
          </div>
          <div className="p-4 space-y-3">
            {topTokens.slice(0, 5).map((token, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {token.symbol?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{token.name}</div>
                    <div className="text-xs text-gray-500">{token.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {token.valueUsd ? formatCurrency(token.valueUsd) : 'N/A'}
                  </div>
                  {token.priceChange24h !== undefined && token.priceChange24h !== null && (
                    <div className={`text-xs ${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Alerts */}
      {(delegateApprovals > 0 || maliciousTokens > 0 || suspiciousTokens > 0) && (
        <div className="space-y-3">
          {maliciousTokens > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🚨</span>
                <h4 className="font-semibold text-red-800">Critical Security Alert</h4>
              </div>
              <p className="text-red-700 text-sm">
                {maliciousTokens} malicious token{maliciousTokens > 1 ? 's' : ''} detected.
                Immediate action recommended to protect your funds.
              </p>
            </div>
          )}

          {delegateApprovals > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <h4 className="font-semibold text-orange-800">Active Delegate Approvals</h4>
              </div>
              <p className="text-orange-700 text-sm">
                {delegateApprovals} token{delegateApprovals > 1 ? 's have' : ' has'} active delegate approvals.
                Consider revoking unused approvals for better security.
              </p>
            </div>
          )}

          {suspiciousTokens > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔍</span>
                <h4 className="font-semibold text-yellow-800">Suspicious Tokens Detected</h4>
              </div>
              <p className="text-yellow-700 text-sm">
                {suspiciousTokens} token{suspiciousTokens > 1 ? 's' : ''} flagged as suspicious.
                Research these tokens before making any transactions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Risk Score Breakdown */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4">Security Risk Assessment</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Overall Risk Score</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${riskScore <= 30 ? 'bg-green-500' :
                    riskScore <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
              <span className="font-bold text-lg">{riskScore}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalTokens - suspiciousTokens - maliciousTokens}</div>
              <div className="text-xs text-gray-500">Safe Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{suspiciousTokens}</div>
              <div className="text-xs text-gray-500">Suspicious</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{maliciousTokens}</div>
              <div className="text-xs text-gray-500">Malicious</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
