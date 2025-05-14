import React from 'react';
import { motion } from 'framer-motion';

const Loader: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col justify-center items-center py-12"
    >
      <div className="relative">
        {/* Outer spinning ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="h-20 w-20 rounded-full border-4 border-t-purple-600 border-r-purple-400 border-b-purple-200 border-l-purple-400 opacity-70"
        />
        
        {/* Inner pulsing ring */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full border-2 border-purple-500/50 bg-purple-900/30 backdrop-blur-sm"
        />
        
        {/* Center dot */}
        <motion.div 
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/50"
        />
      </div>
      
      {/* Text content */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <motion.p 
          className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400"
          animate={{ 
            filter: ["blur(0px)", "blur(1px)", "blur(0px)"],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          Initializing AI Delegation
        </motion.p>
        <p className="text-sm text-gray-400 mt-2">
          Connecting to MetaMask Flask and verifying permissions
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Loader; 