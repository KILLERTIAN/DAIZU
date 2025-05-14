import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { CheckCircle2, Clock, HelpCircle, Info, Shield, Sparkles, Zap, Beaker } from 'lucide-react';
import { parseEther, formatEther } from 'viem';
import { requestNativeTokenStreamPermission } from '@/services/permissionService';
import { useWallet } from '@/providers/WalletProvider';
import { Skeleton } from './ui/skeleton';

interface AIPortfolioManagerProps {
  className?: string;
}

export default function AIPortfolioManager({ className }: AIPortfolioManagerProps) {
  const { address, isDemoMode } = useWallet();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionResponse, setPermissionResponse] = useState<any>(null);
  const [amountPerDay, setAmountPerDay] = useState(5); // Default: 5 USDC per day
  const [maxAllowance, setMaxAllowance] = useState(100); // Default: 100 USDC max
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Calculate daily amount in ETH per second (as string before parsing to avoid decimal errors)
  const amountPerSecond = (amountPerDay / 86400).toFixed(18); // Ensure proper decimal format
  const amountPerSecondWei = parseEther(amountPerSecond);
  const maxAmountWei = parseEther(maxAllowance.toString());
  
  // Request delegation permission
  const handleRequestPermission = async () => {
    if (!address || isDemoMode) return;
    
    setPermissionLoading(true);
    try {
      // AI Portfolio Manager address (simulated for now)
      const aiPortfolioAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as `0x${string}`;
      
      const response = await requestNativeTokenStreamPermission(
        aiPortfolioAddress,
        {
          amountPerSecond: amountPerSecondWei,
          maxAmount: maxAmountWei,
          startTime: Math.floor(Date.now() / 1000)
        }
      );
      
      setPermissionResponse(response[0]);
      setPermissionGranted(true);
      setPermissionLoading(false);
    } catch (error) {
      console.error('Failed to grant permission:', error);
      setPermissionLoading(false);
    }
  };
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="relative pb-2">
        <Badge variant="outline" className="absolute right-6 top-6 bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Sparkles className="h-3 w-3 mr-1" /> AI-Enabled
        </Badge>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Shield className="h-5 w-5 text-green-500" />
          AI Portfolio Manager
        </CardTitle>
        <CardDescription>
          Grant limited delegation permissions to the AI to manage your portfolio
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {permissionGranted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-300">Permission Granted</p>
                <p className="text-xs text-gray-300">
                  The AI Portfolio Manager can now automate your investments up to your specified limits
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <p className="text-xs text-gray-400">Daily Limit</p>
                <p className="text-lg font-semibold">{amountPerDay} USDC</p>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <p className="text-xs text-gray-400">Maximum Allowance</p>
                <p className="text-lg font-semibold">{maxAllowance} USDC</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm">AI Portfolio Allocation</p>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                  Active
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Stablecoins: 40%</span>
                  <span className="text-gray-400">ETH: 30%</span>
                  <span className="text-gray-400">BTC: 30%</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden bg-gray-800 flex">
                  <div className="h-full bg-blue-500" style={{ width: '40%' }}></div>
                  <div className="h-full bg-purple-500" style={{ width: '30%' }}></div>
                  <div className="h-full bg-orange-500" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isDemoMode ? (
              <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-6 rounded-lg border border-purple-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-500/20 rounded-full">
                    <Beaker className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Demo Mode Active</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      You're currently in demo mode. This allows you to explore the AI portfolio management features without connecting a real wallet.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-sm text-gray-300">Simulated portfolio with $10,000 USD</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-sm text-gray-300">AI trading simulation enabled</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-sm text-gray-300">Real-time market data integration</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-sm text-gray-300">Test ERC-7715 delegation features</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-sm text-gray-300">Explore portfolio analytics</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-sm text-gray-300">Try different trading strategies</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">AI Portfolio Settings</h3>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    Live Mode
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Daily Trading Limit (USDC)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={amountPerDay}
                        onChange={(e) => setAmountPerDay(Number(e.target.value))}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="1"
                        max="1000"
                      />
                      <span className="text-gray-400">USDC</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Maximum amount the AI can trade per day
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Maximum Allowance (USDC)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={maxAllowance}
                        onChange={(e) => setMaxAllowance(Number(e.target.value))}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="10"
                        max="10000"
                      />
                      <span className="text-gray-400">USDC</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Total amount the AI can manage
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleRequestPermission}
                  disabled={!address || permissionLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  isLoading={permissionLoading}
                >
                  {permissionGranted ? 'Update Delegation' : 'Enable AI Delegation'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {permissionGranted ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1">
              Modify Limits
            </Button>
            <Button variant="destructive" className="flex-1">
              Revoke Permission
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleRequestPermission} 
            disabled={!address || isDemoMode || permissionLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {permissionLoading ? (
              <>
                <Skeleton className="h-4 w-4 rounded-full mr-2 bg-white/20" />
                Processing Permission...
              </>
            ) : isDemoMode ? (
              "Connect Real Wallet to Enable"
            ) : (
              "Grant AI Permission via ERC-7715"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 