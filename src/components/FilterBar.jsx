import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Filter, Shirt, Award, Tv, Megaphone, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  { id: 'all', label: 'הכל', icon: ClipboardList },
  { id: 'sport', label: 'ספורט', icon: Award },
  { id: 'reality', label: 'ריאליטי', icon: Tv },
  { id: 'politics', label: 'פוליטיקה', icon: Megaphone },
  { id: 'viral', label: 'ויראלי', icon: Flame },
];

const productTypes = [
  { id: 'all', label: 'כל הפריטים' },
  { id: 'tshirt', label: 'חולצות' },
  { id: 'hoodie', label: 'קפוצ\'ונים' },
  { id: 'cap', label: 'כובעים' },
];

export default function FilterBar({ 
  selectedCategory, 
  setSelectedCategory, 
  selectedType, 
  setSelectedType 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-800/50 border-2 border-zinc-700 rounded-sm p-4 md:p-6 mb-8"
    >
      {/* Clipboard header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-700/50">
        <div className="bg-amber-200/10 p-2 rounded">
          <ClipboardList className="w-5 h-5 text-amber-200" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">רשימת מלאי</h3>
          <p className="text-xs text-zinc-500">סנן לפי קטגוריה וסוג פריט</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-400 font-medium">קטגוריה:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm border-2 transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-orange-500 border-orange-500 text-zinc-900'
                    : 'bg-zinc-900/50 border-zinc-600 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Product Type Filter */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shirt className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-400 font-medium">סוג פריט:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {productTypes.map((type) => {
            const isActive = selectedType === type.id;
            return (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType(type.id)}
                className={`px-4 py-2 rounded-sm border-2 transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-zinc-300 border-zinc-300 text-zinc-900'
                    : 'bg-zinc-900/50 border-zinc-600 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                {type.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Decorative stamps */}
      <div className="flex justify-end mt-4 pt-4 border-t border-zinc-700/30">
        <div className="text-[10px] text-zinc-600 font-mono border border-dashed border-zinc-700 px-2 py-1 rotate-[-2deg]">
          עודכן: {new Date().toLocaleDateString('he-IL')}
        </div>
      </div>
    </motion.div>
  );
}