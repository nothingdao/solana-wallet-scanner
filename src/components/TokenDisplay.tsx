import React from 'react';

interface EnhancedTokenAccount {
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

interface TokenDisplayProps {
  token: EnhancedTokenAccount;
  onAction: (action: string, token: EnhancedTokenAccount) => void;
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({ token, onAction }) => {
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

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change?: number) => {
    if (change === undefined || change === null) return null;
    const isPositive = change >= 0;
    return (
      <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    );
  };

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`;
    return `$${marketCap.toFixed(2)}`;
  };

  return (
    <div className="p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        {/* Token Info */}
        <div className="flex items-start space-x-4 flex-1">
          {/* Token Image/Icon */}
          <div className="relative">
            {token.image ? (
              <img
                src={token.image}
                alt={token.symbol}
                className="w-12 h-12 rounded-full border-2 border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling!.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg ${token.image ? 'hidden' : ''}`}>
              {token.symbol?.charAt(0) || '?'}
            </div>
            {token.verified && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>

          {/* Token Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {token.name || 'Unknown Token'}
              </h3>
              <span className="text-sm text-gray-500 font-medium">
                {token.symbol}
              </span>
            </div>

            {/* Balance and Value */}
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Balance</p>
                <p className="font-medium text-gray-900">
                  {token.uiAmount.toLocaleString()} {token.symbol}
                </p>
              </div>
              {token.valueUsd && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Value</p>
                  <p className="font-medium text-gray-900">
                    ${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>

            {/* Price Information */}
            {token.price && (
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{formatPrice(token.price)}</span>
                    {formatChange(token.priceChange24h)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                  <p className="font-medium text-gray-900">{formatMarketCap(token.marketCap)}</p>
                </div>
              </div>
            )}

            {/* Additional Market Data */}
            {(token.volume24h || token.liquidity) && (
              <div className="grid grid-cols-2 gap-4 mb-2">
                {token.volume24h && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">24h Volume</p>
                    <p className="font-medium text-gray-900">{formatMarketCap(token.volume24h)}</p>
                  </div>
                )}
                {token.liquidity && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Liquidity</p>
                    <p className="font-medium text-gray-900">{formatMarketCap(token.liquidity)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 mb-2">
              {token.website && (
                <a
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                >
                  🌐 Website
                </a>
              )}
              {token.twitter && (
                <a
                  href={token.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                >
                  🐦 Twitter
                </a>
              )}
              <button
                onClick={() => window.open(`https://solscan.io/token/${token.mint}`, '_blank')}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
              >
                🔍 Explorer
              </button>
            </div>

            {/* Token Address */}
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1">Token Address</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(token.mint)}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Issues */}
            {token.issues.length > 0 && (
              <div className="space-y-1">
                {token.issues.map((issue, i) => (
                  <div key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Risk Level and Actions */}
        <div className="flex flex-col items-end space-y-3 ml-4">
          {/* Risk Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(token.riskLevel)}`}>
            <span className="text-base">{getRiskIcon(token.riskLevel)}</span>
            <span className="capitalize">{token.riskLevel}</span>
          </div>

          {/* Additional Status */}
          {token.delegate && (
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium">
              🔓 Has delegate approval
            </div>
          )}

          {token.verified && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium">
              ✅ Verified token
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {token.delegate && (
              <button
                onClick={() => onAction('revoke', token)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs transition-colors"
              >
                🔒 Revoke Approval
              </button>
            )}

            {(token.riskLevel === 'malicious' || token.riskLevel === 'suspicious') && (
              <button
                onClick={() => onAction('close', token)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
              >
                🗑️ Close Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDisplay;
