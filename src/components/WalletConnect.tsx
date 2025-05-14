"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, LogOut, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isFlask, setIsFlask] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>("Unknown Network");

  // Network names for common chainIds
  const networkNames: Record<string, string> = {
    "0x1": "Ethereum Mainnet",
    "0x5": "Goerli Testnet",
    "0xaa36a7": "Sepolia Testnet",
    "0x13881": "Polygon Mumbai",
    "0x89": "Polygon",
    "0xa": "Optimism",
    "0xa4b1": "Arbitrum One",
  };

  const detectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      setIsMetaMaskInstalled(true);
      
      try {
        // Check for Flask
        const clientVersion = await window.ethereum.request({
          method: "web3_clientVersion",
        });
        
        const isFlaskDetected = (clientVersion as string)?.includes("flask");
        setIsFlask(isFlaskDetected);
        
        // Check network
        const chainId = await window.ethereum.request({ 
          method: "eth_chainId" 
        });
        
        setChainId(chainId as string);
        setNetworkName(networkNames[chainId as string] || "Unknown Network");
        
        // Check if already connected
        const accounts = await window.ethereum.request({ 
          method: "eth_accounts" 
        });
        
        if (accounts && accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);
        }
      } catch (error) {
        console.error("Error detecting MetaMask:", error);
      }
    }
  };

  useEffect(() => {
    detectMetaMask();

    // Listen for account changes
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);
        } else {
          setIsConnected(false);
          setAddress("");
        }
      });

      // Listen for chain changes
      window.ethereum.on("chainChanged", (chainId: string) => {
        setChainId(chainId);
        setNetworkName(networkNames[chainId] || "Unknown Network");
      });
    }

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        
        if (accounts && accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);
        }
      } else {
        window.open("https://metamask.io/flask/", "_blank");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress("");
    setIsDropdownOpen(false);
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia chainId
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Testnet",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const needsSepolia = chainId !== "0xaa36a7" && isConnected;

  return (
    <div className="relative">
      {!isConnected ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={connectWallet}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
        >
          <Wallet className="w-5 h-5" />
          <span>{!isMetaMaskInstalled 
            ? "Install MetaMask" 
            : !isFlask 
              ? "Get MetaMask Flask" 
              : "Connect Wallet"}
          </span>
        </motion.button>
      ) : (
        <div className="flex flex-col">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all duration-200"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm">{formatAddress(address)}</span>
              <span className="text-xs text-purple-400/70">{networkName}</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </motion.button>

          {needsSepolia && (
            <div className="mt-2">
              <Button 
                onClick={switchToSepolia}
                variant="outline"
                size="sm"
                className="text-xs w-full border-yellow-600/50 text-yellow-500 hover:bg-yellow-600/20"
              >
                Switch to Sepolia
              </Button>
            </div>
          )}

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-60 rounded-lg bg-purple-900/90 backdrop-blur-lg border border-purple-500/20 shadow-lg z-50"
              >
                <div className="p-3 space-y-2">
                  <a
                    href={`https://sepolia.etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-purple-500/20 rounded-md transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View on Etherscan</span>
                  </a>
                  <button
                    onClick={disconnectWallet}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-purple-500/20 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
} 