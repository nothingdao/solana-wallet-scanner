import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Transaction,
  PublicKey
} from '@solana/web3.js';
import {
  createRevokeInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

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

interface WalletActionsProps {
  token: TokenAccount;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const WalletActions: React.FC<WalletActionsProps> = ({ token, onSuccess, onError }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const revokeTokenApproval = async () => {
    if (!publicKey || !token.tokenAccount) {
      onError('Wallet not connected or token account not found');
      return;
    }

    setIsProcessing('revoke');

    try {
      const transaction = new Transaction();

      // Create revoke instruction
      const revokeInstruction = createRevokeInstruction(
        new PublicKey(token.tokenAccount), // Token account
        publicKey, // Owner
        [], // No multisig signers
        TOKEN_PROGRAM_ID
      );

      transaction.add(revokeInstruction);

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send and confirm transaction
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      onSuccess(`Successfully revoked approval for ${token.symbol || 'token'}`);

    } catch (error) {
      console.error('Failed to revoke approval:', error);
      onError(`Failed to revoke approval: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const closeTokenAccount = async () => {
    if (!publicKey || !token.tokenAccount) {
      onError('Wallet not connected or token account not found');
      return;
    }

    setIsProcessing('close');

    try {
      const transaction = new Transaction();

      // Create close account instruction
      const closeInstruction = createCloseAccountInstruction(
        new PublicKey(token.tokenAccount), // Account to close
        publicKey, // Destination for lamports
        publicKey, // Owner of the account
        [], // No multisig signers
        TOKEN_PROGRAM_ID
      );

      transaction.add(closeInstruction);

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send and confirm transaction
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      onSuccess(`Successfully closed ${token.symbol || 'token'} account and reclaimed rent`);

    } catch (error) {
      console.error('Failed to close account:', error);
      onError(`Failed to close account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {token.delegate && (
        <button
          onClick={revokeTokenApproval}
          disabled={isProcessing !== null}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs transition-colors"
        >
          {isProcessing === 'revoke' ? '⏳ Revoking...' : '🔒 Revoke Approval'}
        </button>
      )}

      <button
        onClick={closeTokenAccount}
        disabled={isProcessing !== null}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs transition-colors"
      >
        {isProcessing === 'close' ? '⏳ Closing...' : '🗑️ Close Account'}
      </button>
    </div>
  );
};

export default WalletActions;
