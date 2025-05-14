"use client";
import React, { useState, useEffect } from "react";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/Loader";
import { LineChart, Wallet, ChevronRight, TrendingDown, TrendingUp, AlertTriangle, Settings, Zap, Activity, ArrowUpRight, ArrowDownRight, DollarSign, PieChart, Clock, Info, RefreshCw, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/providers/PermissionProvider";
import { motion } from "framer-motion";
import AIDelegationButton from "@/components/AIDelegationButton";
import CryptoIcon from "@/components/CryptoIcon";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const Dashboard = () => {
  const router = useRouter();
  const { portfolio, isLoading, isDelegationActive, pendingTrades, simulateCrash } = usePortfolio();
  const { permission, isLoading: permissionLoading } = usePermissions();
  const [isCrashing, setIsCrashing] = useState(false);
  const [mockBalance, setMockBalance] = useState("0.23");
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  /**
   * Helper function to get permission details, handling both formats:
   * 1. permission.permission (singular)
   * 2. permission.permissions[0] (array)
   */
  const getPermissionDetails = () => {
    if (!permission) return null;
    
    if (permission.permission) {
      return permission.permission;
    } else if (permission.permissions && permission.permissions.length > 0) {
      return permission.permissions[0];
    }
    
    return null;
  };

  /**
   * Format the allowance value from the permission
   */
  const formatAllowance = () => {
    const permissionDetails = getPermissionDetails();
    if (!permissionDetails || !permissionDetails.data) return "0.1 ETH";
    
    // Check for allowance in native-token-transfer
    if (permissionDetails.data.allowance) {
      const allowance = permissionDetails.data.allowance;
      if (allowance === "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") {
        return "unlimited ETH";
      }
      try {
        return `${Number(BigInt(allowance)) / 10**18} ETH`;
      } catch (e) {
        return "0.1 ETH";
      }
    }
    
    // Check for maxAmount in native-token-stream
    if (permissionDetails.data.maxAmount) {
      const maxAmount = permissionDetails.data.maxAmount;
      if (maxAmount === "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") {
        return "unlimited ETH";
      }
      try {
        return `${Number(BigInt(maxAmount)) / 10**18} ETH`;
      } catch (e) {
        return "0.1 ETH";
      }
    }
    
    return "0.1 ETH";
  };

  /**
   * Get the permission type
   */
  const getPermissionType = () => {
    const permissionDetails = getPermissionDetails();
    if (!permissionDetails) return "Native Token Transfer";
    
    return permissionDetails.type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  /**
   * Format the time from timestamp
   */
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  useEffect(() => {
    // Mock data updating
    const interval = setInterval(() => {
      if (!isUpdating) {
        const newBalance = (parseFloat(mockBalance) + (Math.random() * 0.02 - 0.01)).toFixed(2);
        setMockBalance(newBalance);
        setLastUpdate(Date.now());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [mockBalance, isUpdating]);

  const updatePortfolio = () => {
    setIsUpdating(true);
    setTimeout(() => {
      const newBalance = (parseFloat(mockBalance) + (Math.random() * 0.05 - 0.02)).toFixed(2);
      setMockBalance(newBalance);
      setLastUpdate(Date.now());
      setIsUpdating(false);
    }, 2000);
  };

  if (isLoading || permissionLoading) {
    return <Loader />;
  }

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">Portfolio Not Found</h2>
            <p className="mb-4 text-gray-500">Unable to load your portfolio data.</p>
            <Button onClick={() => router.push("/")} variant="primary">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSimulateCrash = () => {
    setIsCrashing(true);
    
    // Simulate UI loading state
    setTimeout(() => {
      simulateCrash();
      setIsCrashing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">Portfolio Dashboard</h1>
              <p className="text-gray-300">Your AI-managed crypto investments</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-3">
              <Button 
                onClick={handleSimulateCrash} 
                variant="destructive" 
                isLoading={isCrashing}
                loadingText="Simulating..."
                icon={<TrendingDown className="w-4 h-4" />}
              >
                Simulate Market Crash
              </Button>
              <Button 
                onClick={() => router.push("/portfolio")} 
                variant="primary"
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Portfolio Details
              </Button>
            </div>
          </div>
          
          {/* Portfolio summary and delegation status cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gray-800 border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <CryptoIcon symbol="ETH" size={24} />
                  <h3 className="text-lg font-semibold">Total Value</h3>
                </div>
                <p className="text-3xl font-bold">${mockBalance} ETH</p>
                
                <div className="mt-2 flex items-center">
                  <Badge variant={
                    // Calculate 24h change
                    portfolio.performanceHistory.length >= 2 ? 
                      (portfolio.performanceHistory[portfolio.performanceHistory.length - 1].value > 
                      portfolio.performanceHistory[portfolio.performanceHistory.length - 2].value ? 
                      "success" : "destructive") : "default"
                  }>
                    {portfolio.performanceHistory.length >= 2 ? 
                      ((portfolio.performanceHistory[portfolio.performanceHistory.length - 1].value - 
                      portfolio.performanceHistory[portfolio.performanceHistory.length - 2].value) / 
                      portfolio.performanceHistory[portfolio.performanceHistory.length - 2].value * 100).toFixed(2) + "%" : 
                      "0%"
                    }
                  </Badge>
                  <span className="ml-2 text-sm text-gray-400">24h Change</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">Risk Score</h3>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-3xl font-bold">{portfolio.riskScore}/10</p>
                  <div className="flex-1">
                    <Progress 
                      value={portfolio.riskScore * 10} 
                      max={100} 
                      variant={portfolio.riskScore > 7 ? "error" : portfolio.riskScore > 4 ? "warning" : "success"}
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {portfolio.riskScore > 7 ? "High risk" : portfolio.riskScore > 4 ? "Medium risk" : "Low risk"} profile
                </p>
              </CardContent>
            </Card>
            
            <Card className={`border-0 shadow-lg ${isDelegationActive ? 'bg-green-900/40' : 'bg-gray-800'}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className={`w-5 h-5 ${isDelegationActive ? 'text-green-300' : 'text-yellow-400'}`} />
                  <h3 className="text-lg font-semibold">AI Delegation</h3>
                </div>
                
                {isDelegationActive ? (
                  <>
                    <p className="text-xl font-bold flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Active
                    </p>
                    <div className="mt-2 text-sm">
                      <p className="text-gray-300">
                        AI can manage up to {formatAllowance()}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Expires: {permission && new Date(permission.expiry * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span> Inactive
                    </p>
                    <p className="mt-2 text-sm text-gray-300">
                      Grant permission for AI to manage your portfolio
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </header>
        
        {/* Asset allocation */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Asset Allocation</h2>
            <PieChart className="w-6 h-6 text-purple-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {portfolio.assets.map((asset) => (
              <Card key={asset.token.symbol} className="bg-gray-800 border-0 shadow-lg overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CryptoIcon symbol={asset.token.symbol} size={32} />
                    <div>
                      <h3 className="font-semibold">{asset.token.symbol}</h3>
                      <p className="text-xs text-gray-400">{asset.token.name}</p>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-lg font-bold">${asset.token.balanceUsd.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">{asset.token.balance} {asset.token.symbol}</p>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-1">
                    <span>Allocation</span>
                    <span>{asset.allocation.toFixed(1)}%</span>
                  </div>
                  <Progress value={asset.allocation} max={100} />
                  
                  <div className="mt-3 flex items-center justify-between">
                    <Badge 
                      variant={asset.token.priceChange24h > 0 ? "success" : 
                             asset.token.priceChange24h < 0 ? "destructive" : "secondary"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {asset.token.priceChange24h > 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {asset.token.priceChange24h.toFixed(2)}%
                    </Badge>
                    <p className="text-sm">${asset.token.price.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Pending AI Actions */}
        {pendingTrades.length > 0 && (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Pending AI Actions</h2>
              <Button 
                onClick={() => router.push("/analytics")} 
                variant="outline" 
                size="sm"
              >
                View All Actions
              </Button>
            </div>
            
            <Card className="bg-gray-800 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-4">Action</th>
                        <th className="text-left p-4">From</th>
                        <th className="text-left p-4">To</th>
                        <th className="text-left p-4">Amount</th>
                        <th className="text-left p-4">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTrades.slice(0, 3).map((trade, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-4">
                            <Badge variant={trade.type === 'BUY' ? 'success' : 'destructive'}>
                              {trade.type}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <CryptoIcon symbol={trade.fromToken.symbol} size={20} />
                              <span>{trade.fromToken.symbol}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <CryptoIcon symbol={trade.toToken.symbol} size={20} />
                              <span>{trade.toToken.symbol}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {parseFloat(trade.amount).toFixed(4)} {trade.fromToken.symbol}
                          </td>
                          <td className="p-4 text-sm text-gray-300 max-w-xs truncate">
                            {trade.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
        
        {/* Performance Chart Placeholder */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Portfolio Performance</h2>
            <Button 
              onClick={() => router.push("/analytics")}
              variant="outline" 
              size="sm"
            >
              View Analytics
            </Button>
          </div>
          
          <Card className="bg-gray-800 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-center items-center p-10 border border-dashed border-gray-700 rounded-lg">
                <div className="text-center">
                  <LineChart className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">
                    Performance chart will be displayed here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Status and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="h-full bg-gray-800/50 border-0 shadow-lg overflow-hidden backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Portfolio Overview</h2>
                  <span className="text-xs text-gray-400">Last updated: {formatTimeAgo(lastUpdate)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CryptoIcon symbol="ETH" size={16} className="mr-1" />
                      <span className="text-sm text-gray-300">Total Value</span>
                    </div>
                    <div className="text-2xl font-bold">${mockBalance} ETH</div>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300">24h Change</span>
                    </div>
                    <div className={`text-2xl font-bold ${Math.random() > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                      {Math.random() > 0.5 ? '+' : '-'}{(Math.random() * 5).toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">AI Trades</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {permission ? Math.floor(Math.random() * 5) : 0}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={updatePortfolio}
                    isLoading={isUpdating}
                    loadingText="Updating..."
                    variant="outline" 
                    size="sm"
                  >
                    Refresh Data
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-purple-300 border-purple-500/30 hover:bg-purple-500/10"
                  >
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full bg-gray-800/50 border-0 shadow-lg overflow-hidden backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">AI Delegation</h2>
                
                {permission ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-900/20 border border-green-500/20 rounded-lg flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-full">
                        <Shield className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-300">Delegation Active</h3>
                        <p className="text-xs text-gray-400">AI can trade on your behalf</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Type:</span>
                        <span className="text-sm">{getPermissionType()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Allowance:</span>
                        <span className="text-sm">{formatAllowance()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Expires:</span>
                        <span className="text-sm">
                          {permission && permission.expiry
                            ? new Date(permission.expiry * 1000).toLocaleDateString()
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-700/30 rounded-lg flex items-center gap-3">
                      <div className="p-2 bg-gray-600/50 rounded-full">
                        <Shield className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">No Active Delegation</h3>
                        <p className="text-xs text-gray-400">Grant permission to enable AI trading</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <AIDelegationButton />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Info Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-0 shadow-lg backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/20 rounded-full">
                  <Info className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-2">How ERC-7715 AI Delegation Works</h2>
                  <p className="text-sm text-gray-300 mb-4">
                    ERC-7715 enables your wallet to grant specific permissions to our AI system, 
                    allowing it to execute trades on your behalf within strict limits that you set.
                    Unlike traditional DeFi where you need to approve every transaction, this delegation
                    system lets the AI work for you 24/7 without constant approval requests.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Set Time Limits
                      </h3>
                      <p className="text-xs text-gray-400">
                        All permissions expire automatically after the time period you set
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Set Spending Limits
                      </h3>
                      <p className="text-xs text-gray-400">
                        Control exactly how much of your assets the AI can manage
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Revoke Anytime
                      </h3>
                      <p className="text-xs text-gray-400">
                        Cancel the delegation with a single click if you change your mind
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="link" 
                    className="text-blue-400 hover:text-blue-300 mt-4 px-0"
                    onClick={() => window.open("https://eips.ethereum.org/EIPS/eip-7715", "_blank")}
                  >
                    <span>Learn more about ERC-7715</span>
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity (Placeholder) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-800/50 border-0 shadow-lg overflow-hidden backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Recent AI Activity</h2>
              
              {permission ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-400" />
                          <span className="font-medium">{Math.random() > 0.5 ? 'Buy' : 'Sell'} {Math.random() > 0.5 ? 'ETH' : 'WETH'}</span>
                        </div>
                        <span className="text-xs text-gray-400">{Math.floor(Math.random() * 60)} minutes ago</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        {Math.random() > 0.5 ? 'Bought' : 'Sold'} {(Math.random() * 0.01).toFixed(4)} ETH for {(Math.random() * 20).toFixed(2)} USDC
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700/30 rounded-lg text-center">
                  <p className="text-gray-400">No activity yet. Grant AI delegation to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 