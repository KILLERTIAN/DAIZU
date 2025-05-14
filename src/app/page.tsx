"use client";
import { useEffect, useState } from "react";
import InstallFlask from "@/components/InstallFlask";
import WalletInfoContainer from "@/components/WalletInfoContainer";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import AIDelegationButton from "@/components/AIDelegationButton";
import { ChartBar, ArrowRight, Bot, Rocket, Shield, Lightbulb } from "lucide-react";
import { usePermissions } from "@/providers/PermissionProvider";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [isFlask, setIsFlask] = useState(false);
  const [isDetectingFlask, setIsDetectingFlask] = useState(true);
  const { isLoading: isPermissionLoading } = usePermissions();

  const detectFlask = async () => {
    if (window && window.ethereum) {
      const provider = window.ethereum;

      if (provider) {
        try {
          const clientVersion = await provider.request({
            method: "web3_clientVersion",
          });

          const isFlaskDetected = (clientVersion as string)?.includes("flask");
          setIsFlask(isFlaskDetected);
        } catch (error) {
          console.error("Error detecting Flask:", error);
          setIsFlask(false);
        }
      }
    }
    setIsDetectingFlask(false);
  };

  useEffect(() => {
    detectFlask();
  }, []);

  // Calculate the loading state based on both Flask detection and permission loading
  const isLoading = isDetectingFlask || isPermissionLoading;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950/30 to-gray-900 text-white">
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero section */}
        <motion.section 
          className="text-center mb-16 mt-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400"
            variants={itemVariants}
          >
            DeFi AI Portfolio Manager
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
            variants={itemVariants}
          >
            Your personal AI assistant for automated portfolio management using ERC-7715 delegations
          </motion.p>
          
          <motion.div variants={itemVariants}>
            {isLoading ? (
              <Loader />
            ) : isFlask ? (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  onClick={() => router.push("/dashboard")} 
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="w-5 h-5" />}
                >
                  Go to Dashboard
                </Button>
                <AIDelegationButton />
              </div>
            ) : (
              <InstallFlask />
            )}
          </motion.div>
        </motion.section>
        
        {/* ERC-7715 Explainer */}
        {!isLoading && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-0 shadow-xl backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-full">
                    <Lightbulb className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-3 text-purple-300">What is ERC-7715?</h2>
                    <p className="mb-4 text-gray-300">
                      ERC-7715 introduces a standard way for dApps to request permissions from a wallet to execute transactions on your behalf.
                      Instead of approving every single transaction, you grant our AI delegation a specific allowance to make trades for you within your set limits.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-purple-900/30 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-300 mb-2">Secure</h3>
                        <p className="text-sm text-gray-400">You control the exact limits of what our AI can do with your funds</p>
                      </div>
                      <div className="bg-purple-900/30 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-300 mb-2">Convenient</h3>
                        <p className="text-sm text-gray-400">No need to approve every transaction manually</p>
                      </div>
                      <div className="bg-purple-900/30 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-300 mb-2">Revocable</h3>
                        <p className="text-sm text-gray-400">Cancel permissions at any time with a single click</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}
        
        {/* Wallet Information */}
        {!isLoading && <WalletInfoContainer />}
        
        {/* Features */}
        <motion.section 
          className="mb-16"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h2 
            className="text-2xl font-bold mb-6 text-center"
            variants={itemVariants}
          >
            Key Features
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="bg-gray-800/50 border-0 shadow-lg overflow-hidden backdrop-blur-sm h-full">
                <div className="h-2 bg-blue-500"></div>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Bot className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold">AI-Powered Rules</h3>
                  </div>
                  <p className="text-gray-300">
                    Create customizable rules that automatically execute based on market conditions. Your AI assistant works 24/7 so you don't have to.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="bg-gray-800/50 border-0 shadow-lg overflow-hidden backdrop-blur-sm h-full">
                <div className="h-2 bg-green-500"></div>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Shield className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold">Safe Delegation</h3>
                  </div>
                  <p className="text-gray-300">
                    Using ERC-7715 permissions, you control exactly what the AI can do. Set spending limits and revoke access at any time.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="bg-gray-800/50 border-0 shadow-lg overflow-hidden backdrop-blur-sm h-full">
                <div className="h-2 bg-purple-500"></div>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <ChartBar className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold">Real-time Analytics</h3>
                  </div>
                  <p className="text-gray-300">
                    Track performance with detailed analytics. See how your portfolio is performing and what actions the AI is taking.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>
        
        {/* How it works */}
        <motion.section 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          
          <div className="relative">
            {/* Timeline connector */}
            <div className="absolute left-[15px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500/30 ml-[7px] md:-ml-[1px] z-0"></div>
            
            {/* Steps */}
            <div className="relative z-10 space-y-16">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold">1</span>
                </div>
                <div className="md:w-[calc(50%-3rem)] md:text-right md:pr-8 flex-grow-0">
                  <h3 className="text-xl font-bold mb-3 text-blue-400">Connect Wallet</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Connect your MetaMask Flask wallet to get started. Your keys, your crypto.
                  </p>
                </div>
                <div className="hidden md:block w-10 h-10"></div>
                <div className="hidden md:block md:w-[calc(50%-3rem)]"></div>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="hidden md:block w-10 h-10 md:order-2"></div>
                <div className="hidden md:block md:w-[calc(50%-3rem)] md:order-1"></div>
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30 md:order-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <div className="md:order-4 md:w-[calc(50%-3rem)] md:pl-8 flex-grow-0">
                  <h3 className="text-xl font-bold mb-3 text-purple-400">Grant AI Delegation</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Using ERC-7715, grant permission for the AI to rebalance your portfolio within preset limits.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold">3</span>
                </div>
                <div className="md:w-[calc(50%-3rem)] md:text-right md:pr-8 flex-grow-0">
                  <h3 className="text-xl font-bold mb-3 text-blue-400">Configure AI Rules</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Set up rules like "If ETH drops 5%, swap 10% of USDC to ETH" or let our AI suggest optimal strategies.
                  </p>
                </div>
                <div className="hidden md:block w-10 h-10"></div>
                <div className="hidden md:block md:w-[calc(50%-3rem)]"></div>
              </div>
              
              {/* Step 4 */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="hidden md:block w-10 h-10 md:order-2"></div>
                <div className="hidden md:block md:w-[calc(50%-3rem)] md:order-1"></div>
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30 md:order-3">
                  <span className="text-white font-bold">4</span>
                </div>
                <div className="md:order-4 md:w-[calc(50%-3rem)] md:pl-8 flex-grow-0">
                  <h3 className="text-xl font-bold mb-3 text-purple-400">Watch Your Portfolio Grow</h3>
                  <p className="text-gray-300 leading-relaxed">
                    The AI executes trades based on your rules and market conditions, optimizing your returns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
        
        {/* CTA Section */}
        <motion.section 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-purple-900/50 border-0 shadow-xl backdrop-blur-md">
            <CardContent className="p-10">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Ready to let AI manage your portfolio?</h2>
              <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
                Start automating your crypto investments with AI-powered rules and ERC-7715 delegations.
              </p>
              
              {isFlask ? (
                <Button 
                  onClick={() => router.push("/dashboard")} 
                  variant="primary"
                  size="lg"
                  icon={<Rocket className="w-5 h-5" />}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Launch Dashboard
                </Button>
              ) : (
                <Button
                  onClick={() => window.open("https://metamask.io/flask/", "_blank")}
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Install MetaMask Flask
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </main>
      
      <footer className="py-6 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>DeFi AI Portfolio Manager — Built with MetaMask Delegation Toolkit</p>
          <p className="mt-2">This is a demo application for educational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
