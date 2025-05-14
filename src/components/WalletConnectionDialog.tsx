import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldAlert, HelpCircle, Wallet, Info } from 'lucide-react';

// Requirements check result type
export type WalletRequirements = {
  isMetaMask: boolean;
  isFlask: boolean;
  supportsWalletGrantPermissions: boolean;
  onCorrectNetwork: boolean;
};

interface WalletConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: WalletRequirements;
  error: string | null;
  onUseDemoMode: () => void;
  toggleDemo?: () => void;
  isDemoMode?: boolean;
}

export default function WalletConnectionDialog({
  isOpen,
  onClose,
  requirements,
  error,
  onUseDemoMode,
  toggleDemo,
  isDemoMode = false
}: WalletConnectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="text-yellow-500 h-5 w-5" />
            MetaMask Flask Required
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            ERC-7715 delegation requires MetaMask Flask 12.14.2+ with the wallet_grantPermissions method
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-2 rounded-md bg-gray-800/50">
              {requirements.isMetaMask ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-sm font-medium">MetaMask Extension</div>
                <p className="text-xs text-gray-400">
                  {requirements.isMetaMask 
                    ? "✓ MetaMask is installed" 
                    : "MetaMask extension is required"}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-2 rounded-md bg-gray-800/50">
              {requirements.isFlask ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-sm font-medium">MetaMask Flask</div>
                <p className="text-xs text-gray-400">
                  {requirements.isFlask 
                    ? "✓ MetaMask Flask detected" 
                    : "Regular MetaMask detected. Please install Flask version."}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-2 rounded-md bg-gray-800/50">
              {requirements.supportsWalletGrantPermissions ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-sm font-medium">ERC-7715 Support</div>
                <p className="text-xs text-gray-400">
                  {requirements.supportsWalletGrantPermissions 
                    ? "✓ Your Flask version supports wallet_grantPermissions" 
                    : "MetaMask Flask 12.14.2+ required for ERC-7715 support"}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-2 rounded-md bg-gray-800/50">
              {requirements.onCorrectNetwork ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-sm font-medium">Sepolia Network</div>
                <p className="text-xs text-gray-400">
                  {requirements.onCorrectNetwork 
                    ? "✓ Connected to Sepolia testnet" 
                    : "Please switch to Sepolia testnet"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-blue-900/20 border border-blue-700/20 rounded-md flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-100">
              <p className="font-medium mb-1">What is MetaMask Flask?</p>
              <p className="text-xs">
                Flask is a developer-focused version of MetaMask that supports experimental features like 
                ERC-7715 permissions, which allows our DApp to request limited, controlled access to your assets.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <a 
              href="https://metamask.io/flask/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition-colors"
            >
              Get MetaMask Flask <ExternalLink className="h-3 w-3 ml-1" />
            </a>
            
            <Button 
              onClick={onUseDemoMode} 
              className={isDemoMode ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-600 hover:bg-gray-700"}
            >
              {isDemoMode ? "Connected in Demo Mode" : "Use Demo Mode"}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 mt-2 flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Important:</strong> If you have the regular MetaMask installed, you need to use a separate browser profile for Flask to avoid conflicts.
              <br /><br />
              <a href="https://docs.gator.metamask.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                Learn more about MetaMask Delegation Toolkit
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 