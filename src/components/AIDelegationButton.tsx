import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/providers/PermissionProvider';
import { parseEther } from 'viem';
import { Zap, AlertTriangle, Check, Info, Shield, Sparkles, BrainCircuit, RefreshCw, HelpCircle } from 'lucide-react';
import CryptoIcon from './CryptoIcon';
import { useSessionAccount } from '@/providers/SessionAccountProvider';
import { useWallet } from '@/providers/WalletProvider';
import { 
  requestAIPortfolioPermission, 
  isPermissionRedeemable,
  executeWithDelegation,
  PermissionResponse,
  checkMetaMaskERC7715Support,
  getERC7715Requirements
} from '@/services/permissionService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AmountSelectionDialog from './AmountSelectionDialog';
import InstallationDialog from './InstallationDialog';
import { connectToMetaMask, installGatorSnap, isGatorSnapInstalled, isMetaMaskFlask as checkIsFlask, logMetaMaskDebugInfo } from '@/services/metamaskUtils';

/**
 * AIDelegationButton - Component that handles ERC-7715 permission requests for AI delegation
 * 
 * This component:
 * 1. Checks if MetaMask Flask with ERC-7715 support is available (requires version 12.14.2+)
 * 2. If available, it allows requesting wallet_grantPermissions for native token transfers
 * 3. If not available, it provides a demo mode to showcase the functionality
 * 4. Handles permission revocation
 * 
 * ERC-7715 permissions allow specific off-chain delegation authorization where:
 * - The dApp can request permission to perform specified actions on behalf of the user
 * - The user approves the permission request with specific constraints (amount, expiration)
 * - The dApp can perform actions within those constraints without requiring additional signatures
 */
export default function AIDelegationButton() {
  const { permission, savePermission, clearPermission } = usePermissions();
  const { sessionAccount } = useSessionAccount();
  const { address, walletClient, isConnected, chainId } = useWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMethodAvailable, setIsMethodAvailable] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAmountDialogOpen, setIsAmountDialogOpen] = useState(false);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  
  // Test transaction state
  const [isTxLoading, setIsTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<boolean>(false);
  
  // Requirements state for MetaMask and Gator
  const [requirements, setRequirements] = useState<{
    isMetaMask: boolean;
    isFlask: boolean;
    supportsWalletGrantPermissions: boolean;
    isGatorInstalled?: boolean;
    version?: string | null;
  }>({
    isMetaMask: false,
    isFlask: false,
    supportsWalletGrantPermissions: false,
    isGatorInstalled: false,
    version: null
  });

  // Check if MetaMask and Gator meet requirements
  useEffect(() => {
    const checkRequirements = async () => {
      try {
        // Check for MetaMask Flask first
        const isFlask = await checkIsFlask();
        if (isFlask) {
          // If Flask is installed, check if Gator snap is installed
          const hasGatorSnap = await isGatorSnapInstalled();
          if (!hasGatorSnap) {
            // Attempt to install Gator snap automatically if not installed
            console.log("MetaMask Flask detected but Gator snap not found. Attempting installation...");
            try {
              const installed = await installGatorSnap();
              console.log("Automatic Gator snap installation attempt result:", installed);
            } catch (err) {
              console.warn("Could not automatically install Gator snap:", err);
            }
          }
        }
        
        const supportCheck = await checkMetaMaskERC7715Support();
        if (supportCheck.requirements) {
          setRequirements(supportCheck.requirements);
          setIsMethodAvailable(supportCheck.supported);
        } else {
          const reqs = await getERC7715Requirements();
          setRequirements(reqs);
          setIsMethodAvailable(reqs.supportsWalletGrantPermissions);
        }
        
        if (!supportCheck.supported) {
          console.warn('ERC-7715 support issue:', supportCheck.reason);
        }
      } catch (error) {
        console.error('Error checking ERC-7715 requirements:', error);
        setIsMethodAvailable(false);
      }
    };
    
    checkRequirements();
  }, [isConnected]);

  /**
   * Creates a mock permission response for demo mode
   */
  const createMockPermission = (
    userAddress: string, 
    maxAmount: string, 
    amountPerSecond: string
  ): PermissionResponse => {
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Convert to bigint first, then to hex
    const maxAmountBigInt = parseEther(maxAmount);
    const amountPerSecondBigInt = parseEther(amountPerSecond);
    
    return {
      chainId: "0xa",
      expiry: currentTime + 604800, // 1 week
      signer: {
        type: "account",
        data: {
          account: userAddress as `0x${string}`
        }
      },
      permissions: [{
        type: "native-token-stream",
        data: {
          amountPerSecond: `0x${amountPerSecondBigInt.toString(16)}`,
          maxAmount: `0x${maxAmountBigInt.toString(16)}`,
          startTime: currentTime
        },
        permissionsContext: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      }],
      signerMeta: {
        delegationManager: "0xDC7e12b41E5e61BfCc7F56AAFB7B93288F61e841" as `0x${string}`
      },
      accountMetadata: [{
        factory: "0x65E726b404149fE37F4b291c81Dc6eddd44763A7" as `0x${string}`,
        factoryData: "0x1a2b3c4d5e6f"
      }]
    };
  };

  /**
   * Handles granting permission with custom amount
   */
  const handleGrantPermissionWithAmount = async (amount: string, streamRate: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Comprehensive check for MetaMask Flask and ERC-7715 support
      const supportCheck = await checkMetaMaskERC7715Support();
      
      if (!supportCheck.supported) {
        // If MetaMask Flask is installed but missing Gator snap, try installing it
        if (supportCheck.requirements?.isFlask && !supportCheck.requirements?.isGatorInstalled) {
          try {
            console.log("Attempting to install Gator snap...");
            const installed = await installGatorSnap();
            
            if (installed) {
              // If successfully installed, continue with permission request
              console.log("Gator snap installed successfully. Continuing with permission request...");
            } else {
              // If installation failed, show installation instructions
              setIsInstallDialogOpen(true);
              throw new Error("Gator snap installation required. Please follow the instructions.");
            }
          } catch (error) {
            console.error("Error installing Gator snap:", error);
            setIsInstallDialogOpen(true);
            throw new Error("Error installing Gator snap. Please install it manually.");
          }
        } else {
          // For other requirements issues, show the installation dialog
          setIsInstallDialogOpen(true);
          throw new Error(supportCheck.reason || 'MetaMask Flask with ERC-7715 support is required');
        }
      }
      
      // Try to connect to MetaMask if not already connected
      if (!isConnected) {
        try {
          await connectToMetaMask();
        } catch (error) {
          throw new Error('Failed to connect to MetaMask. Please connect your wallet manually and try again.');
        }
      }

      // Check if session account is ready
      if (!sessionAccount) {
        throw new Error('Session account not initialized. Please refresh the page and try again.');
      }

      // Request portfolio permission with specific limits
      console.log('Using session account:', sessionAccount.address);
      console.log('Requesting delegation with amount:', amount, 'and rate:', streamRate);
      
      const permissionResponse = await requestAIPortfolioPermission(
        sessionAccount.address,
        amount, // Max amount from user input
        streamRate // Amount per second from user input
      );

      console.log('Permission response:', permissionResponse);

      // Save the permission response if successful
      if (permissionResponse) {
        savePermission(permissionResponse);
      }
    } catch (error: any) {
      console.error('Error granting permission:', error);
      
      // Special handling for method not available error
      if (error.code === -32601 || 
          error.message?.includes('method not found') || 
          error.message?.includes('wallet_grantPermissions method not available') ||
          error.message?.includes('MetaMask Flask')) {
        
        setErrorMessage(error.message || 'wallet_grantPermissions method not available. This feature requires MetaMask Flask 12.14.2+ with the Gator snap.');
        setIsMethodAvailable(false);
        setIsInstallDialogOpen(true);
        
        // Fallback to demo mode only if we have a connected account
        if (isConnected && address) {
          const mockPermission = createMockPermission(address, amount, streamRate);
          savePermission(mockPermission);
        }
      } else if (error.message?.includes('rejected') || error.code === 4001) {
        setErrorMessage('Permission request was rejected by the user');
      } else {
        setErrorMessage(error.message || 'Failed to grant permission');
      }
    } finally {
      setIsLoading(false);
      setIsAmountDialogOpen(false);
    }
  };

  /**
   * Handle executing a transaction with delegation
   */
  const handleTestTransaction = async () => {
    setIsTxLoading(true);
    setTxError(null);
    setTxSuccess(false);
    
    try {
      if (!permission) {
        throw new Error('No permission available');
      }
      
      if (!isPermissionRedeemable(permission)) {
        throw new Error('Permission is not redeemable. It may be expired or invalid.');
      }
      
      // Additional check for method availability before transaction
      if (!isMethodAvailable) {
        throw new Error('This is a demo. MetaMask Flask with ERC-7715 support is required for actual delegated transactions.');
      }
      
      const permissionContext = permission.permissions?.[0]?.permissionsContext;
      const delegationManager = permission.signerMeta?.delegationManager;
      
      if (!permissionContext || !delegationManager) {
        throw new Error('Missing permission context or delegation manager');
      }
      
      if (!walletClient) {
        throw new Error('Wallet client not initialized');
      }
      
      // Execute a test transaction using the delegation
      const hash = await executeWithDelegation(
        walletClient,
        sessionAccount?.address || "", // Send back to the session account
        "0.001", // Small test amount
        permissionContext,
        delegationManager
      );
      
      console.log('Transaction hash:', hash);
      setTxSuccess(true);
    } catch (error: any) {
      console.error('Error executing transaction:', error);
      
      if (error.message?.includes('MetaMask Flask') || 
          error.message?.includes('method not available') ||
          error.message?.includes('ERC-7715')) {
        setIsInstallDialogOpen(true);
      }
      
      setTxError(error.message || 'Failed to execute transaction');
    } finally {
      setIsTxLoading(false);
    }
  };
  
  /**
   * Revoke the delegation by clearing the stored permission
   */
  const handleRevoke = () => {
    clearPermission();
    setTxSuccess(false);
    setTxError(null);
  };
  
  /**
   * Open the dialog to grant permission
   */
  const handleOpenDialog = async () => {
    // Log debug info to help troubleshoot any issues
    await logMetaMaskDebugInfo();
    
    // Check requirements before opening dialog
    const supportCheck = await checkMetaMaskERC7715Support();
    
    if (!supportCheck.supported) {
      // Only show install dialog if it's a MetaMask issue
      // If MetaMask Flask is installed but Gator snap is missing, try to install it automatically
      if (supportCheck.requirements?.isFlask && !supportCheck.requirements?.isGatorInstalled) {
        try {
          // Display loading message
          setErrorMessage("Attempting to install Gator snap... Please approve the installation in MetaMask Flask.");
          
          // Try multiple installation approaches
          console.log("Attempting to install Gator snap...");
          const installed = await installGatorSnap();
          
          if (installed) {
            console.log("Gator snap installed successfully!");
            // If installation successful, retry the requirement check
            const newCheck = await checkMetaMaskERC7715Support();
            if (newCheck.supported) {
              // If now supported, open the amount selection dialog
              setIsAmountDialogOpen(true);
              return;
            } else {
              console.warn("Gator snap installed but ERC-7715 still not supported. Reason:", newCheck.reason);
            }
          } else {
            console.warn("Failed to install Gator snap automatically");
          }
          
          // If we get here, the automatic installation wasn't successful
          // Show the installation dialog with manual installation button
          setIsInstallDialogOpen(true);
          setErrorMessage("Gator snap installation needed. Please use the manual installation button.");
        } catch (error) {
          console.error("Error installing Gator snap:", error);
          setIsInstallDialogOpen(true);
          setErrorMessage("Error installing Gator snap. Please install it manually with the button provided.");
        }
      } else {
        // Show installation dialog for other issues (no MetaMask or not Flask)
        setIsInstallDialogOpen(true);
        
        // Set appropriate error message based on what's missing
        if (supportCheck.requirements && !supportCheck.requirements.isMetaMask) {
          setErrorMessage('MetaMask is not installed');
        } else if (supportCheck.requirements && !supportCheck.requirements.isFlask) {
          setErrorMessage('MetaMask Flask is required for ERC-7715 delegation');
        } else {
          setErrorMessage(supportCheck.reason || 'MetaMask Flask with ERC-7715 support is required');
        }
      }
    } else {
      // All requirements met, open amount selection dialog
      setIsAmountDialogOpen(true);
    }
  };

  // If we have permission, it could be real or demo mode
  const hasPermission = !!permission;
  // We're in demo mode if we have a permission but the method isn't actually available
  const shouldShowDemo = hasPermission && !isMethodAvailable;

  // Extract delegation limits for display
  const maxAmount = permission?.permissions?.[0]?.data?.maxAmount
    ? BigInt(permission.permissions[0].data.maxAmount) / BigInt(10**18)
    : 0.1;
  
  const amountPerSecond = permission?.permissions?.[0]?.data?.amountPerSecond
    ? BigInt(permission.permissions[0].data.amountPerSecond) / BigInt(10**18)
    : 0.0001;

  // Add a function to enable demo mode
  const enableDemoMode = () => {
    if (!address) {
      setErrorMessage("Please connect your wallet first to use demo mode");
      return;
    }
    
    console.log("Enabling demo mode with mock permission");
    const mockPermission = createMockPermission(
      address,
      "0.1", // Default max amount 
      "0.0001" // Default stream rate
    );
    savePermission(mockPermission);
  };

  return (
    <div className="space-y-3">
      {!hasPermission ? (
        <div className="space-y-3">
          <Button
            className="w-full gap-2"
            onClick={handleOpenDialog}
            disabled={isLoading}
            isLoading={isLoading}
            loadingText="Granting permission..."
          >
            <BrainCircuit className="w-4 h-4" />
            Grant AI Delegation
          </Button>
          
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="border-t flex-grow border-gray-700"></div>
            <div className="text-xs">or</div>
            <div className="border-t flex-grow border-gray-700"></div>
          </div>
          
          <Button
            className="w-full gap-2"
            variant="outline"
            onClick={enableDemoMode}
            disabled={!address}
          >
            <Sparkles className="w-4 h-4" />
            Try Demo Mode
          </Button>
          
          {!address && (
            <p className="text-xs text-gray-500 text-center">
              Connect your wallet to enable demo mode
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-md bg-gray-800/60 border border-gray-700/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="font-semibold">AI Delegation Active</span>
              </div>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleRevoke}
                className="h-7"
              >
                Revoke
              </Button>
            </div>
            
            <p className="text-sm text-gray-400 mb-2">
              {shouldShowDemo
                ? "Demo mode: Simulating AI delegation with mock data"
                : "The AI is now authorized to trade on your behalf with the following limits:"
              }
            </p>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 bg-gray-700/40 rounded text-center">
                <div className="text-sm text-gray-400">Max Amount</div>
                <div className="font-semibold flex items-center justify-center mt-1">
                  <CryptoIcon symbol="ETH" size={16} className="mr-1" />
                  {maxAmount.toString()} ETH
                </div>
              </div>
              
              <div className="p-2 bg-gray-700/40 rounded text-center">
                <div className="text-sm text-gray-400">Rate Limit</div>
                <div className="font-semibold flex items-center justify-center mt-1">
                  <CryptoIcon symbol="ETH" size={16} className="mr-1" />
                  {amountPerSecond.toString()} ETH/s
                </div>
              </div>
            </div>
          </div>
          
          {shouldShowDemo && (
            <div className="p-2 bg-yellow-900/30 rounded-md border border-yellow-700/30 flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-200">
                <p className="font-medium">Using Demo Mode</p>
                <p className="mt-0.5">
                  MetaMask Flask 12.14.2+ with Gator snap is required for actual delegated transactions.
                  <span 
                    className="text-yellow-300 underline cursor-pointer ml-1"
                    onClick={() => setIsInstallDialogOpen(true)}
                  >
                    Learn how to setup
                  </span>
                </p>
              </div>
            </div>
          )}
          
          <Button
            className="w-full gap-2"
            onClick={handleTestTransaction}
            disabled={isTxLoading}
            isLoading={isTxLoading}
            loadingText="Executing..."
          >
            <Sparkles className="w-4 h-4" />
            Test Transaction with Delegation
          </Button>
        </div>
      )}
      
      <AmountSelectionDialog 
        open={isAmountDialogOpen}
        onOpenChange={setIsAmountDialogOpen}
        onConfirm={handleGrantPermissionWithAmount}
        isLoading={isLoading}
      />
      
      <InstallationDialog
        open={isInstallDialogOpen}
        onOpenChange={setIsInstallDialogOpen}
        onUseDemoMode={enableDemoMode}
      />
      
      {txSuccess && (
        <div className="p-2 bg-green-900/30 rounded-md border border-green-700/30 flex items-start gap-2">
          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-300">
            Transaction executed successfully with delegation!
          </p>
        </div>
      )}
      
      {txError && (
        <div className="p-2 bg-red-900/30 rounded-md border border-red-700/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300">
            {txError}
          </p>
        </div>
      )}
      
      {errorMessage && !hasPermission && (
        <div className="p-2 bg-red-900/30 rounded-md border border-red-700/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300">
            {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
} 