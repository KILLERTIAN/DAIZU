"use client";

import React from 'react';
import WalletConnection from './WalletConnection';

/**
 * Wallet Connect Button using the enhanced WalletConnection component
 * that properly handles MetaMask Flask and ERC-7715 requirements
 */
export default function WalletConnectButton({ 
  className, 
  size = 'default',
  showBalance = false,
  variant = 'default'
}: { 
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  showBalance?: boolean;
  variant?: 'default' | 'minimal' | 'full';
}) {
  return (
    <WalletConnection 
      className={className}
      size={size}
      showBalance={showBalance}
      variant={variant}
    />
  );
} 