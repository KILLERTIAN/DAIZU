"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Address } from "viem";
import { PermissionResponse, isPermissionRedeemable } from "@/services/permissionService";

interface PermissionContextType {
  permission: PermissionResponse | null;
  smartAccount: Address | null;
  savePermission: (permission: PermissionResponse) => void;
  fetchPermission: () => PermissionResponse | null;
  removePermission: () => void;
  clearPermission: () => void;
  isLoading: boolean;
}

const SESSION_STORAGE_KEY = "erc7715_permission";
const SMART_ACCOUNT_KEY = "erc7715_smart_account";

const PermissionContext = createContext<PermissionContextType>({
  permission: null,
  smartAccount: null,
  savePermission: () => {},
  fetchPermission: () => null,
  removePermission: () => {},
  clearPermission: () => {},
  isLoading: false,
});

export const usePermissions = () => useContext(PermissionContext);

export const PermissionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [permission, setPermission] = useState<PermissionResponse | null>(null);
  const [smartAccount, setSmartAccount] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Saves the permission to session storage
  const savePermission = useCallback((permissionToSave: PermissionResponse) => {
    console.log("Saving permission:", permissionToSave);
    
    // Save to session storage
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(permissionToSave));
    
    // Update state
    setPermission(permissionToSave);
    
    // Extract and save smart account if available
    try {
      if (permissionToSave.signer?.data?.account) {
        const smartAccountAddress = permissionToSave.signer.data.account;
        sessionStorage.setItem(SMART_ACCOUNT_KEY, smartAccountAddress);
        setSmartAccount(smartAccountAddress as Address);
      }
    } catch (e) {
      console.error("Error extracting smart account:", e);
    }
  }, []);
  
  // Removes the permission from session storage
  const removePermission = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SMART_ACCOUNT_KEY);
    setPermission(null);
    setSmartAccount(null);
  }, []);

  // Fetches permission from session storage
  const fetchPermission = useCallback(() => {
    const storedPermission = sessionStorage.getItem(SESSION_STORAGE_KEY);
    
    if (storedPermission) {
      try {
        return JSON.parse(storedPermission) as PermissionResponse;
      } catch (e) {
        console.error("Error parsing stored permission:", e);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
    }
    
    return null;
  }, []);

  // Check if the stored permission is still valid
  const validatePermission = useCallback(async (storedPermission: PermissionResponse | null) => {
    if (!storedPermission || !window.ethereum) {
      setIsLoading(false);
      return null;
    }
    
    // Check if permission is redeemable
    if (!isPermissionRedeemable(storedPermission)) {
      console.log('Stored permission is no longer valid, removing');
      removePermission();
      setIsLoading(false);
      return null;
    }
    
    // Check if address has changed
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        // No connected accounts
        setIsLoading(false);
        return storedPermission;
      }
      
      // If signer address doesn't match any connected account, remove permission
      const signerAccount = storedPermission.signer?.data?.account;
      
      if (signerAccount && !accounts.some((account: string) => 
        account.toLowerCase() === signerAccount.toLowerCase()
      )) {
        console.log('Account changed, removing permission');
        removePermission();
        return null;
      }
    } catch (error) {
      console.error("Error validating account:", error);
    }
    
    setIsLoading(false);
    return storedPermission;
  }, [removePermission]);

  // Fetch permission from session storage when component mounts
  useEffect(() => {
    const initializePermission = async () => {
      setIsLoading(true);
      
      try {
        const storedPermission = fetchPermission();
        if (storedPermission) {
          // Set permission from storage first
          setPermission(storedPermission);
          
          // Try to extract smart account
          if (storedPermission.signer?.data?.account) {
            setSmartAccount(storedPermission.signer.data.account as Address);
          } else {
            // Try fallback from storage
            const storedSmartAccount = sessionStorage.getItem(SMART_ACCOUNT_KEY);
            if (storedSmartAccount) {
              setSmartAccount(storedSmartAccount as Address);
            }
          }
          
          // Validate permission asynchronously
          const validatedPermission = await validatePermission(storedPermission);
          if (validatedPermission !== storedPermission) {
            setPermission(validatedPermission);
            if (!validatedPermission) {
              setSmartAccount(null);
            }
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing permission:", error);
        setIsLoading(false);
      }
    };
    
    initializePermission();
  }, [fetchPermission, validatePermission]);

  return (
    <PermissionContext.Provider
      value={{
        permission,
        smartAccount,
        savePermission,
        fetchPermission,
        removePermission,
        clearPermission: removePermission,
        isLoading,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

