import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { LayoutGrid, FileText, Scale, Shield, Menu } from 'lucide-react';

interface NavbarProps {
  onEnterApp?: () => void;
  simple?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onEnterApp, simple = false }) => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 border-b ${
        isScrolled || simple
          ? 'bg-black/80 backdrop-blur-md border-zinc-800 py-4'
          : 'bg-transparent border-transparent py-6'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-serif font-bold rounded-sm group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="font-serif text-xl tracking-tight font-medium">
            Pensión<span className="font-bold">Desk</span>
          </span>
        </div>

        {!simple ? (
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Funcionalidades</a>
            <a href="#roadmap" className="text-sm text-zinc-400 hover:text-white transition-colors">Roadmap</a>
            <a href="#tech" className="text-sm text-zinc-400 hover:text-white transition-colors">Tecnología</a>
            <button
              onClick={onEnterApp}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"
            >
              Iniciar Sistema
            </button>
          </div>
        ) : (
           <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wider border px-2 py-1 border-zinc-800 rounded">Local Mode</span>
           </div>
        )}

        <div className="md:hidden">
            <Menu className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.nav>
  );
};