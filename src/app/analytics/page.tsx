"use client";
import React, { useState } from "react";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/Loader";
import { ArrowLeft, Calendar, TrendingDown, TrendingUp, AlertTriangle, BrainCircuit, Bot, History, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { detectMarketCondition } from "@/services/aiService";

const Analytics = () => {
  const router = useRouter();
  const { portfolio, aiRules, executedTrades, pendingTrades, isLoading } = usePortfolio();
  const [activeTab, setActiveTab] = useState<'ai' | 'history' | 'market'>('ai');

  if (isLoading) {
    return <Loader />;
  }

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">Data Not Found</h2>
            <p className="mb-4 text-gray-500">Unable to load analytics data.</p>
            <Button onClick={() => router.push("/")} variant="primary">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get market condition
  const marketCondition = detectMarketCondition(portfolio);
  
  // Calculate volatility
  const avgPriceChange = portfolio.assets.reduce(
    (sum, asset) => sum + Math.abs(asset.token.priceChange24h), 
    0
  ) / portfolio.assets.length;
  
  // Calculate success rate
  const successRate = executedTrades.length > 0 
    ? (executedTrades.filter(trade => trade.status === 'COMPLETED').length / executedTrades.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <div className="flex items-center mb-6">
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
              <h1 className="text-3xl font-bold mb-1">AI Analytics</h1>
              <p className="text-gray-300">Insights on your portfolio and AI performance</p>
            </div>
          </div>
          
          <div className="flex border-b border-gray-700 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'ai' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setActiveTab('ai')}
            >
              AI Insights
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'history' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setActiveTab('history')}
            >
              Trading History
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'market' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => setActiveTab('market')}
            >
              Market Analysis
            </button>
          </div>
        </header>
        
        {/* AI Insights */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gray-800 border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <BrainCircuit className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">AI Status</h3>
                  </div>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${aiRules.some(r => r.enabled) ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {aiRules.some(r => r.enabled) ? 'Active' : 'Inactive'}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    {aiRules.filter(r => r.enabled).length} of {aiRules.length} rules enabled
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Bot className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold">Success Rate</h3>
                  </div>
                  <p className="text-2xl font-bold">
                    {successRate.toFixed(1)}%
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    {executedTrades.filter(t => t.status === 'COMPLETED').length} successful trades of {executedTrades.length} total
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold">Last Rebalanced</h3>
                  </div>
                  <p className="text-xl font-bold">
                    {portfolio.lastRebalanced ? 
                      new Date(portfolio.lastRebalanced).toLocaleDateString() : 
                      'Never'}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    {portfolio.lastRebalanced ? 
                      `${Math.round((Date.now() - portfolio.lastRebalanced.getTime()) / (1000 * 60 * 60 * 24))} days ago` : 
                      'No rebalancing yet'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <h2 className="text-xl font-bold mb-4">AI Rules Performance</h2>
            
            <Card className="bg-gray-800 border-0 shadow-lg mb-6">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-4">Rule Name</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Priority</th>
                        <th className="text-left p-4">Trigger Condition</th>
                        <th className="text-left p-4">Last Triggered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiRules.map((rule) => (
                        <tr key={rule.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-4 font-medium">{rule.name}</td>
                          <td className="p-4">
                            <Badge variant={rule.enabled ? 'success' : 'secondary'}>
                              {rule.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                          </td>
                          <td className="p-4">{rule.priority}</td>
                          <td className="p-4 text-sm font-mono text-blue-300">{rule.condition}</td>
                          <td className="p-4 text-sm text-gray-400">
                            {rule.lastTriggered ? 
                              new Date(rule.lastTriggered).toLocaleString() : 
                              'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <h2 className="text-xl font-bold mb-4">Pending AI Actions</h2>
            
            {pendingTrades.length > 0 ? (
              <Card className="bg-gray-800 border-0 shadow-lg">
                <CardContent className="p-5">
                  <ul className="space-y-4">
                    {pendingTrades.map((trade, index) => (
                      <li key={index} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge 
                              variant={trade.type === 'BUY' ? 'success' : 'destructive'}
                              className="mb-2"
                            >
                              {trade.type}
                            </Badge>
                            <p className="text-sm mb-1">
                              {trade.type === 'BUY' ? 'Buy' : 'Sell'} {parseFloat(trade.amount).toFixed(4)} {trade.fromToken.symbol} 
                              {trade.type === 'BUY' ? ` for ${trade.toToken.symbol}` : ` to get ${trade.toToken.symbol}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              Generated at {trade.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-700/50 px-3 py-1 rounded-md">
                            <p className="text-xs text-gray-300">{trade.reason}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-400">No pending AI actions</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Trading History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Trade History</h2>
            
            {executedTrades.length > 0 ? (
              <Card className="bg-gray-800 border-0 shadow-lg mb-6">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-4">Date & Time</th>
                          <th className="text-left p-4">Type</th>
                          <th className="text-left p-4">Pair</th>
                          <th className="text-left p-4">Amount</th>
                          <th className="text-left p-4">Status</th>
                          <th className="text-left p-4">Tx Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executedTrades.map((trade, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="p-4 text-sm">
                              {trade.timestamp.toLocaleString()}
                            </td>
                            <td className="p-4">
                              <Badge variant={trade.type === 'BUY' ? 'success' : 'destructive'}>
                                {trade.type}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <div className="flex -space-x-2">
                                  {trade.fromToken.logoUrl && (
                                    <img 
                                      src={trade.fromToken.logoUrl} 
                                      alt={trade.fromToken.symbol} 
                                      className="w-5 h-5 rounded-full ring-2 ring-gray-800"
                                    />
                                  )}
                                  {trade.toToken.logoUrl && (
                                    <img 
                                      src={trade.toToken.logoUrl} 
                                      alt={trade.toToken.symbol} 
                                      className="w-5 h-5 rounded-full ring-2 ring-gray-800"
                                    />
                                  )}
                                </div>
                                <span>{trade.fromToken.symbol}/{trade.toToken.symbol}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              {parseFloat(trade.amount).toFixed(4)} {trade.fromToken.symbol}
                            </td>
                            <td className="p-4">
                              <Badge 
                                variant={trade.status === 'COMPLETED' ? 'success' : 
                                        trade.status === 'FAILED' ? 'destructive' : 'warning'}
                              >
                                {trade.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {trade.txHash ? (
                                <a 
                                  href={`https://sepolia.etherscan.io/tx/${trade.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                                >
                                  <span className="text-xs truncate max-w-20">
                                    {`${trade.txHash.substring(0, 6)}...${trade.txHash.substring(trade.txHash.length - 4)}`}
                                  </span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-xs text-gray-500">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No trading history found</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Market Analysis */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-gray-800 border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${marketCondition === 'BULL' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                      {marketCondition === 'BULL' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">Market Condition</h3>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-2xl font-bold">
                      {marketCondition === 'BULL' ? 'Bullish' : 'Bearish'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Based on 24h price action across your portfolio
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">Market Volatility</h3>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-2xl font-bold">
                      {avgPriceChange < 3 ? 'Low' : avgPriceChange < 7 ? 'Medium' : 'High'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-gray-700 rounded-full h-2 flex-1">
                        <div 
                          className={`h-full rounded-full ${
                            avgPriceChange < 3 ? 'bg-green-500' : 
                            avgPriceChange < 7 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(avgPriceChange * 10, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{avgPriceChange.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <h2 className="text-xl font-bold mb-4">Asset Performance</h2>
            
            <Card className="bg-gray-800 border-0 shadow-lg mb-6">
              <CardContent className="p-5">
                <div className="space-y-6">
                  {portfolio.assets.map((asset) => (
                    <div key={asset.token.symbol} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {asset.token.logoUrl && (
                            <img 
                              src={asset.token.logoUrl} 
                              alt={asset.token.symbol} 
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold">{asset.token.symbol}</h3>
                            <p className="text-sm text-gray-400">{asset.token.name}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">${asset.token.price.toLocaleString()}</p>
                          <div className="flex items-center gap-1 justify-end">
                            {asset.token.priceChange24h > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                            <span 
                              className={
                                asset.token.priceChange24h > 0 ? "text-green-400" : 
                                "text-red-400"
                              }
                            >
                              {asset.token.priceChange24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-700/30 p-3 rounded">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Current Allocation</p>
                            <p className="text-sm">{asset.allocation.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Target Allocation</p>
                            <p className="text-sm">{asset.targetAllocation.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Balance</p>
                            <p className="text-sm">{asset.token.balance} {asset.token.symbol}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Value</p>
                            <p className="text-sm">${asset.token.balanceUsd.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">AI Analysis</p>
                          <p className="text-sm text-gray-300">
                            {asset.token.priceChange24h > 5 ? (
                              "Strong momentum, consider taking profits"
                            ) : asset.token.priceChange24h > 0 ? (
                              "Positive trend, maintain allocation"
                            ) : asset.token.priceChange24h > -5 ? (
                              "Slight decline, monitor closely"
                            ) : (
                              "Significant drop, potential buying opportunity"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics; 