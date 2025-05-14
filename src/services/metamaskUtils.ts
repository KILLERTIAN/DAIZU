/**
 * Helper utilities for working with MetaMask Flask and the Delegation Toolkit
 */

import { createWalletClient, custom, type Chain } from 'viem';
import { config } from '@/config';

/**
 * Checks if MetaMask is installed
 * @returns true if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
};

/**
 * Checks if the installed MetaMask is a Flask version
 * @returns Promise resolving to true if MetaMask Flask is detected
 */
export const isMetaMaskFlask = async (): Promise<boolean> => {
  // Check if MetaMask is installed
  if (!isMetaMaskInstalled()) {
    return false;
  }
  
  try {
    // First, check if it's explicitly marked as Flask
    if ('isFlask' in window.ethereum && window.ethereum.isFlask === true) {
      return true;
    }
    
    // Try to detect Flask by checking for Snaps feature
    if ('request' in window.ethereum) {
      try {
        // Get the list of installed snaps - Only available in Flask
        const snaps = await window.ethereum.request({
          method: 'wallet_getSnaps',
        });
        // If we get a response, it's Flask
        return !!snaps;
      } catch (error: any) {
        // If the method is not available, it's not Flask
        if (error.code === 4200) {
          return false;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for MetaMask Flask:', error);
    return false;
  }
};

/**
 * Attempts to get the MetaMask version number
 * @returns Promise resolving to the version number as a string, or null if unavailable
 */
export const getMetaMaskVersion = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    // This method is available in newer versions of MetaMask
    const version = await window.ethereum.request({
      method: 'web3_clientVersion'
    });
    
    if (typeof version === 'string') {
      // Try to extract version number using regex
      const versionMatch = version.match(/(\d+\.\d+\.\d+)/);
      if (versionMatch && versionMatch[1]) {
        return versionMatch[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting MetaMask version:', error);
    return null;
  }
};

/**
 * Checks if the installed MetaMask version supports ERC-7715
 * @returns Promise resolving to true if MetaMask supports ERC-7715
 */
export const supportsERC7715 = async (): Promise<boolean> => {
  // First check if we have MetaMask Flask
  const isFlask = await isMetaMaskFlask();
  if (!isFlask) {
    console.warn('MetaMask Flask is required for ERC-7715 support');
    return false;
  }
  
  try {
    // Try a minimal wallet_grantPermissions call that should trigger a validation error
    // This is more reliable than checking method existence in another way
    await window.ethereum.request({
      method: 'wallet_grantPermissions',
      params: [{}]
    });
    
    // If we reach here without error, method exists and supports params
    return true;
  } catch (error: any) {
    // If error code is -32602, it means invalid params, which means the method exists
    if (error.code === -32602 || 
        error.message?.includes('invalid') || 
        error.message?.includes('Invalid')) {
      return true;
    }
    
    // If error code is -32601, it means method not found
    if (error.code === -32601 || 
        error.message?.includes('method not found') || 
        error.message?.includes('Method not found')) {
      console.warn('wallet_grantPermissions method not found. Please ensure your MetaMask Flask is updated to version 12.14.2+');
      return false;
    }
    
    // For other errors, log and assume not supported
    console.error('Error checking for ERC-7715 support:', error);
    return false;
  }
};

/**
 * Check if the Gator snap is installed
 * @returns Promise resolving to true if Gator snap is installed
 */
export const isGatorSnapInstalled = async (): Promise<boolean> => {
  if (!window.ethereum) {
    return false;
  }
  
  try {
    const snaps = await window.ethereum.request({
      method: 'wallet_getSnaps'
    });
    
    if (!snaps) {
      return false;
    }
    
    return Object.keys(snaps).some(snapId => 
      snapId.includes('permission-kernel') || 
      snapId.includes('delegatable') || 
      snapId.includes('gator')
    );
  } catch (error) {
    console.error('Error checking for Gator snap:', error);
    return false;
  }
};

/**
 * Checks if the current chain ID matches the expected chain
 * @param expectedChainId - The expected chain ID
 * @returns A promise resolving to true if the current chain matches
 */
export const isCorrectChain = async (expectedChainId: number): Promise<boolean> => {
  if (!window.ethereum) return false;
  
  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);
    return chainId === expectedChainId;
  } catch (error) {
    console.error('Error checking chain:', error);
    return false;
  }
};

/**
 * Switches the network to the specified chain
 * @param chainId - The chain ID to switch to (in decimal)
 * @returns A promise resolving to true if successful
 */
export const switchChain = async (chainId: number): Promise<boolean> => {
  if (!window.ethereum) return false;
  
  const chainIdHex = `0x${chainId.toString(16)}`; // Convert to hex with 0x prefix
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (error: any) {
    // If the chain is not added to MetaMask, add it
    if (error.code === 4902) {
      try {
        // For Sepolia specifically (assuming that's what we're using)
        if (chainId === 11155111) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://ethereum-sepolia.publicnode.com'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          return true;
        }
      } catch (addError) {
        console.error('Error adding chain:', addError);
        return false;
      }
    }
    console.error('Error switching chain:', error);
    return false;
  }
};

/**
 * Connects to MetaMask and returns the connected address and wallet client
 * @returns A promise that resolves to [address, walletClient]
 */
export const connectToMetaMask = async (): Promise<[`0x${string}`, ReturnType<typeof createWalletClient>]> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  // Request accounts from MetaMask
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned from MetaMask');
  }
  
  // Create wallet client
  const client = createWalletClient({
    chain: config.chain as Chain,
    transport: custom(window.ethereum),
  });
  
  return [accounts[0] as `0x${string}`, client];
};

/**
 * Checks if the wallet supports wallet_grantPermissions method required for ERC-7715
 * @returns A promise resolving to true if the method is supported
 */
export const supportsGrantPermissions = async (): Promise<boolean> => {
  if (!window.ethereum) return false;
  
  try {
    // Check if we're on Flask and if the specific method is supported
    const isFlask = await isMetaMaskFlask();
    if (!isFlask) return false;
    
    // Attempt to detect method support - wallet_requestPermissions is part of EIP-2255
    // which is a more common method, if this exists we have a better chance of 7715 support
    if (window.ethereum.request) {
      try {
        // Just check if the method exists by starting a request but canceling it safely
        await window.ethereum.request({
          method: 'wallet_getPermissions',
        });
        // If we get here, the method exists
        return true;
      } catch (error: any) {
        // If error code is 4100 (method not found), then it's definitely not supported
        if (error.code === 4100) {
          return false;
        }
        // For other errors, the method might exist but we couldn't use it properly
        // We assume it's supported since many methods throw errors when invoked incorrectly
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for wallet_grantPermissions support:', error);
    return false;
  }
};

/**
 * Checks if MetaMask Flask meets the requirements for ERC-7715
 */
export const checkMetaMaskDetails = async () => {
  const isInstalled = isMetaMaskInstalled();
  const isFlask = await isMetaMaskFlask();
  const hasGrantPermissions = await supportsGrantPermissions();
  const isCorrectNetwork = await isCorrectChain(config.chain.id);
  
  return {
    isInstalled,
    isFlask, 
    supportsERC7715: hasGrantPermissions,
    onCorrectNetwork: isCorrectNetwork
  };
};

/**
 * Attempts to install the Gator snap (Permission Kernel Snap) if not already installed
 * @returns Promise resolving to true if installed successfully or already installed
 */
export const installGatorSnap = async (): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask not installed');
    return false;
  }
  
  // First check if already installed
  try {
    const snaps = await window.ethereum.request({
      method: 'wallet_getSnaps'
    });
    
    // Check if snaps object is returned and if any of the snaps are the Gator snap
    if (snaps) {
      const isGatorInstalled = Object.keys(snaps).some(snapId => 
        snapId.includes('permission-kernel') || 
        snapId.includes('delegatable') || 
        snapId.includes('gator')
      );
      
      if (isGatorInstalled) {
        console.log('Gator snap already installed');
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking for installed snaps:', error);
  }
  
  // If not installed, try to install it with multiple approaches
  try {
    // First try the connect method - sometimes this will trigger the installation
    console.log('Attempting to connect to wallet first...');
    try {
      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      console.log('Connected to wallet successfully');
    } catch (connectError) {
      console.error('Error connecting to wallet:', connectError);
    }
    
    // Try multiple snap IDs, starting with the most likely ones
    const snapIds = [
      'npm:@metamask/gator@latest',
      'npm:@metamask/delegation-manager@latest',
      'npm:@metamask/permission-kernel@latest',
      'npm:@metamask/delegatable@latest',
      'npm:@metamask/permission-kernel-snap@latest',
      'npm:@metamask/snap-gator@latest',
      'npm:@metamask/delegatable-snap@latest'
    ];
    
    // Try each snap ID in sequence
    for (const snapId of snapIds) {
      try {
        console.log(`Attempting to install snap: ${snapId}`);
        const result = await window.ethereum.request({
          method: 'wallet_requestSnaps',
          params: {
            [snapId]: {}
          }
        });
        
        console.log(`Snap installation result for ${snapId}:`, result);
        
        // Check if the snap was actually installed
        const snapsAfter = await window.ethereum.request({
          method: 'wallet_getSnaps'
        });
        
        const snapInstalled = Object.keys(snapsAfter || {}).some(id => 
          id.includes('permission-kernel') || 
          id.includes('delegatable') || 
          id.includes('gator')
        );
        
        if (snapInstalled) {
          console.log(`Successfully installed snap with ID: ${snapId}`);
          return true;
        }
        
        // If we get here, the call succeeded but the snap wasn't installed
        console.log(`No error, but snap ${snapId} not installed. Trying next ID.`);
      } catch (error) {
        console.error(`Error installing ${snapId}:`, error);
        // Continue to the next snap ID
      }
    }
    
    // If we get here, none of the snap IDs worked
    console.error('All snap installation attempts failed');
    
    // Try one more approach - use the connect flow and let MetaMask prompt for installation
    try {
      console.log('Attempting permission request to trigger snap installation...');
      
      // First try to connect
      await window.ethereum.request({
        method: 'eth_requestAccounts' 
      });
      
      // Then try a minimal wallet_grantPermissions call that should trigger a snap installation
      await window.ethereum.request({
        method: 'wallet_grantPermissions',
        params: [{
          permissions: [{
            type: 'native-token-stream',
            data: {
              amountPerSecond: '0x1',
              maxAmount: '0x2'
            }
          }]
        }]
      });
      
      // Check if the snap is now installed
      const snapsAfterPermission = await window.ethereum.request({
        method: 'wallet_getSnaps'
      });
      
      const snapInstalledAfterPermission = Object.keys(snapsAfterPermission || {}).some(id => 
        id.includes('permission-kernel') || 
        id.includes('delegatable') || 
        id.includes('gator')
      );
      
      if (snapInstalledAfterPermission) {
        console.log('Successfully installed snap via permission request');
        return true;
      }
      
      return false;
    } catch (permissionError) {
      console.error('Error using permission request to install snap:', permissionError);
      return false;
    }
  } catch (error) {
    console.error('Error installing Gator snap:', error);
    return false;
  }
};

/**
 * Logs detailed information about MetaMask and available snaps
 * This is useful for debugging snap installation issues
 */
export const logMetaMaskDebugInfo = async (): Promise<void> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed');
    return;
  }
  
  console.group('📊 MetaMask Debug Information');
  
  try {
    // Log MetaMask properties
    console.log('🦊 MetaMask detected:', !!window.ethereum);
    console.log('isMetaMask:', window.ethereum.isMetaMask);
    console.log('isFlask:', window.ethereum.isFlask);
    
    // Check for methods on window.ethereum
    console.log('Has request method:', typeof window.ethereum.request === 'function');
    console.log('Is wallet_getSnaps available in request scope?', 'wallet_getSnaps' in window.ethereum);
    
    // Try to get version info
    try {
      const version = await window.ethereum.request({
        method: 'web3_clientVersion'
      });
      console.log('MetaMask version:', version);
      
      // Parse Flask version from version string if possible
      if (typeof version === 'string') {
        const flaskMatch = version.match(/flask\.(\d+)/i);
        if (flaskMatch) {
          console.log('This appears to be MetaMask Flask version:', flaskMatch[1]);
        }
      }
    } catch (error) {
      console.log('Could not get MetaMask version:', error);
    }
    
    // Test direct object access to important methods
    const hasDirect = {
      request: typeof window.ethereum.request === 'function',
      enable: typeof window.ethereum.enable === 'function',
      selectedAddress: typeof window.ethereum.selectedAddress === 'string',
      chainId: typeof window.ethereum.chainId === 'string',
    };
    console.log('Direct method access:', hasDirect);
    
    // Check available methods more accurately
    try {
      console.log('Testing wallet_getSnaps method...');
      await window.ethereum.request({
        method: 'wallet_getSnaps'
      });
      console.log('wallet_getSnaps available: true');
    } catch (error) {
      console.log('wallet_getSnaps available: false', error);
    }
    
    try {
      console.log('Testing wallet_requestSnaps method...');
      // Just check if method exists by starting request with invalid params
      // This should throw a specific error if available
      await window.ethereum.request({
        method: 'wallet_requestSnaps',
        params: {} // Invalid params to test if method exists
      });
    } catch (error: any) {
      // If error.code is related to invalid params, the method exists
      if (error.code === -32602 || error.message?.includes('params')) {
        console.log('wallet_requestSnaps available: true (throws expected error)');
      } else {
        console.log('wallet_requestSnaps available: false', error);
      }
    }
    
    try {
      console.log('Testing wallet_grantPermissions method...');
      await window.ethereum.request({
        method: 'wallet_grantPermissions',
        params: [{}] // Invalid params to test if method exists
      });
    } catch (error: any) {
      // If error.code is related to invalid params, the method exists
      if (error.code === -32602 || error.message?.includes('params')) {
        console.log('wallet_grantPermissions available: true (throws expected error)');
      } else {
        console.log('wallet_grantPermissions available: false', error);
      }
    }
    
    // Try to get installed snaps
    try {
      console.log('Fetching installed snaps...');
      const snaps = await window.ethereum.request({
        method: 'wallet_getSnaps'
      });
      
      console.log('Installed snaps:', snaps);
      
      if (snaps && Object.keys(snaps).length > 0) {
        Object.entries(snaps).forEach(([snapId, snapData]) => {
          console.log(`Snap ID: ${snapId}`);
          console.log('Snap data:', snapData);
        });
        
        // Check for Gator snap specifically
        const hasGatorSnap = Object.keys(snaps).some(snapId => 
          snapId.includes('permission-kernel') || 
          snapId.includes('delegatable') || 
          snapId.includes('gator')
        );
        
        console.log('Gator snap detected:', hasGatorSnap);
      } else {
        console.log('No snaps are installed');
      }
    } catch (error) {
      console.error('Error fetching installed snaps:', error);
    }
    
    // Check permission support
    try {
      const permissions = await window.ethereum.request({
        method: 'wallet_getPermissions'
      });
      console.log('Permissions support available:', true);
      console.log('Current permissions:', permissions);
    } catch (error) {
      console.log('Permissions support available: false', error);
    }
  } catch (error) {
    console.error('Error logging MetaMask debug info:', error);
  }
  
  console.groupEnd();
}; 