import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface FloatingHeart {
  id: number;
  x: number;
}

export default function FloatingHearts({ count }: { count: number }) {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    if (count > 0) {
      const newHeart = {
        id: Date.now(),
        x: Math.random() * 80 + 10, // 10% to 90%
      };
      setHearts((prev) => [...prev, newHeart]);
      
      const timer = setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ y: '110vh', x: `${heart.x}vw`, scale: 0.5, opacity: 0 }}
            animate={{ 
              y: '-10vh', 
              opacity: [0, 1, 1, 0],
              x: `${heart.x + (Math.random() * 20 - 10)}vw`,
              scale: [0.5, 1.2, 1],
              rotate: [0, Math.random() * 40 - 20]
            }}
            transition={{ duration: 3, ease: "easeOut" }}
            exit={{ opacity: 0 }}
            className="absolute text-pink-500"
          >
            <Heart size={48} fill="currentColor" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
