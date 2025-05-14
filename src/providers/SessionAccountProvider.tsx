"use client";

import {
  Implementation,
  MetaMaskSmartAccount,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { createContext, useCallback, useState, useContext, useEffect } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { publicClient } from "@/services/publicClient";
import { usePermissions } from "./PermissionProvider";
import { useWallet } from "./WalletProvider";

export const SessionAccountContext = createContext({
  sessionAccount: null as MetaMaskSmartAccount<Implementation> | null,
  createSessionAccount: async () => {},
  isLoading: false,
  error: null as string | null,
  clearSessionAccount: () => {},
});

const PRIVATE_KEY_STORAGE_KEY = "gator_account_private_key";

export const SessionAccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sessionAccount, setSessionAccount] =
    useState<MetaMaskSmartAccount<Implementation> | null>(null);
  const { removePermission } = usePermissions();
  const { isConnected, address } = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createSessionAccount = useCallback(async (privateKey?: `0x${string}`) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const key = privateKey || generatePrivateKey();
      const account = privateKeyToAccount(key as `0x${string}`);

      console.log("Creating session account with EOA:", account.address);

      const newSessionAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [account.address, [], [], []],
        deploySalt: "0x",
        signatory: { account },
      });

      console.log("Session account created:", newSessionAccount.address);
      setSessionAccount(newSessionAccount);
      
      // Save the private key to session storage
      if (!privateKey) {
        sessionStorage.setItem(PRIVATE_KEY_STORAGE_KEY, key);
      }
      
      return newSessionAccount;
    } catch (err) {
      console.error("Error creating Session account:", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSessionAccount = useCallback(() => {
    removePermission();
    sessionStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
    setSessionAccount(null);
  }, [removePermission]);

  // Initialize wallet from session storage on component mount if it exists
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const storedPrivateKey = sessionStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
        
        if (storedPrivateKey) {
          console.log("Initializing session account from stored private key");
          await createSessionAccount(storedPrivateKey as `0x${string}`);
        }
      } catch (err) {
        console.error("Error initializing wallet:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize wallet");
      }
    };

    initializeWallet();
  }, [createSessionAccount]);
  
  // Create session account when wallet is connected
  useEffect(() => {
    const ensureSessionAccount = async () => {
      if (isConnected && address && !sessionAccount && !isLoading) {
        console.log("Wallet connected but no session account. Creating one...");
        const storedPrivateKey = sessionStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
        
        if (storedPrivateKey) {
          console.log("Using stored private key");
          await createSessionAccount(storedPrivateKey as `0x${string}`);
        } else {
          console.log("Generating new private key");
          await createSessionAccount();
        }
      }
    };
    
    ensureSessionAccount();
  }, [isConnected, address, sessionAccount, isLoading, createSessionAccount]);

  return (
    <SessionAccountContext.Provider 
      value={{ 
        sessionAccount, 
        createSessionAccount, 
        isLoading, 
        error,
        clearSessionAccount
      }}
    >
      {children}
    </SessionAccountContext.Provider>
  );
};

export const useSessionAccount = () => {
  return useContext(SessionAccountContext);
};
