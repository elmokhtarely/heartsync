import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface NotificationLayerProps {
  message: string | null;
}

export default function NotificationLayer({ message }: NotificationLayerProps) {
  return (
    <div className="fixed top-8 left-0 right-0 pointer-events-none flex justify-center z-[100]">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.8 }}
            className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-pink-100 flex items-center gap-3"
          >
            <Heart size={20} className="text-pink-500 fill-pink-500" />
            <span className="text-pink-900 font-medium">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
