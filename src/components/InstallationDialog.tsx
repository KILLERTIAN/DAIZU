import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, Download, AlertTriangle, Github, Sparkles } from 'lucide-react';
import { installGatorSnap, logMetaMaskDebugInfo } from '@/services/metamaskUtils';

interface InstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseDemoMode?: () => void;
}

const InstallationDialog: React.FC<InstallationDialogProps> = ({
  open,
  onOpenChange,
  onUseDemoMode
}) => {
  const [isInstallingSnap, setIsInstallingSnap] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const handleInstallGatorSnap = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask Flask first.");
      return;
    }
    
    setIsInstallingSnap(true);
    setInstallStatus('idle');
    
    await logMetaMaskDebugInfo();
    
    try {
      console.log('Attempting to install Gator snap from UI...');
      const installed = await installGatorSnap();
      if (installed) {
        setInstallStatus('success');
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        setInstallStatus('error');
        console.error("Gator snap installation failed via all methods");
      }
    } catch (error) {
      console.error("Error installing Gator snap:", error);
      setInstallStatus('error');
    } finally {
      setIsInstallingSnap(false);
    }
  };

  const handleUseDemoMode = () => {
    if (onUseDemoMode) {
      onUseDemoMode();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">MetaMask Flask & Gator Setup</DialogTitle>
          <DialogDescription className="text-gray-400">
            You need to install and set up some components to use AI delegation with ERC-7715
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* MetaMask Flask Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/20 text-purple-500">1</span>
              Install MetaMask Flask
            </h3>
            
            <div className="rounded-md bg-gray-700/50 p-4">
              <p className="text-sm text-gray-300 mb-3">
                MetaMask Flask is a developer-focused version of MetaMask that supports experimental features like ERC-7715 permissions.
              </p>
              
              <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-md p-3 mb-4">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Important</p>
                    <p className="text-xs text-gray-300">
                      If you already have regular MetaMask installed, it's recommended to use a different browser or profile for Flask to avoid conflicts.
                    </p>
                  </div>
                </div>
              </div>
              
              <a 
                href="https://metamask.io/flask/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button className="flex gap-2 items-center">
                  <Download className="h-4 w-4" />
                  Download MetaMask Flask
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </a>
            </div>
          </div>
          
          {/* Required Version Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/20 text-purple-500">2</span>
              Check MetaMask Flask Version
            </h3>
            
            <div className="rounded-md bg-gray-700/50 p-4">
              <p className="text-sm text-gray-300 mb-2">
                Make sure you're running MetaMask Flask version 12.14.2 or higher:
              </p>
              
              <ol className="text-sm text-gray-300 space-y-2 ml-5 list-decimal">
                <li>Click on the MetaMask Flask extension icon</li>
                <li>Click on your account icon in the top-right corner</li>
                <li>Go to Settings</li>
                <li>Click on About</li>
                <li>Check the version number</li>
              </ol>
              
              <div className="flex items-center gap-2 mt-3 p-2 bg-green-900/20 rounded-md border border-green-800/30">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-300">
                  Version 12.14.2 or higher is required for ERC-7715 support
                </p>
              </div>
            </div>
          </div>
          
          {/* Install Gator Snap */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/20 text-purple-500">3</span>
              Install the Gator Snap
            </h3>
            
            <div className="rounded-md bg-gray-700/50 p-4">
              <p className="text-sm text-gray-300 mb-3">
                The Gator snap will be automatically prompted for installation when you try to use the delegation feature.
                You just need to approve it when prompted.
              </p>
              
              <div className="flex flex-col gap-3 mt-3">
                <div className="flex items-center gap-2 p-2 bg-blue-900/20 rounded-md border border-blue-800/30">
                  <div className="text-sm text-blue-300">
                    <p><strong>Note:</strong> When prompted to connect our app and install the Gator snap, click "Connect" and follow the instructions.</p>
                  </div>
                </div>
                
                {/* Direct snap installation button */}
                <div className="p-3 bg-purple-900/20 border border-purple-700/20 rounded-md">
                  <p className="text-sm text-purple-300 mb-3">
                    If you're not getting prompted automatically, you can try installing the Gator snap directly:
                  </p>
                  
                  <Button 
                    onClick={handleInstallGatorSnap}
                    disabled={isInstallingSnap}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isInstallingSnap ? (
                      <>
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        Installing Gator Snap...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Install Gator Snap Directly
                      </>
                    )}
                  </Button>
                  
                  {installStatus === 'success' && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-green-900/20 rounded-md border border-green-800/30">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <p className="text-xs text-green-300">
                        Gator snap installed successfully!
                      </p>
                    </div>
                  )}
                  
                  {installStatus === 'error' && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-red-900/20 rounded-md border border-red-800/30">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <p className="text-xs text-red-300">
                        Error installing Gator snap. Please try using the links below.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <a 
                    href="https://docs.gator.metamask.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" className="flex gap-2 items-center">
                      <ExternalLink className="h-4 w-4" />
                      Gator Documentation
                    </Button>
                  </a>
                  
                  <a 
                    href="https://github.com/MetaMask/permission-kernel-snap" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" className="flex gap-2 items-center">
                      <Github className="h-4 w-4" />
                      GitHub Repository
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Switch to Sepolia */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/20 text-purple-500">4</span>
              Connect to Sepolia Testnet
            </h3>
            
            <div className="rounded-md bg-gray-700/50 p-4">
              <p className="text-sm text-gray-300 mb-2">
                Make sure your MetaMask is connected to the Sepolia testnet:
              </p>
              
              <ol className="text-sm text-gray-300 space-y-2 ml-5 list-decimal">
                <li>Open MetaMask Flask</li>
                <li>Click on the network dropdown at the top</li>
                <li>Select "Sepolia Test Network"</li>
                <li>If Sepolia isn't available, add it manually in Settings {'>'} Networks</li>
              </ol>
              
              <div className="flex items-center gap-2 mt-3 p-2 bg-blue-900/20 rounded-md border border-blue-800/30">
                <AlertTriangle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-300">
                  You'll need some Sepolia ETH for testing. Visit sepoliafaucet.com to get free ETH.
                </p>
              </div>
            </div>
          </div>
          
          {/* Troubleshooting section */}
          <div className="space-y-3 mt-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-600/20 text-yellow-500">!</span>
              Troubleshooting
            </h3>
            
            <div className="rounded-md bg-gray-700/50 p-4">
              <p className="text-sm text-gray-300 mb-3">
                If you're having issues installing the Gator snap, try these steps:
              </p>
              
              <ol className="text-sm text-gray-300 space-y-2 ml-5 list-decimal">
                <li>Make sure you're using MetaMask Flask version 12.14.2 or higher</li>
                <li>Disable any other MetaMask extensions (regular MetaMask) if installed</li>
                <li>Try in a different browser or private/incognito window</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try connecting to your site first before attempting to install the snap</li>
                <li>Check the console for any specific error messages (F12 {'>'} Console)</li>
              </ol>
              
              <div className="p-3 mt-3 rounded-md border border-blue-700/30 bg-blue-900/20">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> The Gator snap is still in development. If all else fails, you can use the demo mode to try out the functionality.
                </p>
              </div>
              
              <div className="p-3 mt-3 rounded-md border border-orange-700/30 bg-orange-900/20">
                <p className="text-sm text-orange-300 font-medium mb-2">
                  Important Note About Gator Snap Installation
                </p>
                <p className="text-sm text-gray-300">
                  The Gator snap (permission-kernel) is an experimental feature that is still in development. You may encounter the following issues:
                </p>
                <ul className="text-sm text-gray-300 mt-2 space-y-1 list-disc pl-5">
                  <li>Failed installation attempts with 404 errors (package not found)</li>
                  <li>MetaMask not showing installation prompts</li>
                  <li>MetaMask stalling during connection</li>
                </ul>
                <p className="text-sm text-gray-300 mt-2">
                  Since this is an experimental feature, we recommend using the "Continue in Demo Mode" button below to experience the app functionality.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex flex-col space-y-3">
            <Button onClick={() => onOpenChange(false)} className="w-full">
              I understand, let me try again
            </Button>
            
            {onUseDemoMode && (
              <Button 
                onClick={handleUseDemoMode} 
                variant="outline" 
                className="w-full border-yellow-600/60 text-yellow-400 hover:bg-yellow-950/30"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Continue in Demo Mode
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallationDialog; 