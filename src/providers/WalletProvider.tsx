"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createWalletClient, custom, type Chain, type WalletClient } from 'viem';
import { config } from '@/config';
import { useSessionAccount } from './SessionAccountProvider';
import { getERC7715Requirements } from '@/services/permissionService';
import { publicClient } from '@/services/publicClient';
import { connectToMetaMask, isCorrectChain } from '@/services/metamaskUtils';

export type WalletContextType = {
  address: `0x${string}` | null;
  chainId: number | null;
  balance: bigint | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMetaMaskFlask: boolean;
  error: string | null;
  walletClient: WalletClient | null;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  switchToSepolia: () => Promise<boolean>;
  isDemoMode: boolean;
  setIsDemoMode: (value: boolean) => void;
  erc7715Support: {
    isSupported: boolean;
    reason?: string;
  };
};

const WalletContext = createContext<WalletContextType>({
  address: null,
  balance: null,
  isConnected: false,
  isConnecting: false,
  walletClient: null,
  connectWallet: async () => {},
  disconnect: () => {},
  error: null,
  chainId: null,
  switchToSepolia: async () => false,
  isMetaMaskFlask: false,
  isDemoMode: false,
  setIsDemoMode: () => {},
  erc7715Support: {
    isSupported: false
  }
});

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_NUMERIC_ID = 11155111;
const SEPOLIA_ADD_CHAIN_PARAMS = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.rpc.pimlico.io', 'https://rpc.sepolia.org', 'https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isMetaMaskFlask, setIsMetaMaskFlask] = useState<boolean | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [erc7715Support, setErc7715Support] = useState<{
    isSupported: boolean;
    reason?: string;
  }>({
    isSupported: false
  });
  
  const { createSessionAccount } = useSessionAccount();

  // Check if MetaMask is installed and if it's Flask
  const checkMetaMaskDetails = async () => {
    try {
      const requirements = await getERC7715Requirements();
      
      // Determine ERC-7715 support
      let supportObj = {
        isSupported: false,
        reason: undefined as string | undefined
      };
      
      if (!requirements.isMetaMask) {
        supportObj.reason = 'MetaMask is not installed';
      } else if (!requirements.isFlask) {
        supportObj.reason = 'MetaMask Flask is required';
      } else if (!requirements.supportsWalletGrantPermissions) {
        supportObj.reason = 'Your MetaMask Flask version does not support ERC-7715';
      } else {
        supportObj.isSupported = true;
      }
      
      setErc7715Support(supportObj);
      
      // Ensure we return the right shape without non-existent 'version' property
      return {
        isInstalled: requirements.isMetaMask,
        isFlask: requirements.isFlask,
        supportsERC7715: requirements.supportsWalletGrantPermissions
      };
    } catch (error) {
      console.error("Error checking MetaMask details:", error);
      return {
        isInstalled: false,
        isFlask: false,
        supportsERC7715: false
      };
    }
  };

  // Check MetaMask details when component mounts
  useEffect(() => {
    const initCheck = async () => {
      const details = await checkMetaMaskDetails();
      setIsMetaMaskFlask(details.isFlask);
      
      // If Flask not detected, default to demo mode
      if (!details.isFlask) {
        setIsDemoMode(true);
      }
    };
    initCheck();
  }, []);

  // Add simulateDemoConnection function before connectWallet
  const simulateDemoConnection = () => {
    // Simulate connection with demo address
    // Ensure proper type for demo address
    const demoAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as `0x${string}`;
    
    setAddress(demoAddress);
    setBalance(BigInt("1000000000000000000")); // 1 ETH
    setChainId(11155111); // Pretend we're on Sepolia
    setIsConnected(true);
    setWalletClient(null); // No actual wallet client in demo mode
    
    console.log("Connected in demo mode");
  };

  // Connect wallet function
  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // First verify if wallet supports ERC-7715 requirements
      const details = await checkMetaMaskDetails();
      
      // If MetaMask Flask is not detected but demo mode is enabled, proceed with demo account
      if (!details.isFlask && isDemoMode) {
        simulateDemoConnection();
        return;
      }
      
      // If not Flask, provide specific error message
      if (!details.isInstalled) {
        setError('MetaMask wallet is not installed. Please install MetaMask Flask.');
        setIsConnecting(false);
        return;
      }
      
      if (!details.isFlask) {
        setError('MetaMask Flask is required for ERC-7715 support. Regular MetaMask is not supported.');
        setIsConnecting(false);
        return;
      }
      
      if (!details.supportsERC7715) {
        setError('Your MetaMask Flask version does not support ERC-7715. Please update to version 12.14.2 or later.');
        setIsConnecting(false);
        return;
      }
      
      // Connect to MetaMask
      const [newAddress, newClient] = await connectToMetaMask();
      setAddress(newAddress);
      setWalletClient(newClient);
      setIsConnected(true);
      
      // Check chain and switch if needed
      if (window.ethereum) {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);
        setChainId(currentChainId);
        
        // If not on Sepolia (required for ERC-7715), prompt to switch
        if (currentChainId !== 11155111) {
          const switched = await switchToSepolia();
          if (!switched) {
            // If user cancels switch, still show as connected but warn about chain
            setError('Please switch to Sepolia network for full functionality');
          }
        }
      }
      
      // Create a session account for delegation
      try {
        await createSessionAccount();
      } catch (sessionErr) {
        console.error('Error creating session account:', sessionErr);
        setError('Connected, but could not create session account for delegations');
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError(`Connection failed: ${err instanceof Error ? err.message : String(err)}`);
      
      // Fall back to demo mode if connection fails
      if (isDemoMode) {
        simulateDemoConnection();
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnect = () => {
    setAddress(null);
    setBalance(null);
    setIsConnected(false);
    setWalletClient(null);
    setChainId(null);
  };

  // Switch to Sepolia network
  const switchToSepolia = async () => {
    // In demo mode, simulate successful switch
    if (isDemoMode) {
      setChainId(SEPOLIA_NUMERIC_ID);
      return true;
    }
    
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      console.log("Attempting to switch to Sepolia...");
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      
      console.log("Successfully switched to Sepolia");
      return true;
    } catch (switchError: any) {
      console.log("Error when switching:", switchError.code);
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902 || switchError.message?.includes('wallet_addEthereumChain')) {
        try {
          console.log("Adding Sepolia network...", SEPOLIA_ADD_CHAIN_PARAMS);
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_ADD_CHAIN_PARAMS],
          });
          
          // Try switching again after adding
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
          
          console.log("Successfully added and switched to Sepolia");
          return true;
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          setError('Failed to add Sepolia network');
          return false;
        }
      } else {
        console.error('Error switching to Sepolia:', switchError);
        setError('Failed to switch to Sepolia network');
        return false;
      }
    }
  };

  // Enable/disable demo mode
  const toggleDemoMode = () => {
    if (isConnected) {
      disconnect();
    }
    setIsDemoMode(prev => !prev);
  };

  // Listen for account changes (only in regular mode)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && !isDemoMode) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User has disconnected all accounts
          disconnect();
        } else if (accounts[0] !== address) {
          // User has switched accounts
          setAddress(accounts[0] as `0x${string}`);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
        // Reload the page as recommended by MetaMask
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address, isDemoMode]);

  // Update balance when address changes
  useEffect(() => {
    const fetchBalance = async () => {
      // Skip in demo mode
      if (isDemoMode) return;
      
      if (address) {
        try {
          // Use the updated publicClient instead of window.ethereum
          const newBalance = await publicClient.getBalance({
            address,
          });
          setBalance(newBalance);
        } catch (err) {
          console.error('Error fetching balance:', err);
        }
      }
    };

    fetchBalance();
  }, [address, isDemoMode]);

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        isConnected,
        isConnecting,
        walletClient,
        connectWallet,
        disconnect,
        error,
        chainId,
        switchToSepolia,
        isMetaMaskFlask: !!isMetaMaskFlask,
        isDemoMode,
        setIsDemoMode,
        erc7715Support,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext); 