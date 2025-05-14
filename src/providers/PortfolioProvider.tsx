import React, { createContext, useContext, useEffect, useState } from "react";
import { AIRule, Portfolio, TradeAction } from "@/models/portfolio";
import { createMockPortfolio, defaultAIRules, evaluateRule, generateTradeAction, simulateMarketCrash, simulateTradeExecution } from "@/services/aiService";
import { usePermissions } from "./PermissionProvider";

interface PortfolioContextType {
  portfolio: Portfolio | null;
  aiRules: AIRule[];
  pendingTrades: TradeAction[];
  executedTrades: TradeAction[];
  isLoading: boolean;
  isDelegationActive: boolean;
  toggleRuleStatus: (ruleId: string) => void;
  executeTradeAction: (trade: TradeAction) => Promise<void>;
  testRule: (rule: AIRule) => Promise<void>;
  simulateCrash: () => void;
  rebalancePortfolio: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType>({
  portfolio: null,
  aiRules: [],
  pendingTrades: [],
  executedTrades: [],
  isLoading: true,
  isDelegationActive: false,
  toggleRuleStatus: () => {},
  executeTradeAction: async () => {},
  testRule: async () => {},
  simulateCrash: () => {},
  rebalancePortfolio: async () => {},
});

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [aiRules, setAiRules] = useState<AIRule[]>([...defaultAIRules]);
  const [pendingTrades, setPendingTrades] = useState<TradeAction[]>([]);
  const [executedTrades, setExecutedTrades] = useState<TradeAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { permission } = usePermissions();

  // Initialize with mock data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // In a real app, fetch portfolio data from an API
        const mockPortfolio = createMockPortfolio();
        setPortfolio(mockPortfolio);
      } catch (error) {
        console.error("Error initializing portfolio data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Check if delegation is active
  const isDelegationActive = !!permission;

  // Toggle rule enabled/disabled status
  const toggleRuleStatus = (ruleId: string) => {
    setAiRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  // Execute a trade action (would use ERC-7715 in production)
  const executeTradeAction = async (trade: TradeAction) => {
    if (!portfolio) return;

    try {
      // Update trade status
      const updatedTrade = { ...trade, status: 'COMPLETED' as const, txHash: `0x${Math.random().toString(16).substring(2,42)}` };
      
      // Update portfolio state
      const updatedPortfolio = simulateTradeExecution(trade, portfolio);
      setPortfolio(updatedPortfolio);
      
      // Move from pending to executed
      setPendingTrades(prev => prev.filter(t => t !== trade));
      setExecutedTrades(prev => [...prev, updatedTrade]);
    } catch (error) {
      console.error("Error executing trade:", error);
      
      // Update trade status to failed
      const failedTrade = { 
        ...trade, 
        status: 'FAILED' as const, 
        reason: `Failed: ${trade.reason}` 
      };
      
      setPendingTrades(prev => 
        prev.map(t => t === trade ? failedTrade : t)
      );
    }
  };

  // Test a specific rule to see if it would trigger
  const testRule = async (rule: AIRule) => {
    if (!portfolio) return;
    
    // Check if rule conditions are met
    const shouldExecute = evaluateRule(rule, portfolio);
    
    if (shouldExecute) {
      // Generate a trade action
      const tradeAction = generateTradeAction(rule, portfolio);
      
      if (tradeAction) {
        setPendingTrades(prev => [...prev, tradeAction]);
      }
    }
  };

  // Simulate a market crash
  const simulateCrash = () => {
    if (!portfolio) return;
    
    const crashedPortfolio = simulateMarketCrash(portfolio);
    setPortfolio(crashedPortfolio);
    
    // Check all enabled rules to see if any should trigger
    aiRules
      .filter(rule => rule.enabled)
      .forEach(rule => {
        const shouldExecute = evaluateRule(rule, crashedPortfolio);
        
        if (shouldExecute) {
          const tradeAction = generateTradeAction(rule, crashedPortfolio);
          if (tradeAction) {
            setPendingTrades(prev => [...prev, tradeAction]);
          }
        }
      });
  };

  // Rebalance portfolio by executing all pending trades
  const rebalancePortfolio = async () => {
    if (pendingTrades.length === 0) return;
    
    // Execute all pending trades in sequence
    for (const trade of pendingTrades) {
      await executeTradeAction(trade);
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        aiRules,
        pendingTrades,
        executedTrades,
        isLoading,
        isDelegationActive,
        toggleRuleStatus,
        executeTradeAction,
        testRule,
        simulateCrash,
        rebalancePortfolio,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext); 