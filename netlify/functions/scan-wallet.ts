import { Handler } from '@netlify/functions'
import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { fetchMetadata, findMetadataPda } from '@metaplex-foundation/mpl-token-metadata'
import { publicKey } from '@metaplex-foundation/umi'
import { base58 } from '@metaplex-foundation/umi/serializers'

// Enhanced token metadata sources
const METADATA_SOURCES = [
  {
    name: 'Jupiter Token List',
    url: 'https://token.jup.ag/all',
    cache: null as any,
    parser: (data: any, mint: string) => {
      const token = data.find((t: any) => t.address === mint)
      return token
        ? {
            name: token.name,
            symbol: token.symbol,
            image: token.logoURI,
            decimals: token.decimals,
            description: token.description,
            website: token.extensions?.website,
            twitter: token.extensions?.twitter,
            coingeckoId: token.extensions?.coingeckoId,
            verified: token.verified || false,
          }
        : null
    },
  },
  {
    name: 'Solana Token List',
    url: 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json',
    cache: null as any,
    parser: (data: any, mint: string) => {
      const token = data.tokens?.find((t: any) => t.address === mint)
      return token
        ? {
            name: token.name,
            symbol: token.symbol,
            image: token.logoURI,
            decimals: token.decimals,
            verified: true, // Solana official list
          }
        : null
    },
  },
  {
    name: 'CoinGecko',
    url: `https://api.coingecko.com/api/v3/coins/solana/contract/{mint}`,
    cache: new Map(),
    parser: (data: any, mint: string) => {
      if (data.error) return null
      return {
        name: data.name,
        symbol: data.symbol?.toUpperCase(),
        image: data.image?.large || data.image?.small,
        description: data.description?.en,
        website: data.links?.homepage?.[0],
        twitter: data.links?.twitter_screen_name
          ? `https://twitter.com/${data.links.twitter_screen_name}`
          : null,
        marketCap: data.market_data?.market_cap?.usd,
        price: data.market_data?.current_price?.usd,
        priceChange24h: data.market_data?.price_change_percentage_24h,
        verified: true,
      }
    },
  },
  {
    name: 'DexScreener',
    url: 'https://api.dexscreener.com/latest/dex/tokens/{mint}',
    cache: new Map(),
    parser: (data: any, mint: string) => {
      const pair = data.pairs?.[0]
      if (!pair) return null
      return {
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        price: parseFloat(pair.priceUsd) || 0,
        priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
        volume24h: parseFloat(pair.volume?.h24) || 0,
        liquidity: parseFloat(pair.liquidity?.usd) || 0,
        marketCap: parseFloat(pair.fdv) || 0,
        dexScreenerUrl: pair.url,
      }
    },
  },
]

// Token price and market data
async function getTokenPriceData(mint: string) {
  try {
    const promises = [
      // CoinGecko
      fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${mint}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
      ),
      // DexScreener
      fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`),
    ]

    const [coingeckoRes, dexRes] = await Promise.allSettled(promises)

    let priceData: any = {}

    // Parse CoinGecko data
    if (coingeckoRes.status === 'fulfilled' && coingeckoRes.value.ok) {
      const cgData = await coingeckoRes.value.json()
      const tokenData = cgData[mint.toLowerCase()]
      if (tokenData) {
        priceData.price = tokenData.usd
        priceData.priceChange24h = tokenData.usd_24h_change
        priceData.marketCap = tokenData.usd_market_cap
      }
    }

    // Parse DexScreener data
    if (dexRes.status === 'fulfilled' && dexRes.value.ok) {
      const dsData = await dexRes.value.json()
      const pair = dsData.pairs?.[0]
      if (pair) {
        priceData.price = priceData.price || parseFloat(pair.priceUsd)
        priceData.volume24h = parseFloat(pair.volume?.h24) || 0
        priceData.liquidity = parseFloat(pair.liquidity?.usd) || 0
        priceData.dexScreenerUrl = pair.url
      }
    }

    return priceData
  } catch (error) {
    console.warn('Failed to fetch price data:', error)
    return {}
  }
}

// Add this function to fetch Metaplex metadata
async function fetchMetaplexMetadataUmi(mint: string) {
  try {
    // Create Umi instance with mplTokenMetadata plugin
    const umi = createUmi(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com')
      .use(mplTokenMetadata());
    
    // Convert mint string to Umi PublicKey
    const mintPublicKey = publicKey(mint);
    
    // Get the PDA for the metadata account
    const metadataPda = findMetadataPda(umi, { mint: mintPublicKey });
    
    // Fetch metadata from the PDA
    const metadata = await fetchMetadata(umi, metadataPda);
    if (!metadata) return null;

    // Convert Uint8Array name/symbol/uri to string and trim
    const name = Buffer.from(metadata.name).toString('utf8').replace(/\0/g, '').trim();
    const symbol = Buffer.from(metadata.symbol).toString('utf8').replace(/\0/g, '').trim();
    const uri = Buffer.from(metadata.uri).toString('utf8').replace(/\0/g, '').trim();

    let extraMetadata = {};
    if (uri) {
      try {
        const response = await fetch(uri);
        if (response.ok) {
          const jsonMetadata = await response.json();
          extraMetadata = {
            description: jsonMetadata.description,
            image: jsonMetadata.image,
            website: jsonMetadata.external_url,
          };
        }
      } catch (error) {
        console.warn('Failed to fetch token URI metadata:', error);
      }
    }

    return {
      name: name || null,
      symbol: symbol || null,
      ...extraMetadata,
    };
  } catch (error) {
    console.warn('Failed to fetch Metaplex metadata (Umi):', error);
    return null;
  }
}

// Enhanced metadata fetching with multiple sources
async function fetchEnhancedTokenMetadata(mint: string, connection: Connection) {
  const metadata: any = {
    mint,
    name: null,
    symbol: null,
    image: null,
    decimals: null,
    description: null,
    website: null,
    twitter: null,
    verified: false,
    price: null,
    priceChange24h: null,
    marketCap: null,
    volume24h: null,
    liquidity: null,
  }

  // Fetch from Jupiter Token List (most comprehensive for Solana)
  try {
    const jupiterRes = await fetch('https://token.jup.ag/all')
    if (jupiterRes.ok) {
      const jupiterTokens = await jupiterRes.json()
      const token = jupiterTokens.find((t: any) => t.address === mint)
      if (token) {
        metadata.name = token.name
        metadata.symbol = token.symbol
        metadata.image = token.logoURI
        metadata.decimals = token.decimals
        metadata.verified = token.verified || false
        metadata.description = token.description
        if (token.extensions) {
          metadata.website = token.extensions.website
          metadata.twitter = token.extensions.twitter
          metadata.coingeckoId = token.extensions.coingeckoId
        }
      }
    }
  } catch (error) {
    console.warn('Jupiter API failed:', error)
  }

  // Fallback to Solana Token List for official tokens
  if (!metadata.name) {
    try {
      const solanaListRes = await fetch(
        'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json'
      )
      if (solanaListRes.ok) {
        const solanaList = await solanaListRes.json()
        const token = solanaList.tokens?.find((t: any) => t.address === mint)
        if (token) {
          metadata.name = token.name
          metadata.symbol = token.symbol
          metadata.image = token.logoURI
          metadata.decimals = token.decimals
          metadata.verified = true // Official Solana list
        }
      }
    } catch (error) {
      console.warn('Solana token list failed:', error)
    }
  }

  // Try Metaplex metadata if we don't have a name yet
  if (!metadata.name) {
    try {
      const metaplexData = await fetchMetaplexMetadataUmi(mint)
      if (metaplexData) {
        metadata.name = metaplexData.name
        metadata.symbol = metaplexData.symbol
        metadata.image = metaplexData.image || metadata.image
        metadata.description = metaplexData.description || metadata.description
        metadata.website = metaplexData.website || metadata.website
      }
    } catch (error) {
      console.warn('Metaplex metadata failed:', error)
    }
  }

  // Only set as unknown if we couldn't find ANY metadata
  if (!metadata.name) {
    metadata.name = `Token (${mint.slice(0, 4)}...${mint.slice(-4)})`
    metadata.symbol = mint.slice(0, 4)
  }

  // Get price and market data
  const priceData = await getTokenPriceData(mint)
  Object.assign(metadata, priceData)

  return metadata
}

// Enhanced risk assessment with price/liquidity data
function assessEnhancedTokenRisk(metadata: any, tokenAccount: any) {
  const issues: string[] = []
  let riskLevel: 'safe' | 'suspicious' | 'malicious' = 'safe'

  // Known scam token check
  if (KNOWN_SCAM_TOKENS.has(metadata.mint)) {
    riskLevel = 'malicious'
    issues.push('Known scam token')
  }

  // Suspicious keyword check
  const lowerName = (metadata.name || '').toLowerCase()
  const lowerSymbol = (metadata.symbol || '').toLowerCase()
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (lowerName.includes(keyword) || lowerSymbol.includes(keyword)) {
      riskLevel = riskLevel === 'malicious' ? 'malicious' : 'suspicious'
      issues.push(`Suspicious keyword: ${keyword}`)
    }
  }

  // Previous risk checks
  if (!metadata.name && !metadata.symbol) {
    riskLevel = 'suspicious'
    issues.push('No metadata available')
  }

  // New financial risk indicators
  if (metadata.price && metadata.price < 0.0001) {
    riskLevel = riskLevel === 'safe' ? 'suspicious' : riskLevel
    issues.push('Extremely low token price')
  }

  if (metadata.liquidity && metadata.liquidity < 1000) {
    riskLevel = riskLevel === 'safe' ? 'suspicious' : riskLevel
    issues.push('Very low liquidity')
  }

  if (metadata.volume24h !== null && metadata.volume24h < 100) {
    riskLevel = riskLevel === 'safe' ? 'suspicious' : riskLevel
    issues.push('Very low trading volume')
  }

  // Check for verified status
  if (!metadata.verified && metadata.price && metadata.price > 0) {
    riskLevel = riskLevel === 'safe' ? 'suspicious' : riskLevel
    issues.push('Unverified token with market activity')
  }

  // Delegate check
  if (tokenAccount.delegate) {
    riskLevel = riskLevel === 'safe' ? 'suspicious' : riskLevel
    issues.push('Has active delegate approval')
  }

  // Check for potential rug pull indicators
  if (
    metadata.liquidity &&
    metadata.marketCap &&
    metadata.liquidity > metadata.marketCap * 2
  ) {
    riskLevel = 'suspicious'
    issues.push('Liquidity significantly higher than market cap')
  }

  return { riskLevel, issues }
}

const KNOWN_SCAM_TOKENS = new Set([
  // Add real scam token mints here
  "EXAMPLE_SCAM_MINT_1",
  "EXAMPLE_SCAM_MINT_2",
  // ...etc
]);

const SUSPICIOUS_KEYWORDS = [
  "bonus", "airdrop", "giveaway", "claim", "reward", "free", "scam", "phish", "hack", "test", "fake", "zerolends", "originether"
];

const handler: Handler = async (event, context) => {
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

    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )
    const publicKey = new PublicKey(walletAddress)

    // Get all token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    )

    const tokens = []
    const nfts = []
    let delegateCount = 0

    // Process each token account with enhanced metadata
    for (const account of tokenAccounts.value) {
      const tokenInfo = account.account.data.parsed.info

      // Skip zero balance accounts
      if (tokenInfo.tokenAmount.uiAmount === 0) continue

      const mint = tokenInfo.mint

      // Fetch enhanced metadata
      const metadata = await fetchEnhancedTokenMetadata(mint, connection)

      // Determine if it's an NFT
      const isNFT =
        tokenInfo.tokenAmount.decimals === 0 &&
        tokenInfo.tokenAmount.uiAmount === 1

      // Count delegates
      if (tokenInfo.delegate) {
        delegateCount++
      }

      // Enhanced risk assessment
      const { riskLevel, issues } = assessEnhancedTokenRisk(metadata, tokenInfo)

      const tokenData = {
        mint,
        amount: parseInt(tokenInfo.tokenAmount.amount),
        decimals: tokenInfo.tokenAmount.decimals,
        uiAmount: tokenInfo.tokenAmount.uiAmount || 0,
        symbol: metadata.symbol || 'UNKNOWN',
        name: metadata.name || 'Unknown Token',
        image: metadata.image,
        description: metadata.description,
        website: metadata.website,
        twitter: metadata.twitter,
        verified: metadata.verified,
        price: metadata.price,
        priceChange24h: metadata.priceChange24h,
        marketCap: metadata.marketCap,
        volume24h: metadata.volume24h,
        liquidity: metadata.liquidity,
        riskLevel,
        issues,
        delegate: tokenInfo.delegate,
        closeAuthority: tokenInfo.closeAuthority,
        tokenAccount: account.pubkey.toString(),
        // Calculate USD value
        valueUsd: metadata.price
          ? (tokenInfo.tokenAmount.uiAmount || 0) * metadata.price
          : null,
      }

      if (isNFT) {
        nfts.push({
          mint,
          name: metadata.name || 'Unknown NFT',
          image: metadata.image,
          description: metadata.description,
          riskLevel,
          issues,
        })
      } else {
        tokens.push(tokenData)
      }
    }

    // Calculate portfolio value
    const totalValue = tokens.reduce(
      (sum, token) => sum + (token.valueUsd || 0),
      0
    )

    // Enhanced statistics
    const allAssets = [...tokens, ...nfts]
    const suspiciousCount = allAssets.filter(
      (asset) => asset.riskLevel === 'suspicious'
    ).length
    const maliciousCount = allAssets.filter(
      (asset) => asset.riskLevel === 'malicious'
    ).length

    const scanResult = {
      tokens: tokens.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0)), // Sort by value
      nfts,
      totalTokens: tokens.length,
      totalNFTs: nfts.length,
      suspiciousTokens: suspiciousCount,
      maliciousTokens: maliciousCount,
      delegateApprovals: delegateCount,
      totalValueUsd: totalValue,
      riskScore: Math.min(
        100,
        Math.round(
          ((suspiciousCount * 5 + maliciousCount * 10) /
            Math.max(1, allAssets.length)) *
            10
        )
      ),
      recommendations: [
        suspiciousCount > 0 && '🔍 Research suspicious tokens before trading',
        maliciousCount > 0 &&
          '🚨 Immediately review and close malicious token accounts',
        delegateCount > 0 && '🔒 Revoke unnecessary token approvals',
        totalValue > 1000 && '🛡️ Consider using a hardware wallet for security',
        '📊 Check token metrics on trusted explorers before trading',
      ].filter(Boolean),
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scanResult),
    }
  } catch (error) {
    console.error('Enhanced scan error:', error)
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

export { handler }
