# 🛡️ Solana Wallet Security Scanner

A comprehensive security tool for Solana wallets that detects scam tokens, malicious approvals, and potential security threats. Built with React, TypeScript, and Solana Web3.js.

## ✨ Features

### 🔌 **Multi-Wallet Support**

- **Phantom** - Most popular Solana wallet
- **Solflare** - Browser and mobile wallet
- **Backpack** - Next-gen wallet with xNFT support
- Extensible architecture for additional wallets

### 🔍 **Advanced Threat Detection**

- **Scam Token Detection**: Identifies known malicious tokens
- **Symbol Impersonation**: Detects fake versions of popular tokens (SOL, USDC, etc.)
- **Metadata Analysis**: Flags tokens with suspicious or missing metadata
- **Keyword Filtering**: Identifies tokens with scam-related terms
- **Delegate Approval Scanning**: Finds risky token approvals
- **Supply Analysis**: Detects tokens with suspicious supply patterns

### 🎨 **Modern UI/UX**

- Clean, intuitive interface built with Tailwind CSS
- Real-time scanning progress indicators
- Detailed risk assessment with color-coded alerts
- Mobile-responsive design
- Accessibility-compliant components

### ⚡ **Security Actions**

- **Revoke Token Approvals**: Remove dangerous delegate permissions
- **Close Token Accounts**: Reclaim rent from unwanted tokens
- **Risk Assessment**: 0-100 security score
- **Personalized Recommendations**: Actionable security advice

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Netlify account (for deployment)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd solana-wallet-scanner
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

```bash
# Optional: Custom Solana RPC endpoint
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# For production, consider using a premium RPC like:
# SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

4. **Start development server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Local Development with Netlify Functions

To test the backend scanning functionality locally:

```bash
# Install Netlify CLI if you haven't already
npm install -g netlify-cli

# Start local development with functions
npm run netlify
```

This will start both the frontend and Netlify functions locally.

## 🏗️ Architecture

### Frontend (`src/`)

- **React 19** with TypeScript
- **Solana Wallet Adapter** for wallet integration
- **Tailwind CSS** for styling
- **Vite** for build tooling

### Backend (`netlify/functions/`)

- **Netlify Functions** for serverless API
- **Solana Web3.js** for blockchain interaction
- **Token metadata fetching** from multiple sources
- **Risk assessment algorithms**

### Key Components

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   └── WalletScanner.tsx   # Main scanner component
├── lib/
│   └── utils.ts           # Utility functions
└── App.tsx               # App root with wallet providers
```

## 🔧 Configuration

### Supported Wallets

The app currently supports these wallets out of the box:

- Phantom
- Solflare
- Backpack

To add more wallets, update the `wallets` array in `App.tsx`:

```typescript
const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
    // Add new wallet adapters here
  ],
  []
)
```

### Risk Assessment Customization

The risk assessment logic is configurable in the Netlify function. Key parameters:

- **Known scam tokens**: Update `KNOWN_SCAM_TOKENS` set
- **Suspicious keywords**: Modify `SUSPICIOUS_KEYWORDS` array
- **Token impersonation detection**: Update `COMMON_TOKENS` mapping
- **Risk scoring weights**: Adjust values in `calculateRiskScore()`

## 🚀 Deployment

### Netlify Deployment

1. **Build the project**

```bash
npm run build
```

2. **Deploy to Netlify**

   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Set Node.js version: `18` (in environment variables)

3. **Environment Variables**
   Set these in your Netlify dashboard:

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NODE_VERSION=18
```

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy using Netlify CLI
netlify deploy --prod --dir=dist
```

## 🛠️ Development

### Project Structure

```
solana-wallet-scanner/
├── netlify/
│   └── functions/
│       └── scan-wallet.ts    # Backend scanning logic
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable components
│   │   └── WalletScanner.tsx # Main component
│   ├── lib/
│   │   └── utils.ts         # Utilities
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── public/                  # Static assets
└── dist/                    # Build output
```

### Adding New Features

1. **New Risk Detection Rules**

   - Add detection logic in `netlify/functions/scan-wallet.ts`
   - Update the `assessTokenRisk()` function
   - Add new issue types to the response

2. **New Wallet Support**

   - Install the wallet adapter package
   - Add to the wallets array in `App.tsx`
   - Test connection flow

3. **UI Enhancements**
   - Components are in `src/components/ui/`
   - Follow the existing pattern for consistency
   - Use Tailwind for styling

### Testing

```bash
# Lint code
npm run lint

# Type checking
npx tsc --noEmit

# Build verification
npm run build
```

## 🔒 Security Considerations

### Best Practices Implemented

- **No Private Key Handling**: All wallet interactions use standard adapters
- **Read-Only Operations**: Scanning doesn't require transaction permissions
- **Rate Limiting**: Built-in protection against API abuse
- **Input Validation**: All inputs are validated and sanitized
- **Error Handling**: Comprehensive error handling prevents crashes

### Security Features

- **Multiple Metadata Sources**: Cross-references multiple APIs for accuracy
- **Reputation Scoring**: Uses multiple factors for risk assessment
- **False Positive Reduction**: Conservative flagging to minimize false alarms
- **User Education**: Provides clear explanations of risks and actions

## 🎯 Roadmap

### Phase 1 - Core Features ✅

- [x] Multi-wallet connection
- [x] Token and NFT scanning
- [x] Basic risk assessment
- [x] Delegate approval detection
- [x] Modern UI

### Phase 2 - Enhanced Detection 🚧

- [ ] Machine learning risk scoring
- [ ] Community-reported scam database
- [ ] Real-time threat intelligence
- [ ] Historical transaction analysis

### Phase 3 - Advanced Features 🔮

- [ ] Wallet monitoring alerts
- [ ] Portfolio tracking
- [ ] DeFi protocol risk assessment
- [ ] Mobile app
- [ ] API for developers

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discord**: [Join our community](https://discord.gg/your-invite)
- **Email**: support@yourproject.com

## 🙏 Acknowledgments

- **Solana Labs** - For the excellent wallet adapter framework
- **Solana Foundation** - For building an amazing ecosystem
- **Community Contributors** - For reporting scam tokens and feedback

---

**⚠️ Disclaimer**: This tool is for educational and security purposes. Always verify findings independently and exercise caution when interacting with unknown tokens or contracts.
