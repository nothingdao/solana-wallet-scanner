import React from 'react';

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

interface TokenDisplayProps {
  token: TokenAccount;
  onAction: (action: string, token: TokenAccount) => void;
}

const MinimalTokenDisplay: React.FC<TokenDisplayProps> = ({ token, onAction }) => {
  const getRiskConfig = (riskLevel: string) => {
    const configs = {
      safe: { color: 'bg-green-100 text-green-800 border-green-200', icon: '✅' },
      suspicious: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚠️' },
      malicious: { color: 'bg-red-100 text-red-800 border-red-200', icon: '🚨' }
    };
    return configs[riskLevel as keyof typeof configs] || configs.safe;
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return price < 0.01 ? `$${price.toFixed(6)}` : `$${price.toFixed(2)}`;
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

  const riskConfig = getRiskConfig(token.riskLevel);

  return (
    <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Token Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Token Avatar */}
          <div className="relative flex-shrink-0">
            {token.image ? (
              <img
                src={token.image}
                alt={token.symbol}
                className="w-12 h-12 rounded-full border-2 border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  (target.nextElementSibling as HTMLElement).classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold ${token.image ? 'hidden' : ''}`}>
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
              <h3 className="font-semibold text-gray-900 truncate">
                {token.name || 'Unknown Token'}
              </h3>
              <span className="text-sm text-gray-500 font-medium">{token.symbol}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Balance: </span>
                <span className="font-medium">{token.uiAmount.toLocaleString()}</span>
              </div>
              {token.valueUsd && (
                <div>
                  <span className="text-gray-500">Value: </span>
                  <span className="font-medium">${token.valueUsd.toLocaleString()}</span>
                </div>
              )}
              {token.price && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Price: </span>
                  <span className="font-medium">{formatPrice(token.price)}</span>
                  {formatChange(token.priceChange24h)}
                </div>
              )}
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
        </div>

        {/* Right: Risk & Actions */}
        <div className="flex items-center gap-3 ml-4">
          {/* Risk Badge */}
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${riskConfig.color}`}>
            <span>{riskConfig.icon}</span>
            <span className="capitalize">{token.riskLevel}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {token.delegate && (
              <button
                onClick={() => onAction('revoke', token)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                title="Revoke token approval"
              >
                Revoke
              </button>
            )}

            {token.riskLevel === 'malicious' && (
              <button
                onClick={() => onAction('close', token)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                title="Close token account"
              >
                Remove
              </button>
            )}

            {/* Explorer Link */}
            <button
              onClick={() => window.open(`https://solscan.io/token/${token.mint}`, '_blank')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
              title="View on Solscan"
            >
              Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalTokenDisplay;
