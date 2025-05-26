import { Handler } from '@netlify/functions'
import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

// Known scam token database - in production, this would be a proper database
const KNOWN_SCAM_TOKENS = new Set([
  'FakeToken123456789',
  'SuspiciousToken987654321',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  // Add more known scam tokens here
])

const SUSPICIOUS_KEYWORDS = [
  'giveaway',
  'free',
  'airdrop',
  'claim',
  'winner',
  'bonus',
  'reward',
  'prize',
  'lottery',
  'jackpot',
  '🚀',
  '💰',
  '🎁',
  'tesla',
  'musk',
  'official',
  'verified',
]

// Common token impersonation targets
const COMMON_TOKENS = {
  SOL: '11111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  SRM: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
}

interface TokenMetadata {
  name?: string
  symbol?: string
  image?: string
  description?: string
  website?: string
  twitter?: string
}

interface TokenInfo {
  mint: string
  amount: number
  decimals: number
  uiAmount: number
  symbol?: string
  name?: string
  image?: string
  riskLevel: 'safe' | 'suspicious' | 'malicious'
  issues: string[]
  delegate?: string
  closeAuthority?: string
  freezeAuthority?: string
  supply?: number
}

interface NFTInfo {
  mint: string
  name?: string
  image?: string
  collection?: string
  riskLevel: 'safe' | 'suspicious' | 'malicious'
  issues: string[]
}

interface ScanResult {
  tokens: TokenInfo[]
  nfts: NFTInfo[]
  totalTokens: number
  totalNFTs: number
  suspiciousTokens: number
  maliciousTokens: number
  delegateApprovals: number
  riskScore: number
  recommendations: string[]
}

// Fetch token metadata from multiple sources
async function fetchTokenMetadata(mint: string): Promise<TokenMetadata> {
  const sources = [
    {
      url: `https://api.solana.fm/v1/tokens/${mint}`,
      parser: (data: any) => ({
        name: data.name,
        symbol: data.symbol,
        image: data.image,
        description: data.description,
      }),
    },
    {
      url: `https://public-api.solscan.io/token/meta?tokenAddress=${mint}`,
      parser: (data: any) => ({
        name: data.name,
        symbol: data.symbol,
        image: data.icon,
        description: data.description,
      }),
    },
  ]

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Solana-Wallet-Scanner/1.0',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const metadata = source.parser(data)
        if (metadata.name || metadata.symbol) {
          return metadata
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata from ${source.url}:`, error)
      continue
    }
  }

  return {}
}

// Assess token risk level
function assessTokenRisk(
  mint: string,
  metadata: TokenMetadata,
  tokenAccount: any,
  supply?: number
): { riskLevel: 'safe' | 'suspicious' | 'malicious'; issues: string[] } {
  const issues: string[] = []
  let riskLevel: 'safe' | 'suspicious' | 'malicious' = 'safe'

  // Check against known scam list
  if (KNOWN_SCAM_TOKENS.has(mint)) {
    return { riskLevel: 'malicious', issues: ['Known scam token'] }
  }

  // Check for missing metadata
  if (!metadata.name && !metadata.symbol) {
    riskLevel = 'suspicious'
    issues.push('No metadata available')
  }

  // Check for suspicious keywords
  const nameToCheck = (metadata.name || '').toLowerCase()
  const symbolToCheck = (metadata.symbol || '').toLowerCase()
  const descToCheck = (metadata.description || '').toLowerCase()

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (
      nameToCheck.includes(keyword) ||
      symbolToCheck.includes(keyword) ||
      descToCheck.includes(keyword)
    ) {
      riskLevel = riskLevel === 'safe' ? 'suspicious' : riskLevel
      issues.push(`Contains suspicious keyword: "${keyword}"`)
    }
  }

  // Check for token impersonation
  for (const [commonSymbol, legitimateMint] of Object.entries(COMMON_TOKENS)) {
    if (
      metadata.symbol?.toUpperCase() === commonSymbol &&
      mint !== legitimateMint
    ) {
      riskLevel = 'malicious'
      issues.push(`Attempting to impersonate ${commonSymbol}`)
    }
  }

  // Check for delegate authority
  if (tokenAccount.delegate) {
    riskLevel = riskLevel === 'safe' ? 'suspicious' : riskLevel
    issues.push('Has active delegate approval')
  }

  // Check for freeze authority (potential rug pull vector)
  if (tokenAccount.freezeAuthority && tokenAccount.freezeAuthority !== mint) {
    riskLevel = riskLevel === 'safe' ? 'suspicious' : riskLevel
    issues.push('Token can be frozen by external authority')
  }

  // Check for extremely high supply
  if (supply && supply > 1000000000000) {
    riskLevel = riskLevel === 'safe' ? 'suspicious' : riskLevel
    issues.push('Extremely high token supply')
  }

  // Check for zero decimal tokens (potential NFT spam)
  if (tokenAccount.decimals === 0 && tokenAccount.uiAmount > 1000) {
    riskLevel = 'suspicious'
    issues.push('High quantity of non-divisible tokens')
  }

  // Check for suspicious Unicode characters
  if (metadata.name && /[\u200B-\u200D\uFEFF]/.test(metadata.name)) {
    riskLevel = 'suspicious'
    issues.push('Contains invisible Unicode characters')
  }

  return { riskLevel, issues }
}

// Calculate overall risk score
function calculateRiskScore(tokens: TokenInfo[], nfts: NFTInfo[]): number {
  const allAssets = [...tokens, ...nfts]
  if (allAssets.length === 0) return 0

  let totalRiskPoints = 0
  for (const asset of allAssets) {
    switch (asset.riskLevel) {
      case 'malicious':
        totalRiskPoints += 10
        break
      case 'suspicious':
        totalRiskPoints += 5
        break
      case 'safe':
        totalRiskPoints += 0
        break
    }
  }

  // Normalize to 0-100 scale
  const maxPossibleRisk = allAssets.length * 10
  return Math.round((totalRiskPoints / maxPossibleRisk) * 100)
}

// Generate security recommendations
function generateRecommendations(scanResult: Partial<ScanResult>): string[] {
  const recommendations: string[] = []

  if (scanResult.maliciousTokens && scanResult.maliciousTokens > 0) {
    recommendations.push(
      '🚨 Immediately close accounts containing malicious tokens'
    )
    recommendations.push(
      '🔍 Review recent transactions for unauthorized activity'
    )
  }

  if (scanResult.delegateApprovals && scanResult.delegateApprovals > 0) {
    recommendations.push('⚠️ Revoke unnecessary token delegate approvals')
    recommendations.push('🔒 Only approve delegates from trusted protocols')
  }

  if (scanResult.suspiciousTokens && scanResult.suspiciousTokens > 0) {
    recommendations.push('🔍 Research suspicious tokens before interacting')
    recommendations.push(
      '📊 Check token metrics on Solscan or similar explorers'
    )
  }

  // General security recommendations
  recommendations.push('🛡️ Use a hardware wallet for large holdings')
  recommendations.push('🔄 Regularly scan your wallet for new threats')
  recommendations.push('📱 Be cautious of unexpected tokens or NFTs')

  return recommendations
}

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { walletAddress } = JSON.parse(event.body || '{}')

    if (!walletAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Wallet address is required' }),
      }
    }

    // Validate wallet address
    let publicKey: PublicKey
    try {
      publicKey = new PublicKey(walletAddress)
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid wallet address' }),
      }
    }

    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )

    // Get all token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    )

    const tokens: TokenInfo[] = []
    const nfts: NFTInfo[] = []
    let delegateCount = 0

    // Process each token account
    for (const account of tokenAccounts.value) {
      const tokenInfo = account.account.data.parsed.info

      // Skip accounts with zero balance
      if (tokenInfo.tokenAmount.uiAmount === 0) continue

      const mint = tokenInfo.mint

      // Fetch metadata
      const metadata = await fetchTokenMetadata(mint)

      // Check if it's an NFT (decimals = 0, amount = 1)
      const isNFT =
        tokenInfo.tokenAmount.decimals === 0 &&
        tokenInfo.tokenAmount.uiAmount === 1

      // Count delegate approvals
      if (tokenInfo.delegate) {
        delegateCount++
      }

      // Assess risk
      const { riskLevel, issues } = assessTokenRisk(mint, metadata, tokenInfo)

      if (isNFT) {
        nfts.push({
          mint,
          name: metadata.name || 'Unknown NFT',
          image: metadata.image,
          riskLevel,
          issues,
        })
      } else {
        tokens.push({
          mint,
          amount: parseInt(tokenInfo.tokenAmount.amount),
          decimals: tokenInfo.tokenAmount.decimals,
          uiAmount: tokenInfo.tokenAmount.uiAmount || 0,
          symbol: metadata.symbol || 'UNKNOWN',
          name: metadata.name || 'Unknown Token',
          image: metadata.image,
          riskLevel,
          issues,
          delegate: tokenInfo.delegate,
          closeAuthority: tokenInfo.closeAuthority,
          freezeAuthority: tokenInfo.freezeAuthority,
        })
      }
    }

    // Calculate statistics
    const allAssets = [...tokens, ...nfts]
    const suspiciousCount = allAssets.filter(
      (asset) => asset.riskLevel === 'suspicious'
    ).length
    const maliciousCount = allAssets.filter(
      (asset) => asset.riskLevel === 'malicious'
    ).length
    const riskScore = calculateRiskScore(tokens, nfts)

    const scanResult: ScanResult = {
      tokens,
      nfts,
      totalTokens: tokens.length,
      totalNFTs: nfts.length,
      suspiciousTokens: suspiciousCount,
      maliciousTokens: maliciousCount,
      delegateApprovals: delegateCount,
      riskScore,
      recommendations: generateRecommendations({
        maliciousTokens: maliciousCount,
        suspiciousTokens: suspiciousCount,
        delegateApprovals: delegateCount,
      }),
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scanResult),
    }
  } catch (error) {
    console.error('Scan error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to scan wallet',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}
