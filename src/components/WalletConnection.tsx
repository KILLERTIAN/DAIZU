import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Wallet, AlertTriangle, CheckCircle2, Beaker } from 'lucide-react';
import { useWallet } from '@/providers/WalletProvider';
import { getERC7715Requirements } from '@/services/permissionService';
import { cn } from '@/lib/utils';
import WalletConnectionDialog, { WalletRequirements } from './WalletConnectionDialog';
import { isCorrectChain } from '@/services/metamaskUtils';
import { config } from '@/config';

interface WalletConnectionProps {
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  showBalance?: boolean;
  variant?: 'default' | 'minimal' | 'full';
}

/**
 * WalletConnection component that properly handles connection to MetaMask Flask
 * and ensures the required components for ERC-7715 are available
 */
export default function WalletConnection({
  className,
  size = 'default',
  showBalance = false,
  variant = 'default'
}: WalletConnectionProps) {
  const { 
    address, 
    isConnected, 
    connectWallet, 
    disconnect, 
    isMetaMaskFlask, 
    chainId, 
    switchToSepolia,
    isDemoMode,
    balance,
    setIsDemoMode,
    erc7715Support
  } = useWallet();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requirements, setRequirements] = useState<WalletRequirements>({
    isMetaMask: false,
    isFlask: false,
    supportsWalletGrantPermissions: false,
    onCorrectNetwork: false
  });
  const [connectingState, setConnectingState] = useState<'idle' | 'connecting' | 'switching' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fast check for wallet requirements - only do minimum checks until dialog opens
  const quickCheckRequirements = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const reqs = await getERC7715Requirements();
      const onCorrectChain = await isCorrectChain(config.chain.id);
      
      setRequirements({
        isMetaMask: reqs.isMetaMask,
        isFlask: reqs.isFlask,
        supportsWalletGrantPermissions: reqs.supportsWalletGrantPermissions,
        onCorrectNetwork: onCorrectChain
      });
      
      // Automatically show the dialog if detecting MetaMask but not Flask
      if (reqs.isMetaMask && !reqs.isFlask && !isDemoMode && !isConnected) {
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error checking wallet requirements:', error);
    }
  };

  // Run quick requirements check on mount and when connection status changes
  useEffect(() => {
    quickCheckRequirements();
  }, [isConnected, chainId, isDemoMode]);

  // Handle connect wallet click
  const handleConnectClick = async () => {
    setConnectingState('connecting');
    setErrorMessage(null);
    
    try {
      // Refresh requirements
      await quickCheckRequirements();
      
      // Quick connect attempt if everything looks good
      if (requirements.isMetaMask && requirements.isFlask && 
          requirements.supportsWalletGrantPermissions) {
        await connectWallet();
        
        // After connecting, check if we need to switch to Sepolia
        if (chainId && chainId !== 11155111 && !isDemoMode) {
          setConnectingState('switching');
          await switchToSepolia();
        }
      } else {
        // If requirements not met, show dialog
        setIsDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      
      // Specific error handling
      if (error.message?.includes('rejected')) {
        setErrorMessage('Connection request rejected by user');
      } else if (error.message?.includes('MetaMask not installed')) {
        setErrorMessage('MetaMask is not installed in this browser');
      } else if (error.message?.includes('Flask')) {
        setErrorMessage('This feature requires MetaMask Flask');
      } else {
        setErrorMessage(error.message || 'Failed to connect');
      }
      
      setIsDialogOpen(true);
    } finally {
      setConnectingState('idle');
    }
  };

  // Handle using demo mode from dialog
  const handleUseDemoMode = () => {
    setIsDemoMode(true);
    connectWallet();
    setIsDialogOpen(false);
  };
  
  // Toggle demo mode
  const toggleDemoMode = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
    } else {
      setIsDemoMode(true);
      if (!isConnected) {
        connectWallet();
      }
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
  };

  // Button text based on state
  const buttonText = () => {
    if (connectingState === 'connecting') return 'Connecting...';
    if (connectingState === 'switching') return 'Switching Network...';
    return isDemoMode ? 'Demo Mode' : 'Connect Wallet';
  };

  const showWarning = !isMetaMaskFlask && !isDemoMode && connectingState !== 'connecting';

  // Get button size class
  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 px-3 text-xs';
      case 'lg': return 'h-12 px-6 text-base';
      default: return '';
    }
  };

  // Display the appropriate button based on connection state
  return (
    <div className={className}>
      {!isConnected ? (
        <Button 
          onClick={handleConnectClick} 
          disabled={connectingState === 'connecting' || connectingState === 'switching'}
          className={cn(
            `${showWarning ? 'bg-yellow-600 hover:bg-yellow-700' : ''} flex items-center gap-2`,
            isDemoMode ? 'bg-purple-600 hover:bg-purple-700' : '',
            getButtonSize()
          )}
        >
          {isDemoMode ? (
            <Beaker className="h-4 w-4" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          {buttonText()}
          {showWarning && <AlertTriangle className="h-4 w-4" />}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          {showBalance && balance && (
            <div className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-md text-xs">
              {(Number(balance) / 10**18).toFixed(4)} ETH
            </div>
          )}
          <div className="px-3 py-1 bg-green-900/30 text-green-400 rounded-md text-xs truncate max-w-[140px] flex items-center">
            {chainId === 11155111 ? (
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
            )}
            {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
            {isDemoMode && <span className="ml-1 text-[10px] text-purple-400">(Demo)</span>}
          </div>
          {variant !== 'minimal' && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDisconnect}
              className="px-2 h-8"
            >
              Disconnect
            </Button>
          )}
        </div>
      )}

      {/* New streamlined connection dialog */}
      <WalletConnectionDialog
        isOpen={isDialogOpen || connectingState === 'error'}
        onClose={() => setIsDialogOpen(false)}
        requirements={requirements}
        error={errorMessage}
        onUseDemoMode={handleUseDemoMode}
        toggleDemo={toggleDemoMode}
        isDemoMode={isDemoMode}
      />
    </div>
  );
} 