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

const CompactTokenDisplay: React.FC<TokenDisplayProps> = ({ token, onAction }) => {
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

  const formatChange = (change?: number | null) => {
    if (change === undefined || change === null || isNaN(change)) return null;
    const isPositive = change >= 0;
    return (
      <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    );
  };

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(1)}K`;
    return `$${marketCap.toFixed(0)}`;
  };

  return (
    <div className="p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Token Icon */}
        <div className="relative flex-shrink-0">
          {token.image ? (
            <img
              src={token.image}
              alt={token.symbol}
              className="w-10 h-10 rounded-full border border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling!.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm ${token.image ? 'hidden' : ''}`}>
            {token.symbol?.charAt(0) || '?'}
          </div>
          {token.verified && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate text-sm">
              {token.name || 'Unknown Token'}
            </h3>
            <span className="text-xs text-gray-500 font-medium">{token.symbol}</span>
          </div>

          {/* Primary Data Row */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>
              <span className="font-medium text-gray-900">{token.uiAmount.toLocaleString()}</span> {token.symbol}
            </span>
            {token.valueUsd && (
              <span>
                <span className="font-medium text-gray-900">${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
            )}
            {token.price && (
              <div className="flex items-center gap-1">
                <span>{formatPrice(token.price)}</span>
                {formatChange(token.priceChange24h)}
              </div>
            )}
          </div>

          {/* Secondary Data Row */}
          {(token.marketCap || token.volume24h || token.liquidity) && (
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              {token.marketCap && <span>MC: {formatMarketCap(token.marketCap)}</span>}
              {token.volume24h && <span>Vol: {formatMarketCap(token.volume24h)}</span>}
              {token.liquidity && <span>Liq: {formatMarketCap(token.liquidity)}</span>}
            </div>
          )}

          {/* Links Row */}
          <div className="flex items-center gap-3 mt-1">
            {token.website && (
              <a
                href={token.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                🌐
              </a>
            )}
            {token.twitter && (
              <a
                href={token.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                🐦
              </a>
            )}
            <button
              onClick={() => window.open(`https://solscan.io/token/${token.mint}`, '_blank')}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              🔍
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(token.mint)}
              className="text-gray-400 hover:text-gray-600 text-xs"
              title="Copy address"
            >
              📋
            </button>
          </div>

          {/* Issues */}
          {token.issues.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                ⚠️ {token.issues[0]}
                {token.issues.length > 1 && ` (+${token.issues.length - 1} more)`}
              </div>
            </div>
          )}
        </div>

        {/* Risk & Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Risk Badge */}
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(token.riskLevel)}`}>
            <span className="text-sm">{getRiskIcon(token.riskLevel)}</span>
            <span className="capitalize">{token.riskLevel}</span>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-col gap-1">
            {token.delegate && (
              <div className="text-xs text-orange-600 bg-orange-50 px-1 py-0.5 rounded">
                🔓 Delegate
              </div>
            )}
            {token.verified && (
              <div className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                ✅ Verified
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1">
            {token.delegate && (
              <button
                onClick={() => onAction('revoke', token)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                Revoke
              </button>
            )}

            {(token.riskLevel === 'malicious' || token.riskLevel === 'suspicious') && (
              <button
                onClick={() => onAction('close', token)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactTokenDisplay;
