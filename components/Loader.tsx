import React from 'react';
import { motion } from 'framer-motion';

interface LoaderProps {
  onFinish: () => void;
}

export const Loader: React.FC<LoaderProps> = ({ onFinish }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onFinish}
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100px' }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="h-[2px] bg-white mb-6"
        />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-3xl font-serif font-light tracking-widest text-white"
        >
          PENSIÓN<span className="font-bold">DESK</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-2 text-xs uppercase tracking-[0.3em] text-zinc-500"
        >
          Sistema Local de Inteligencia Legal
        </motion.p>
      </div>
    </motion.div>
  );
};