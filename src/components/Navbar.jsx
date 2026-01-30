import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { Package, Home, Store, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="bg-zinc-800/90 backdrop-blur-sm border-b border-zinc-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded">
              <Package className="w-5 h-5 text-zinc-900" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">MOMENTS</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('Home')}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">דף הבית</span>
              </motion.button>
            </Link>

            <Link to={createPageUrl('Shop')}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded-sm transition-colors"
              >
                <Store className="w-4 h-4" />
                <span className="hidden md:inline">החנות</span>
              </motion.button>
            </Link>

            {isAdmin && (
              <Link to={createPageUrl('Inventory')}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-sm transition-colors border border-orange-500/30"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden md:inline">ניהול מלאי</span>
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}