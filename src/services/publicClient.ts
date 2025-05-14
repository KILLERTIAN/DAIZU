import { createPublicClient, createWalletClient, http, fallback, custom } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { config } from "@/config";

// Primary RPC endpoints for standard Ethereum calls - use multiple with fallback
const PRIMARY_RPC_URLS = [
  process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia.publicnode.com",
  "https://rpc.sepolia.org",
  "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Public Infura key
  "https://eth-sepolia.g.alchemy.com/v2/demo", // Alchemy demo key
];

// Bundler endpoint - specifically for ERC-4337 operations
const BUNDLER_URL = process.env.NEXT_PUBLIC_BUNDLER_URL || "https://api.pimlico.io/v2/11155111/rpc?apikey=pim_hSMmPodpNbiTREAb7Dm4iM";

// Paymaster endpoint - for sponsored transactions
const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL || "https://api.pimlico.io/v2/11155111/rpc?apikey=pim_hSMmPodpNbiTREAb7Dm4iM";

// Create a public client with multiple fallback RPCs for standard Ethereum calls
export const publicClient = createPublicClient({
  chain: config.chain,
  transport: fallback(PRIMARY_RPC_URLS.map(url => http(url, {
    timeout: 10000, // 10 second timeout
    retryCount: 3,
    retryDelay: 1000,
  }))),
});

// Create a paymaster client for sponsored transactions
export const paymasterClient = createPaymasterClient({
  transport: http(PAYMASTER_URL, {
    timeout: 20000, // 20 second timeout
    retryCount: 2,
  }),
});

// Create a bundler client specifically for bundler operations
export const bundlerClient = createBundlerClient({
  chain: config.chain,
  transport: http(BUNDLER_URL, {
    timeout: 20000, // 20 second timeout
    retryCount: 2,
  }),
  paymaster: paymasterClient, // Optional, only if you want to sponsor transactions
});

// Helper function to create a wallet client with the connected provider
export const createConnectedWalletClient = (provider: any) => {
  return createWalletClient({
    chain: config.chain,
    transport: custom(provider),
  });
};

// Important note: Pimlico RPC endpoints do NOT support standard eth_ methods like eth_getBalance
// They only support bundler and paymaster methods - standard eth_ calls must use publicClient
