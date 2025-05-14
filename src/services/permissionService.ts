import { erc7710WalletActions } from "@metamask/delegation-toolkit/experimental";
import { WalletClient, createWalletClient, custom, parseEther } from "viem";
import { config } from "@/config";
import {
  isMetaMaskInstalled,
  isMetaMaskFlask,
  supportsGrantPermissions,
  isGatorSnapInstalled,
  isCorrectChain,
  connectToMetaMask
} from "./metamaskUtils";
import { createPublicClient, encodeFunctionData } from 'viem';
import { publicClient, bundlerClient, paymasterClient } from './publicClient';

// Define ERC7715Requirements type
export type ERC7715Requirements = {
  isMetaMask: boolean;
  isFlask: boolean;
  supportsWalletGrantPermissions: boolean;
  isGatorInstalled?: boolean;
  version?: string | null;
};

// Types based on ERC-7715 standard
export interface PermissionResponse {
  chainId: string;
  expiry: number;
  address?: `0x${string}`;
  signer: {
    type: string;
    data: {
      account: `0x${string}`;
    };
  };
  permissions?: {
    type: string;
    data: Record<string, any>;
    permissionsContext?: `0x${string}`;
  }[];
  permission?: {
    type: string;
    data: Record<string, any>;
    permissionsContext?: `0x${string}`;
  };
  context?: `0x${string}`;
  signerMeta?: {
    userOpBuilder?: `0x${string}`;
    delegationManager?: `0x${string}`;
  };
  accountMetadata?: {
    factory: `0x${string}`;
    factoryData: string;
  }[];
}

/**
 * Type for the ERC-7715 native token stream permission
 */
export type NativeTokenStreamPermissionParams = {
  amountPerSecond: bigint;
  maxAmount?: bigint;
  initialAmount?: bigint;
  startTime?: number;
};

/**
 * Type for the ERC-7715 permission response
 */
export type ERC7715PermissionResponse = {
  chainId: string;
  expiry: number;
  permissions: {
    type: string;
    data: any;
    permissionsContext: string;
  }[];
  signer: {
    type: string;
    data: {
      account: string;
    };
  };
  context: string;
  signerMeta: {
    delegationManager: string;
  };
  accountMetadata: {
    factory: string;
    factoryData: string;
  }[];
};

/**
 * Checks if the wallet meets the requirements for ERC-7715
 * @returns A promise that resolves to an object with the requirements status
 */
export const getERC7715Requirements = async () => {
  const isMetaMask = isMetaMaskInstalled();
  const isFlask = await isMetaMaskFlask();
  const supportsWalletGrantPermissions = await supportsGrantPermissions();
  const isGatorInstalled = await isGatorSnapInstalled();
  
  return {
    isMetaMask,
    isFlask,
    supportsWalletGrantPermissions,
    isGatorInstalled
  };
};

// Check if MetaMask supports ERC-7715
export const checkMetaMaskERC7715Support = async (): Promise<{
  supported: boolean;
  reason?: string;
  requirements?: ERC7715Requirements;
}> => {
  try {
    // Get detailed requirements status
    const requirements = await getERC7715Requirements();
    
    // Check if MetaMask is installed
    if (!requirements.isMetaMask) {
      return {
        supported: false,
        reason: "MetaMask is not installed",
        requirements
      };
    }
    
    // Check if it's Flask
    if (!requirements.isFlask) {
      return {
        supported: false,
        reason: "MetaMask Flask is required for ERC-7715 support",
        requirements
      };
    }
    
    // Check if wallet_grantPermissions is supported
    if (!requirements.supportsWalletGrantPermissions) {
      return {
        supported: false,
        reason: "wallet_grantPermissions method not available. Make sure you're using MetaMask Flask 12.14.2+",
        requirements
      };
    }

    // Check if Gator snap is installed
    if (!requirements.isGatorInstalled) {
      return {
        supported: false,
        reason: "Gator snap is not installed. You'll need to approve its installation when prompted.",
        requirements
      };
    }
    
    // Check if we're on the correct chain
    const onCorrectChain = await isCorrectChain(config.chain.id);
    if (!onCorrectChain) {
      return {
        supported: false,
        reason: `Please switch to the ${config.chain.name} network in MetaMask`,
        requirements
      };
    }
    
    // If we get here, everything is supported
    return {
      supported: true,
      requirements
    };
  } catch (error) {
    console.error('Error checking ERC-7715 support:', error);
    return {
      supported: false,
      reason: `Error checking ERC-7715 support: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Request AI portfolio management permission with native-token-stream
export const requestAIPortfolioPermission = async (
  account: string, 
  maxSpendLimit: string,
  streamRate: string
): Promise<PermissionResponse | null> => {
  // First check if everything is set up correctly
  const support = await checkMetaMaskERC7715Support();
  if (!support.supported) {
    throw new Error(support.reason || 'MetaMask not properly configured for ERC-7715');
  }

  try {
    // Ensure we have a connection to the account
    try {
      await connectToMetaMask();
    } catch (error) {
      throw new Error(`Failed to connect to MetaMask: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Convert values to hexadecimal
    const maxAmountHex = `0x${parseEther(maxSpendLimit).toString(16)}`;
    const streamRateHex = `0x${parseEther(streamRate).toString(16)}`;
    
    // Current timestamp in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    // Expiry in 1 week (604800 seconds)
    const expiry = currentTime + 604800;

    // Following the ERC-7715 standard format for permission requests
    const permissionRequestParams = [
      {
        chainId: `0x${config.chain.id.toString(16)}`, // Chain ID in hex format
        expiry, // Expiry timestamp
        signer: {
          type: 'account', // Using account signer type
          data: {
            account: account as `0x${string}` // Session account address
          }
        },
        permissions: [
          {
            type: 'native-token-stream',
            data: {
              amountPerSecond: streamRateHex, // Rate at which tokens can be streamed
              maxAmount: maxAmountHex, // Maximum amount that can be transferred in total
              startTime: currentTime, // When streaming can start
              justification: `AI Portfolio Management - Max: ${maxSpendLimit} ETH, Rate: ${streamRate} ETH/s`
            }
          }
        ]
      }
    ];

    console.log('Requesting ERC-7715 permissions with params:', permissionRequestParams);
    
    // Make the actual request
    try {
      const response = await window.ethereum.request({
        method: 'wallet_grantPermissions',
        params: permissionRequestParams
      });

      console.log('Permission response:', response);
      if (Array.isArray(response) && response.length > 0) {
        return response[0] as PermissionResponse;
      }
      return null;
    } catch (error: any) {
      // Enhanced error handling
      if (error.code === -32601 || error.message?.includes('method not found')) {
        throw new Error(
          'wallet_grantPermissions method not available. ' + 
          'This feature requires MetaMask Flask 12.14.2+ and the Gator snap to be installed. ' +
          'Please make sure you have the latest version and have installed the required snap.'
        );
      } else if (error.code === -32603 || error.message?.includes('internal')) {
        throw new Error(
          'MetaMask internal error. This could happen if Gator snap is not installed. ' +
          'Please try again and approve any installation prompts in MetaMask.'
        );
      } else if (error.code === 4001 || error.message?.includes('rejected')) {
        throw new Error('Permission request was rejected by the user');
      }
      
      // Otherwise re-throw the original error
      throw error;
    }
  } catch (error) {
    console.error('Error requesting AI portfolio permission:', error);
    throw error;
  }
};

// Execute a transaction with delegation using ERC-7710
export const executeWithDelegation = async (
  walletClient: WalletClient,
  toAddress: string,
  amount: string,
  permissionsContext: `0x${string}`,
  delegationManager: `0x${string}`
): Promise<`0x${string}`> => {
  try {
    if (!walletClient.account) {
      throw new Error('Wallet client must have an account set');
    }
    
    // Check ERC-7715 support first
    const support = await checkMetaMaskERC7715Support();
    if (!support.supported) {
      throw new Error(support.reason || 'MetaMask not properly configured for ERC-7710 redemption');
    }
    
    // Extend wallet client with ERC-7710 actions
    const client = walletClient.extend(erc7710WalletActions());
    
    // Execute transaction using the delegation
    const hash = await client.sendTransaction({
      account: walletClient.account,
      chain: config.chain,
      to: toAddress as `0x${string}`,
      value: parseEther(amount),
      permissionsContext,
      delegationManager
    });
    
    return hash;
  } catch (error) {
    console.error('Error executing transaction with delegation:', error);
    throw error;
  }
};

// Parse permission response to extract necessary data for ERC-7710 redemption
export const extractDelegationData = (permission: PermissionResponse): {
  permissionsContext: `0x${string}`;
  delegationManager: `0x${string}`;
  accountMetadata: {
    factory: `0x${string}`;
    factoryData: string;
  }[];
} => {
  if (!permission) {
    throw new Error('Invalid permission: permission is null or undefined');
  }
  
  let permissionsContext: `0x${string}` | undefined;
  
  // Try to get permissionsContext from different possible locations
  if (permission.permissions && permission.permissions.length > 0) {
    permissionsContext = permission.permissions[0].permissionsContext;
  } else if (permission.permission?.permissionsContext) {
    permissionsContext = permission.permission.permissionsContext;
  } else if (permission.context) {
    permissionsContext = permission.context;
  }
  
  if (!permission.signerMeta) {
    throw new Error('Invalid permission data: signerMeta is undefined');
  }
  
  const delegationManager = permission.signerMeta.delegationManager;
  
  if (!permissionsContext || !delegationManager) {
    throw new Error('Missing permissionsContext or delegationManager in permission data');
  }
  
  return {
    permissionsContext,
    delegationManager,
    accountMetadata: permission.accountMetadata || []
  };
};

// Create a wallet client for delegation
export const createDelegationWalletClient = (ethereum: any): WalletClient => {
  return createWalletClient({
    chain: config.chain,
    transport: custom(ethereum)
  }).extend(erc7710WalletActions());
};

// Check if a specific permission is redeemable
export const isPermissionRedeemable = (permission: PermissionResponse): boolean => {
  if (!permission) return false;
  
  // Check if permission is expired
  const now = Math.floor(Date.now() / 1000);
  if (permission.expiry && permission.expiry < now) {
    return false;
  }
  
  // Try to extract necessary data for redemption
  try {
    const { permissionsContext, delegationManager } = extractDelegationData(permission);
    return !!permissionsContext && !!delegationManager;
  } catch (error) {
    console.error('Error checking if permission is redeemable:', error);
    return false;
  }
};

/**
 * Requests permission for native token streaming through ERC-7715
 * @param recipientAddress - The recipient address to stream tokens to
 * @param params - Parameters for the token stream
 * @returns The permission response from the wallet
 */
export const requestNativeTokenStreamPermission = async (
  recipientAddress: `0x${string}`,
  params: NativeTokenStreamPermissionParams
): Promise<ERC7715PermissionResponse[]> => {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  
  const req = await getERC7715Requirements();
  if (!req.isFlask || !req.supportsWalletGrantPermissions) {
    throw new Error('MetaMask Flask with ERC-7715 support is required');
  }
  
  try {
    // Format permission data
    const permissionData = {
      amountPerSecond: `0x${params.amountPerSecond.toString(16)}`,
      maxAmount: params.maxAmount ? `0x${params.maxAmount.toString(16)}` : undefined,
      initialAmount: params.initialAmount ? `0x${params.initialAmount.toString(16)}` : undefined,
      startTime: params.startTime || Math.floor(Date.now() / 1000)
    };
    
    // Request permission via ERC-7715
    const response = await window.ethereum.request({
      method: 'wallet_grantPermissions',
      params: [{
        chainId: `0x${config.chain.id.toString(16)}`,
        permissions: [
          {
            type: 'native-token-stream',
            target: recipientAddress,
            targetName: 'DAIZU Portfolio Manager',
            data: permissionData
          }
        ],
        expiry: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days
      }]
    });
    
    return response as ERC7715PermissionResponse[];
  } catch (error: any) {
    console.error('Error requesting ERC-7715 permission:', error);
    throw new Error(`Failed to request permission: ${error.message}`);
  }
};

/**
 * Redeems a native token stream permission to make a transaction
 * @param permissionResponse - The permission response from the wallet
 * @param amount - The amount to transfer
 */
export const redeemNativeTokenStreamPermission = async (
  permissionResponse: ERC7715PermissionResponse,
  amount: bigint
) => {
  try {
    // Extract required information from the permission response
    const { permissionsContext } = permissionResponse.permissions[0];
    const { delegationManager } = permissionResponse.signerMeta;
    const accountMetadata = permissionResponse.accountMetadata;
    
    // Create wallet client with ERC-7710 actions
    const walletClient = window.ethereum.request
      ? window.ethereum.extend(erc7710WalletActions())
      : null;
      
    if (!walletClient) {
      throw new Error('Failed to create wallet client');
    }
    
    // Execute the transaction with delegation
    const targetAddress = permissionResponse.signer.data.account;
    
    const txHash = await walletClient.sendTransactionWithDelegation({
      to: targetAddress,
      value: amount,
      permissionsContext,
      delegationManager,
      accountMetadata,
    });
    
    return {
      success: true,
      txHash
    };
  } catch (error: any) {
    console.error('Error redeeming ERC-7715 permission:', error);
    throw new Error(`Failed to redeem permission: ${error.message}`);
  }
}; 