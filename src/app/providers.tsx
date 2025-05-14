"use client";

import React from 'react';
import { PermissionProvider } from '@/providers/PermissionProvider';
import { PortfolioProvider } from '@/providers/PortfolioProvider';
import { SessionAccountProvider } from '@/providers/SessionAccountProvider';
import { WalletProvider } from '@/providers/WalletProvider';

/**
 * Providers component that wraps the application with all necessary context providers
 * 
 * The order matters:
 * 1. WalletProvider - Provides MetaMask wallet connection
 * 2. SessionAccountProvider - Provides session account state (depends on wallet)
 * 3. PermissionProvider - Provides ERC-7715 permission state (depends on session account)
 * 4. PortfolioProvider - Provides portfolio data (depends on permissions)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <SessionAccountProvider>
        <PermissionProvider>
          <PortfolioProvider>
            {children}
          </PortfolioProvider>
        </PermissionProvider>
      </SessionAccountProvider>
    </WalletProvider>
  );
} 