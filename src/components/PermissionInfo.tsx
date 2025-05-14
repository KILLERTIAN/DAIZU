"use client";

import { usePermissions } from "@/providers/PermissionProvider";
import { Trash2, Clock, DollarSign, Shield, Info } from "lucide-react";
import { formatEther, maxUint256 } from "viem";

export default function PermissionInfo() {
  const { permission, removePermission } = usePermissions();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatPermissionType = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get the appropriate permission object
  const getPermissionDetails = () => {
    if (!permission) return null;

    // Handle both permission formats
    if (permission.permission) {
      return permission.permission;
    } else if (permission.permissions && permission.permissions.length > 0) {
      return permission.permissions[0];
    }
    return null;
  };

  if (!permission) {
    return null;
  }

  const permissionDetails = getPermissionDetails();
  if (!permissionDetails) {
    return (
      <div className="w-full mx-auto p-3 max-w-4xl space-y-2">
        <div className="bg-gray-800 w-full rounded-lg p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Granted Permission</h3>
            <button
              onClick={removePermission}
              className="text-red-400 hover:text-red-300 text-xs"
              title="Clear permissions"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400">Invalid permission format</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-3 max-w-4xl space-y-2">
      <div className="bg-gray-800 w-full rounded-lg p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Granted Permission</h3>
          <button
            onClick={removePermission}
            className="text-red-400 hover:text-red-300 text-xs"
            title="Clear permissions"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              {formatPermissionType(permissionDetails.type)}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <p className="text-gray-400">Expiry:</p>
                </div>
                <p className="text-white font-medium">{formatDate(permission.expiry)}</p>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <p className="text-gray-400">Allowance:</p>
                </div>
                <p className="text-white font-medium">
                  {formatAllowance(permissionDetails.data)}
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-purple-400" />
                  <p className="text-gray-400">Chain:</p>
                </div>
                <p className="text-white font-medium">
                  {formatChainId(permission.chainId)}
                </p>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <Info className="w-4 h-4 text-gray-400" />
                Permission Details:
              </div>
              <pre className="bg-gray-900 p-3 rounded text-xs max-h-80 text-gray-300 overflow-x-auto">
                {JSON.stringify(formatPermissionData(permission), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatChainId(chainId: string): string {
  // Handle common chain IDs
  const chains: Record<string, string> = {
    '0x1': 'Ethereum Mainnet',
    '0xaa36a7': 'Sepolia Testnet',
    '0x5': 'Goerli Testnet',
    '0x89': 'Polygon',
    '0x13881': 'Mumbai Testnet',
    '0xa4b1': 'Arbitrum',
    '0xa': 'Optimism',
  };
  
  return chains[chainId] || chainId;
}

function formatAllowance(data: Record<string, any>): string {
  if (data.allowance) {
    try {
      const allowanceBigInt = BigInt(data.allowance);
      if (allowanceBigInt === maxUint256) {
        return "Unlimited ETH";
      }
      return `${formatEther(allowanceBigInt)} ETH`;
    } catch (e) {
      return data.allowance.toString();
    }
  }
  
  if (data.amountPerSecond) {
    try {
      const amountBigInt = BigInt(data.amountPerSecond);
      return `${formatEther(amountBigInt)} ETH/sec`;
    } catch (e) {
      return data.amountPerSecond.toString();
    }
  }
  
  return "Unknown";
}

function formatPermissionData(
  data: Record<string, unknown>
): Record<string, unknown> {
  if (!data) return data;

  if (typeof data === "object") {
    const formattedData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (["initialAmount", "amountPerSecond", "maxAmount", "allowance"].includes(key)) {
        // format as ether
        if (typeof value === 'string' && value.startsWith('0x')) {
          try {
            const valueBigInt = BigInt(value);
  
            if (valueBigInt === maxUint256) {
              formattedData[key] = "Unlimited";
            } else {
              try {
                formattedData[key] = formatEther(valueBigInt);
              } catch {
                formattedData[key] = valueBigInt.toString();
              }
            }
          } catch (e) {
            formattedData[key] = value;
          }
        } else {
          formattedData[key] = value;
        }
      } else if (Array.isArray(value)) {
        formattedData[key] = value.map((item) => {
          if (typeof item === "object" && item !== null) {
            return formatPermissionData(item as Record<string, unknown>);
          }
          return item;
        });
      } else if (typeof value === "object" && value !== null) {
        formattedData[key] = formatPermissionData(
          value as Record<string, unknown>
        );
      } else {
        formattedData[key] = value;
      }
    }

    return formattedData;
  }

  return data;
}
