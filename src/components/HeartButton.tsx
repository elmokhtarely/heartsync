import React from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

interface HeartButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function HeartButton({ onPress, isLoading, disabled }: HeartButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onPress}
      disabled={disabled || isLoading}
      className={`relative w-48 h-48 flex items-center justify-center rounded-full bg-white shadow-2xl transition-shadow ${
        disabled ? 'opacity-50 grayscale' : 'hover:shadow-pink-200 cursor-pointer'
      }`}
    >
      <motion.div
        animate={isLoading ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <Heart 
          size={84} 
          className={`${isLoading ? 'text-pink-300' : 'text-pink-500'} transition-colors`}
          fill={isLoading ? "none" : "currentColor"}
        />
      </motion.div>
      
      {!isLoading && !disabled && (
        <motion.div
          layoutId="ripple"
          className="absolute inset-0 rounded-full border-4 border-pink-100"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}
