import React from 'react';
import Image from 'next/image';
import { Coins } from 'lucide-react';

// Map of cryptocurrency symbols to their icon URLs
const CRYPTO_ICONS: Record<string, string> = {
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  WETH: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  DAI: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
  AAVE: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  MKR: 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png',
  COMP: 'https://assets.coingecko.com/coins/images/10775/small/COMP.png',
  SNX: 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',
  CRV: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
  BAL: 'https://assets.coingecko.com/coins/images/11683/small/Balancer.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  SUSHI: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
  // Add more as needed
};

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export const CryptoIcon: React.FC<CryptoIconProps> = ({ 
  symbol, 
  size = 24,
  className = '' 
}) => {
  const iconUrl = CRYPTO_ICONS[symbol.toUpperCase()];
  
  if (!iconUrl) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-gray-800 ${className}`} style={{ width: size, height: size }}>
        <Coins className="text-gray-400" size={size * 0.6} />
      </div>
    );
  }
  
  return (
    <div className={`relative overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}>
      <Image
        src={iconUrl}
        alt={`${symbol} icon`}
        width={size}
        height={size}
        className="object-contain"
        priority
        onError={(e) => {
          // Show fallback on error
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement?.classList.add('bg-gray-800');
          const fallback = document.createElement('div');
          fallback.className = 'absolute inset-0 flex items-center justify-center';
          fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><circle cx="8" cy="8" r="7"></circle><circle cx="16" cy="16" r="7"></circle><line x1="8" y1="1" x2="8" y2="15"></line><line x1="16" y1="9" x2="16" y2="23"></line></svg>`;
          e.currentTarget.parentElement?.appendChild(fallback);
        }}
      />
    </div>
  );
};

export default CryptoIcon; 