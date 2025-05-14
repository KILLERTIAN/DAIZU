import { AIRule, MarketCondition, Portfolio, Token, TradeAction } from "@/models/portfolio";

// Mock tokens for demo
export const mockTokens: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    balance: "1.5",
    balanceUsd: 4500,
    price: 3000,
    priceChange24h: -2.5
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
    logoUrl: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png",
    balance: "0.12",
    balanceUsd: 4800,
    price: 40000,
    priceChange24h: 1.2
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    balance: "5000",
    balanceUsd: 5000,
    price: 1,
    priceChange24h: 0.01
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/chainlink-link-logo.png",
    balance: "150",
    balanceUsd: 1500,
    price: 10,
    priceChange24h: 5.3
  }
];

// Sample AI rules
export const defaultAIRules: AIRule[] = [
  {
    id: "rule-1",
    name: "ETH Price Drop Protection",
    description: "If ETH drops by more than 5% in 24h, swap 10% of USDC to ETH",
    condition: "ETH.priceChange24h < -5",
    action: "BUY ETH with 10% of USDC",
    enabled: true,
    priority: 3
  },
  {
    id: "rule-2",
    name: "BTC Rally Participation",
    description: "If BTC increases by more than 5% in 24h, swap 5% of USDC to WBTC",
    condition: "WBTC.priceChange24h > 5",
    action: "BUY WBTC with 5% of USDC",
    enabled: true,
    priority: 2
  },
  {
    id: "rule-3",
    name: "Stablecoin Rebalance",
    description: "If stablecoins fall below 20% of portfolio, sell some assets to rebalance",
    condition: "USDC.allocation < 20",
    action: "SELL assets to increase USDC to 20%",
    enabled: true,
    priority: 4
  },
  {
    id: "rule-4",
    name: "High Volatility Protection",
    description: "In high market volatility, increase stablecoin allocation",
    condition: "market.volatility > 70",
    action: "SELL 5% of volatile assets to USDC",
    enabled: true,
    priority: 5
  }
];

// Simulate market condition detection
export function detectMarketCondition(portfolio: Portfolio): MarketCondition {
  // Check if more than 50% of assets have negative price change
  const negativeAssets = portfolio.assets.filter(
    asset => asset.token.priceChange24h < 0
  );
  
  // More sophisticated logic would consider trend analysis, volatility, etc.
  if (negativeAssets.length > portfolio.assets.length / 2) {
    return "BEAR";
  } else {
    return "BULL";
  }
}

// Check if a rule should be triggered based on portfolio state
export function evaluateRule(rule: AIRule, portfolio: Portfolio): boolean {
  // In a real implementation, this would parse and evaluate the condition expression
  // For the demo, we'll use simplified logic
  
  switch (rule.id) {
    case "rule-1": 
      const eth = portfolio.assets.find(asset => asset.token.symbol === "ETH");
      return eth?.token.priceChange24h! < -5;
    
    case "rule-2":
      const btc = portfolio.assets.find(asset => asset.token.symbol === "WBTC");
      return btc?.token.priceChange24h! > 5;
    
    case "rule-3": 
      const usdc = portfolio.assets.find(asset => asset.token.symbol === "USDC");
      return usdc?.allocation! < 20;
    
    case "rule-4":
      // For demo purposes, assume market volatility is based on average price change
      const avgChange = portfolio.assets.reduce(
        (sum, asset) => sum + Math.abs(asset.token.priceChange24h), 
        0
      ) / portfolio.assets.length;
      return avgChange > 5; // Using 5 as a volatility threshold for the demo
    
    default:
      return false;
  }
}

// Generate trade action based on a triggered rule
export function generateTradeAction(rule: AIRule, portfolio: Portfolio): TradeAction | null {
  // Find the tokens involved
  const usdc = portfolio.assets.find(asset => asset.token.symbol === "USDC");
  
  if (!usdc) return null;
  
  switch (rule.id) {
    case "rule-1": {
      const eth = portfolio.assets.find(asset => asset.token.symbol === "ETH");
      if (!eth) return null;
      
      const amount = (parseFloat(usdc.token.balance) * 0.1).toString(); // 10% of USDC
      
      return {
        type: 'BUY',
        fromToken: usdc.token,
        toToken: eth.token,
        amount,
        timestamp: new Date(),
        status: 'PENDING',
        reason: `ETH price dropped by ${eth.token.priceChange24h.toFixed(2)}%. Buying ETH with 10% of USDC.`
      };
    }
    
    case "rule-2": {
      const wbtc = portfolio.assets.find(asset => asset.token.symbol === "WBTC");
      if (!wbtc) return null;
      
      const amount = (parseFloat(usdc.token.balance) * 0.05).toString(); // 5% of USDC
      
      return {
        type: 'BUY',
        fromToken: usdc.token,
        toToken: wbtc.token,
        amount,
        timestamp: new Date(),
        status: 'PENDING',
        reason: `WBTC price increased by ${wbtc.token.priceChange24h.toFixed(2)}%. Buying WBTC with 5% of USDC.`
      };
    }
    
    case "rule-3": {
      // Finding the highest value asset that isn't USDC
      const highestValueAsset = portfolio.assets
        .filter(asset => asset.token.symbol !== "USDC")
        .sort((a, b) => b.token.balanceUsd - a.token.balanceUsd)[0];
      
      if (!highestValueAsset) return null;
      
      // Calculate how much to sell to reach 20% USDC allocation
      const currentUsdcPercentage = (usdc.token.balanceUsd / portfolio.totalValue) * 100;
      const targetUsdcPercentage = 20;
      const percentageToAdd = targetUsdcPercentage - currentUsdcPercentage;
      const usdAmountToSell = (portfolio.totalValue * (percentageToAdd / 100));
      
      // Convert to token amount
      const tokenAmountToSell = (usdAmountToSell / highestValueAsset.token.price).toFixed(6);
      
      return {
        type: 'SELL',
        fromToken: highestValueAsset.token,
        toToken: usdc.token,
        amount: tokenAmountToSell,
        timestamp: new Date(),
        status: 'PENDING',
        reason: `USDC allocation below 20% (${currentUsdcPercentage.toFixed(2)}%). Selling ${highestValueAsset.token.symbol} to rebalance.`
      };
    }
    
    case "rule-4": {
      // Find most volatile asset
      const mostVolatileAsset = portfolio.assets
        .filter(asset => asset.token.symbol !== "USDC")
        .sort((a, b) => Math.abs(b.token.priceChange24h) - Math.abs(a.token.priceChange24h))[0];
      
      if (!mostVolatileAsset) return null;
      
      // Calculate 5% of the asset's balance
      const tokenAmountToSell = (parseFloat(mostVolatileAsset.token.balance) * 0.05).toFixed(6);
      
      return {
        type: 'SELL',
        fromToken: mostVolatileAsset.token,
        toToken: usdc.token,
        amount: tokenAmountToSell,
        timestamp: new Date(),
        status: 'PENDING',
        reason: `High market volatility detected. Selling 5% of ${mostVolatileAsset.token.symbol} to increase stablecoin allocation.`
      };
    }
    
    default:
      return null;
  }
}

// Create a mock portfolio for demo purposes
export function createMockPortfolio(): Portfolio {
  const assets = mockTokens.map(token => {
    return {
      token,
      allocation: (token.balanceUsd / 15800) * 100, // 15800 is total of all balanceUsd values
      targetAllocation: (token.balanceUsd / 15800) * 100, // Initially matches current allocation
      lastUpdated: new Date()
    };
  });

  // Create mock performance history
  const now = new Date();
  const performanceHistory = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(now.getDate() - (29 - i));
    
    // Generate some variation in the portfolio value
    const dailyChange = (Math.random() * 4) - 2; // -2% to +2%
    const value = 15800 * (1 + (dailyChange / 100) * i);
    
    return {
      timestamp: date,
      value
    };
  });

  return {
    totalValue: 15800,
    assets,
    performanceHistory,
    riskScore: 6, // Medium-high risk score
    lastRebalanced: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
  };
}

// Simulate market crash for demo
export function simulateMarketCrash(portfolio: Portfolio): Portfolio {
  const updatedAssets = portfolio.assets.map(asset => {
    // Reduce price of non-stablecoins by 10-20%
    if (asset.token.symbol !== "USDC") {
      const priceDropPercent = -(10 + Math.random() * 10); // -10% to -20%
      const newPrice = asset.token.price * (1 + priceDropPercent / 100);
      const newBalanceUsd = parseFloat(asset.token.balance) * newPrice;
      
      return {
        ...asset,
        token: {
          ...asset.token,
          price: newPrice,
          balanceUsd: newBalanceUsd,
          priceChange24h: priceDropPercent
        }
      };
    }
    return asset;
  });
  
  // Calculate new total value
  const newTotalValue = updatedAssets.reduce(
    (sum, asset) => sum + asset.token.balanceUsd, 
    0
  );
  
  // Update allocations
  const finalAssets = updatedAssets.map(asset => ({
    ...asset,
    allocation: (asset.token.balanceUsd / newTotalValue) * 100,
    lastUpdated: new Date()
  }));
  
  // Add a new performance point for the crash
  const newPerformancePoint = {
    timestamp: new Date(),
    value: newTotalValue
  };
  
  return {
    ...portfolio,
    totalValue: newTotalValue,
    assets: finalAssets,
    performanceHistory: [...portfolio.performanceHistory, newPerformancePoint],
    lastRebalanced: portfolio.lastRebalanced
  };
}

// Simulate trade execution (should use ERC7715 delegation in production)
export function simulateTradeExecution(trade: TradeAction, portfolio: Portfolio): Portfolio {
  // Clone assets to avoid modifying the original
  const assets = [...portfolio.assets];
  
  // Find the from and to assets
  const fromAssetIndex = assets.findIndex(
    asset => asset.token.address === trade.fromToken.address
  );
  
  const toAssetIndex = assets.findIndex(
    asset => asset.token.address === trade.toToken.address
  );
  
  if (fromAssetIndex === -1 || toAssetIndex === -1) {
    return portfolio;
  }
  
  // Calculate new balances
  const tradeAmount = parseFloat(trade.amount);
  const fromTokenBalance = parseFloat(assets[fromAssetIndex].token.balance);
  const toTokenBalance = parseFloat(assets[toAssetIndex].token.balance);
  
  // Simple conversion rate based on current prices
  const conversionRate = 
    assets[fromAssetIndex].token.price / assets[toAssetIndex].token.price;
  
  const toTokenAmount = tradeAmount * conversionRate;
  
  // Update balances
  assets[fromAssetIndex].token.balance = (fromTokenBalance - tradeAmount).toString();
  assets[fromAssetIndex].token.balanceUsd = 
    parseFloat(assets[fromAssetIndex].token.balance) * assets[fromAssetIndex].token.price;
  
  assets[toAssetIndex].token.balance = (toTokenBalance + toTokenAmount).toString();
  assets[toAssetIndex].token.balanceUsd = 
    parseFloat(assets[toAssetIndex].token.balance) * assets[toAssetIndex].token.price;
  
  // Recalculate portfolio total value and allocations
  const newTotalValue = assets.reduce(
    (sum, asset) => sum + asset.token.balanceUsd, 
    0
  );
  
  // Update allocations
  assets.forEach(asset => {
    asset.allocation = (asset.token.balanceUsd / newTotalValue) * 100;
    asset.lastUpdated = new Date();
  });
  
  return {
    ...portfolio,
    totalValue: newTotalValue,
    assets,
    lastRebalanced: new Date()
  };
} 