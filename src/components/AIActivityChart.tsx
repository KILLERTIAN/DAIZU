"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from '@/providers/PermissionProvider';
import CryptoIcon from './CryptoIcon';
import axios from 'axios';

interface DelegationActivity {
  timestamp: number;
  action: string;
  token: string;
  amount: string;
  status: 'pending' | 'complete' | 'failed';
}

interface CoinPriceData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface AIActivityProps {
  isDelegationActive: boolean;
  className?: string;
}

export const AIActivityChart: React.FC<AIActivityProps> = ({ 
  isDelegationActive,
  className = ''
}) => {
  const { permission } = usePermissions();
  const [activities, setActivities] = useState<DelegationActivity[]>([]);
  const [currentAllocation, setCurrentAllocation] = useState<Record<string, number>>({
    ETH: 30,
    WETH: 15,
    USDC: 25,
    DAI: 10,
    AAVE: 5,
    LINK: 5,
    UNI: 10
  });
  const [targetAllocation, setTargetAllocation] = useState<Record<string, number>>({
    ETH: 30,
    WETH: 15,
    USDC: 25,
    DAI: 10,
    AAVE: 5,
    LINK: 5,
    UNI: 10
  });
  const [isLoadingPriceData, setIsLoadingPriceData] = useState(false);
  const [priceData, setPriceData] = useState<Record<string, number>>({});

  // Fetch price data from CoinGecko API when delegation is active
  useEffect(() => {
    const fetchPriceData = async () => {
      if (!isDelegationActive) return;
      
      setIsLoadingPriceData(true);
      
      try {
        // Get price data for major cryptocurrencies from CoinGecko
        const coinIds = ['ethereum', 'wrapped-ethereum', 'usd-coin', 'dai', 'aave', 'chainlink', 'uniswap'];
        const symbols = ['ETH', 'WETH', 'USDC', 'DAI', 'AAVE', 'LINK', 'UNI'];
        
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
        );
        
        const prices: Record<string, number> = {};
        const changes: Record<string, number> = {};
        
        // Map the response to our format
        coinIds.forEach((id, index) => {
          if (response.data[id]) {
            prices[symbols[index]] = response.data[id].usd;
            changes[symbols[index]] = response.data[id].usd_24h_change || 0;
          }
        });
        
        setPriceData(prices);
        
        // Update target allocation based on price changes
        // This simulates AI making decisions based on price movements
        const newTargetAllocation = { ...targetAllocation };
        
        Object.entries(changes).forEach(([symbol, change]) => {
          if (Math.abs(change) > 5) {
            // For tokens with significant price changes, adjust allocation
            if (change > 0) {
              // Increase allocation for tokens with positive changes
              newTargetAllocation[symbol] = Math.min(
                newTargetAllocation[symbol] + (change / 10), 
                newTargetAllocation[symbol] * 1.5
              );
            } else {
              // Decrease allocation for tokens with negative changes
              newTargetAllocation[symbol] = Math.max(
                newTargetAllocation[symbol] - (Math.abs(change) / 10), 
                newTargetAllocation[symbol] * 0.5
              );
            }
          }
        });
        
        // Normalize to 100%
        const total = Object.values(newTargetAllocation).reduce((sum, val) => sum + val, 0);
        Object.keys(newTargetAllocation).forEach(key => {
          newTargetAllocation[key] = (newTargetAllocation[key] / total) * 100;
        });
        
        setTargetAllocation(newTargetAllocation);
        
      } catch (error) {
        console.error('Error fetching price data:', error);
      } finally {
        setIsLoadingPriceData(false);
      }
    };
    
    fetchPriceData();
    
    // Set up interval to fetch data every 2 minutes
    const interval = setInterval(fetchPriceData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isDelegationActive]);

  // Get historical price data for a specific coin and generate activity
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!isDelegationActive) return;
      
      try {
        // Get historical data for Ethereum
        const response = await axios.get<CoinPriceData>(
          'https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=1'
        );
        
        const prices = response.data.prices;
        
        // Use the price changes to generate trading activities
        // Find significant price changes
        const significantChanges: { timestamp: number, price: number, change: number }[] = [];
        
        for (let i = 10; i < prices.length; i += 10) {
          const currentPrice = prices[i][1];
          const previousPrice = prices[i - 10][1];
          const change = ((currentPrice - previousPrice) / previousPrice) * 100;
          
          if (Math.abs(change) > 0.5) {
            significantChanges.push({
              timestamp: prices[i][0],
              price: currentPrice,
              change
            });
          }
        }
        
        // Generate activities based on significant changes
        const newActivities: DelegationActivity[] = significantChanges.map(change => {
          // Choose tokens based on whether the price increased or decreased
          const isBuy = change.change > 0;
          const fromToken = isBuy ? 'USDC' : 'ETH';
          const toToken = isBuy ? 'ETH' : 'USDC';
          
          return {
            timestamp: change.timestamp,
            action: 'SWAP',
            token: `${fromToken} → ${toToken}`,
            amount: isBuy ? (Math.abs(change.change) / 100).toFixed(4) : (0.01 * Math.abs(change.change)).toFixed(4),
            status: 'complete'
          };
        });
        
        // Add some DAI/LINK/etc transactions for variety
        const otherTokenPairs = [
          'DAI → LINK',
          'LINK → AAVE',
          'AAVE → UNI',
          'WETH → DAI'
        ];
        
        for (let i = 0; i < 3; i++) {
          const randomPair = otherTokenPairs[Math.floor(Math.random() * otherTokenPairs.length)];
          const randomTimestamp = Date.now() - Math.floor(Math.random() * 3600000); // Last hour
          
          newActivities.push({
            timestamp: randomTimestamp,
            action: 'SWAP',
            token: randomPair,
            amount: (Math.random() * 0.2).toFixed(4),
            status: 'complete'
          });
        }
        
        // Sort by timestamp (newest first)
        newActivities.sort((a, b) => b.timestamp - a.timestamp);
        
        setActivities(newActivities.slice(0, 10));
        
      } catch (error) {
        console.error('Error fetching historical price data:', error);
      }
    };
    
    fetchHistoricalData();
    
    // Generate new activities every 30 seconds if delegation is active
    const interval = setInterval(() => {
      if (isDelegationActive) {
        const tokens = ['ETH', 'USDC', 'DAI', 'WETH', 'AAVE', 'LINK', 'UNI'];
        const randomToken1 = tokens[Math.floor(Math.random() * tokens.length)];
        let randomToken2;
        do {
          randomToken2 = tokens[Math.floor(Math.random() * tokens.length)];
        } while (randomToken1 === randomToken2);
        
        const randomAmount = (Math.random() * 0.5).toFixed(4);
        
        const newActivity: DelegationActivity = {
          timestamp: Date.now(),
          action: 'SWAP',
          token: `${randomToken1} → ${randomToken2}`,
          amount: randomAmount,
          status: 'pending'
        };
        
        setActivities(prevActivities => [newActivity, ...prevActivities.slice(0, 9)]);
        
        // After 2 seconds, mark as complete
        setTimeout(() => {
          setActivities(prevActivities => 
            prevActivities.map(activity => 
              activity.timestamp === newActivity.timestamp
                ? { ...activity, status: 'complete' }
                : activity
            )
          );
          
          // Adjust current allocation
          setCurrentAllocation(prev => {
            const newAllocation = { ...prev };
            const amount = parseFloat(randomAmount) * 2; // Scaling factor
            
            if (randomToken1 in newAllocation) {
              newAllocation[randomToken1] = Math.max(0, newAllocation[randomToken1] - amount);
            }
            
            if (randomToken2 in newAllocation) {
              newAllocation[randomToken2] = newAllocation[randomToken2] + amount;
            }
            
            // Normalize to 100%
            const total = Object.values(newAllocation).reduce((sum, val) => sum + val, 0);
            Object.keys(newAllocation).forEach(key => {
              newAllocation[key] = (newAllocation[key] / total) * 100;
            });
            
            return newAllocation;
          });
        }, 2000);
      }
    }, 30000); // New activity every 30 seconds
    
    return () => clearInterval(interval);
  }, [isDelegationActive]);
  
  // Format time relative to now
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Calculate allocation changes
  const calculateChanges = () => {
    const changes: Record<string, { value: number, direction: 'up' | 'down' | 'same' }> = {};
    
    Object.keys(targetAllocation).forEach(token => {
      const current = currentAllocation[token] || 0;
      const target = targetAllocation[token] || 0;
      const diff = target - current;
      
      changes[token] = {
        value: Math.abs(diff),
        direction: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'same'
      };
    });
    
    return changes;
  };

  const allocationChanges = calculateChanges();

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      <Card className="bg-gray-800 border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">AI Trading Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!isDelegationActive ? (
            <div className="flex flex-col items-center justify-center h-52 text-center text-gray-400">
              <p>AI delegation is not active</p>
              <p className="text-sm mt-2">Enable AI delegation to see live trading activity</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400">
              <p>No trading activity yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {activities.map((activity, index) => (
                <div 
                  key={`${activity.timestamp}-${index}`}
                  className={`flex items-center justify-between p-3 rounded-lg bg-gray-700/50 ${activity.status === 'pending' ? 'animate-pulse' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {activity.token.split(' → ').map((token, i) => (
                        <div 
                          key={i}
                          className="rounded-full bg-gray-600 p-1"
                          style={{
                            position: 'relative',
                            left: i * 16,
                            zIndex: i
                          }}
                        >
                          <CryptoIcon symbol={token} size={20} />
                        </div>
                      ))}
                    </div>
                    
                    <div className="ml-6">
                      <div className="font-medium">{activity.token}</div>
                      <div className="text-xs text-gray-400">{formatTime(activity.timestamp)}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{activity.amount}</div>
                    <div className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Target Allocation Changes</CardTitle>
        </CardHeader>
        <CardContent>
          {!isDelegationActive ? (
            <div className="flex flex-col items-center justify-center h-52 text-center text-gray-400">
              <p>AI delegation is not active</p>
              <p className="text-sm mt-2">Enable AI delegation to see allocation changes</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {Object.entries(targetAllocation)
                .sort((a, b) => b[1] - a[1]) // Sort by allocation percentage (descending)
                .map(([token, percentage]) => {
                  const change = allocationChanges[token];
                  const currentPrice = priceData[token];
                  
                  return (
                    <div key={token} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50">
                      <div className="flex items-center space-x-3">
                        <CryptoIcon symbol={token} size={24} />
                        <div>
                          <div className="font-medium">{token}</div>
                          <div className="text-xs text-gray-400">
                            Target: {percentage.toFixed(1)}%
                            {currentPrice && (
                              <span className="ml-2 text-blue-300">${currentPrice.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium">{currentAllocation[token]?.toFixed(1)}%</div>
                        {change && change.value > 0.5 && (
                          <div className={`text-xs flex items-center ${
                            change.direction === 'up' ? 'text-green-400' : 
                            change.direction === 'down' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {change.direction === 'up' ? '↑' : 
                             change.direction === 'down' ? '↓' : '~'}
                            {change.value.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIActivityChart; 