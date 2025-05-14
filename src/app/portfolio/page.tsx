"use client";
import React, { useState } from "react";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Loader from "@/components/Loader";
import { ArrowLeft, Settings, TrendingDown, TrendingUp, AlertTriangle, Scale, ArrowRightLeft, Minus, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/providers/PermissionProvider";
import CryptoIcon from "@/components/CryptoIcon";
import AIActivityChart from "@/components/AIActivityChart";
import { useWallet } from "@/providers/WalletProvider";
import AIPortfolioManager from "@/components/AIPortfolioManager";

const Portfolio = () => {
  const router = useRouter();
  const { 
    portfolio, 
    aiRules, 
    isLoading, 
    pendingTrades, 
    executedTrades,
    isDelegationActive,
    executeTradeAction,
    testRule,
    rebalancePortfolio
  } = usePortfolio();
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const { permission } = usePermissions();

  if (isLoading) {
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
            <Button onClick={() => router.push("/")} variant="default">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTestRule = async (ruleId: string) => {
    setSelectedRule(ruleId);
    setIsTesting(true);
    
    const rule = aiRules.find(r => r.id === ruleId);
    if (rule) {
      await testRule(rule);
    }
    
    setIsTesting(false);
    setTimeout(() => setSelectedRule(null), 1000);
  };

  const handleExecuteTrade = async (index: number) => {
    const trade = pendingTrades[index];
    if (trade) {
      await executeTradeAction(trade);
    }
  };

  const handleRebalance = async () => {
    setIsRebalancing(true);
    await rebalancePortfolio();
    setIsRebalancing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="ghost"
                size="sm"
                className="mr-2"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold mb-1">Portfolio Management</h1>
                <p className="text-gray-300">Configure your assets and AI rules</p>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button
                onClick={handleRebalance}
                variant="default"
                isLoading={isRebalancing}
                loadingText="Rebalancing..."
                disabled={pendingTrades.length === 0}
                icon={<ArrowRightLeft className="w-4 h-4" />}
              >
                Execute All Pending Trades
              </Button>
            </div>
          </div>
        </header>
        
        {/* Portfolio Assets */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Asset Allocation</h2>
          
          <Card className="bg-gray-800 border-0 shadow-lg mb-6">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-4">Asset</th>
                      <th className="text-left p-4">Balance</th>
                      <th className="text-left p-4">Value</th>
                      <th className="text-left p-4">Price</th>
                      <th className="text-left p-4">24h Change</th>
                      <th className="text-left p-4">Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.assets.map((asset) => (
                      <tr key={asset.token.symbol} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <CryptoIcon symbol={asset.token.symbol} size={32} />
                            <div>
                              <div className="font-semibold">{asset.token.symbol}</div>
                              <div className="text-xs text-gray-400">{asset.token.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{asset.token.balance}</td>
                        <td className="p-4">${asset.token.balanceUsd.toLocaleString()}</td>
                        <td className="p-4">${asset.token.price.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {asset.token.priceChange24h > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : asset.token.priceChange24h < 0 ? (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            ) : (
                              <Minus className="w-4 h-4 text-gray-400" />
                            )}
                            <span 
                              className={
                                asset.token.priceChange24h > 0 ? "text-green-400" : 
                                asset.token.priceChange24h < 0 ? "text-red-400" : "text-gray-400"
                              }
                            >
                              {asset.token.priceChange24h.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{asset.allocation.toFixed(1)}%</span>
                              <span className="text-gray-400">Target: {asset.targetAllocation.toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={asset.allocation} 
                              max={100} 
                              variant={
                                Math.abs(asset.allocation - asset.targetAllocation) > 5 ? "warning" : "default"
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
        
        {/* AI Rules */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">AI Trading Rules</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {aiRules.map(rule => (
              <Card 
                key={rule.id} 
                className={`bg-gray-800 border-0 shadow-lg ${!rule.enabled ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold">{rule.name}</h3>
                    </div>
                    <Badge variant={rule.enabled ? 'success' : 'secondary'} size="sm">
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-4">{rule.description}</p>
                  
                  <div className="bg-gray-700/50 p-3 rounded mb-4">
                    <div className="text-xs text-gray-400 mb-1">If:</div>
                    <code className="text-sm text-blue-300">{rule.condition}</code>
                    <div className="text-xs text-gray-400 mb-1 mt-2">Then:</div>
                    <code className="text-sm text-green-300">{rule.action}</code>
                  </div>
                  
                  <div className="flex justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedRule(rule.id)}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      isLoading={isTesting && selectedRule === rule.id}
                      loadingText="Testing..."
                      onClick={() => handleTestRule(rule.id)}
                    >
                      Test Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
        {/* AI Activity Chart */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">AI Delegation Activity</h2>
          <AIActivityChart isDelegationActive={isDelegationActive || !!permission} />
        </section>
        
        {/* AI Portfolio Manager Integration */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">AI Portfolio Manager</h2>
            <Button variant="outline" size="sm" icon={<Settings className="w-4 h-4" />}>
              Settings
            </Button>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AIPortfolioManager />
            
            <Card className="bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Delegation History</CardTitle>
              </CardHeader>
              <CardContent>
                {isDelegationActive ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-300">Active Delegation</p>
                        <p className="text-xs text-gray-300">
                          Your portfolio is being managed through ERC-7715 delegation
                        </p>
                      </div>
                    </div>
                    
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2">Date</th>
                          <th className="text-left py-2">Action</th>
                          <th className="text-left py-2">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executedTrades.map((trade, i) => (
                          <tr key={i} className="border-b border-gray-700">
                            <td className="py-2 text-gray-300">{new Date(trade.timestamp).toLocaleDateString()}</td>
                            <td className="py-2">{trade.type || 'TRADE'}</td>
                            <td className="py-2 text-gray-300">
                              {trade.amount} {trade.fromToken?.symbol || trade.toToken?.symbol || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No active delegation found</p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Enable the AI Portfolio Manager to start automated trading based on your rules and market conditions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Pending Trades */}
        {pendingTrades.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              Pending Trades
              <Badge variant="warning" size="sm" className="ml-2">{pendingTrades.length}</Badge>
            </h2>
            
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
                        <th className="text-right p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTrades.map((trade, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-4">
                            <Badge variant={trade.type === 'BUY' ? 'success' : 'destructive'}>
                              {trade.type}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {trade.fromToken.logoUrl && (
                                <img 
                                  src={trade.fromToken.logoUrl} 
                                  alt={trade.fromToken.symbol} 
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span>{trade.fromToken.symbol}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {trade.toToken.logoUrl && (
                                <img 
                                  src={trade.toToken.logoUrl} 
                                  alt={trade.toToken.symbol} 
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span>{trade.toToken.symbol}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {parseFloat(trade.amount).toFixed(4)} {trade.fromToken.symbol}
                          </td>
                          <td className="p-4 text-sm text-gray-300 max-w-xs truncate">
                            {trade.reason}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExecuteTrade(index)}
                            >
                              Execute
                            </Button>
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
        
        {/* Executed Trades */}
        {executedTrades.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              Recent Trades
              <Badge variant="secondary" size="sm" className="ml-2">{executedTrades.length}</Badge>
            </h2>
            
            <Card className="bg-gray-800 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Action</th>
                        <th className="text-left p-4">From</th>
                        <th className="text-left p-4">To</th>
                        <th className="text-left p-4">Amount</th>
                        <th className="text-left p-4">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executedTrades.slice(0, 5).map((trade, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-4">
                            <Badge 
                              variant={trade.status === 'COMPLETED' ? 'success' : 
                                      trade.status === 'FAILED' ? 'destructive' : 'warning'}
                            >
                              {trade.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={trade.type === 'BUY' ? 'success' : 'destructive'}>
                              {trade.type}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {trade.fromToken.logoUrl && (
                                <img 
                                  src={trade.fromToken.logoUrl} 
                                  alt={trade.fromToken.symbol} 
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span>{trade.fromToken.symbol}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {trade.toToken.logoUrl && (
                                <img 
                                  src={trade.toToken.logoUrl} 
                                  alt={trade.toToken.symbol} 
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span>{trade.toToken.symbol}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {parseFloat(trade.amount).toFixed(4)} {trade.fromToken.symbol}
                          </td>
                          <td className="p-4 text-sm text-gray-400">
                            {trade.timestamp.toLocaleString()}
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
      </div>
    </div>
  );
};

export default Portfolio; 