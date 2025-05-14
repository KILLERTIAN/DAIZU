export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUrl?: string;
  balance: string;
  balanceUsd: number;
  price: number;
  priceChange24h: number;
}

export interface PortfolioAsset {
  token: Token;
  allocation: number; // percentage of portfolio
  targetAllocation: number; // target percentage set by AI
  lastUpdated: Date;
}

export interface Portfolio {
  totalValue: number; // in USD
  assets: PortfolioAsset[];
  performanceHistory: PerformancePoint[];
  riskScore: number; // 1-10
  lastRebalanced?: Date;
}

export interface PerformancePoint {
  timestamp: Date;
  value: number; // portfolio value at that time
}

export interface TradeAction {
  type: 'BUY' | 'SELL';
  fromToken: Token;
  toToken: Token;
  amount: string;
  timestamp: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  reason: string; // AI reasoning for trade
  txHash?: string;
}

export interface AIRule {
  id: string;
  name: string;
  description: string;
  condition: string; // e.g., "ETH price drops 5%"
  action: string; // e.g., "Swap 10% of USDC to ETH"
  enabled: boolean;
  lastTriggered?: Date;
  priority: number; // higher number = higher priority
}

export interface RebalanceSettings {
  enabled: boolean;
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'THRESHOLD';
  maxSlippagePercent: number;
  riskTolerance: number; // 1-10
  gasLimit?: string;
  maxSingleTradePercentage: number; // 0-100
  maxDailyTradeVolume: number; // in USD
}

export type MarketCondition = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN';

export interface MarketStatus {
  condition: MarketCondition;
  volatility: number; // 0-100
  confidence: number; // 0-100
  lastUpdated: Date;
}

export interface DelegationStatus {
  active: boolean;
  expires?: Date;
  permissionType: string;
  maxAmountPerDay: string;
  remainingAmountToday: string;
} 