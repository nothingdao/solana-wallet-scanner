import { Handler } from '@netlify/functions'
import { Connection, PublicKey } from '@solana/web3.js'

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
    new PublicKey(walletAddress)

    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )

    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }
    )

    const tokens = await Promise.all(
      tokenAccounts.value.map(async (account) => {
        const tokenInfo = account.account.data.parsed.info
        const mint = tokenInfo.mint
        const amount = tokenInfo.tokenAmount.uiAmount || 0

        // Basic risk assessment (placeholder logic)
        let riskLevel: 'safe' | 'suspicious' | 'malicious' = 'safe'
        let issues: string[] = []

        // Check for suspicious patterns
        if (amount > 1000000) {
          riskLevel = 'suspicious'
          issues.push('Unusually high token amount')
        }

        // Mock metadata check
        try {
          const metadataResponse = await fetch(
            `https://api.solana.fm/v1/tokens/${mint}`
          )
          if (!metadataResponse.ok) {
            riskLevel = 'suspicious'
            issues.push('No verified metadata')
          }
        } catch {
          riskLevel = 'suspicious'
          issues.push('Metadata fetch failed')
        }

        return {
          mint,
          amount,
          riskLevel,
          issues,
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
        }
      })
    )

    const scanResult = {
      tokens,
      totalTokens: tokens.length,
      riskySuggestions: tokens.filter((t) => t.riskLevel === 'suspicious')
        .length,
      maliciousTokens: tokens.filter((t) => t.riskLevel === 'malicious').length,
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
      body: JSON.stringify({ error: 'Failed to scan wallet' }),
    }
  }
}
