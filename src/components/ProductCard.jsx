import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, AlertTriangle, Calendar, Package, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProductCard({ product, onSelect }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!product.drop_ends) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(product.drop_ends).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('הדרופ נסגר');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours} שעות ${minutes} דקות`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [product.drop_ends]);

  const getCategoryLabel = (cat) => {
    const labels = {
      sport: 'ספורט',
      politics: 'פוליטיקה',
      viral: 'ויראלי',
      reality: 'ריאליטי'
    };
    return labels[cat] || cat;
  };

  const getTypeLabel = (type) => {
    const labels = {
      tshirt: 'חולצה',
      hoodie: 'קפוצ\'ון',
      cap: 'כובע'
    };
    return labels[type] || type;
  };

  const getStockStyle = (status) => {
    switch(status) {
      case 'low_stock':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'sold_out':
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getStockLabel = (status) => {
    switch(status) {
      case 'low_stock': return 'מלאי נמוך';
      case 'sold_out': return 'אזל מהמלאי';
      default: return 'במלאי';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative bg-zinc-800/80 border-2 border-zinc-700 rounded-sm overflow-hidden cursor-pointer transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10"
      onClick={() => onSelect(product)}
    >
      {/* Shelf-like top bar */}
      <div className="bg-zinc-700/50 px-3 py-2 flex items-center justify-between border-b border-zinc-600">
        <span className="text-xs font-mono text-zinc-400">SKU-{product.id?.slice(-6) || '000000'}</span>
        <div className="flex items-center gap-2">
          {product.is_trending && (
            <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] px-2">
              <TrendingUp className="w-3 h-3 ml-1" />
              טרנדי עכשיו
            </Badge>
          )}
        </div>
      </div>

      {/* Product Image */}
      <div className="relative aspect-square bg-zinc-900 overflow-hidden">
        {product.image_url ? (
          <div className="relative w-full h-full">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {product.design_image_url && (
              <img
                src={product.design_image_url}
                alt="עיצוב"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 object-contain"
              />
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-20 h-20 text-zinc-700" />
          </div>
        )}
        
        {/* Stock badge overlay */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getStockStyle(product.stock_status)} border text-xs`}>
            {product.stock_status === 'low_stock' && <AlertTriangle className="w-3 h-3 ml-1" />}
            {getStockLabel(product.stock_status)}
          </Badge>
        </div>

        {/* Category tag */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-zinc-900/80 text-zinc-300 border border-zinc-600 text-xs backdrop-blur-sm">
            {getCategoryLabel(product.category)}
          </Badge>
        </div>

        {/* Video indicator */}
        {product.video_url && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 left-3 bg-orange-500 text-zinc-900 p-2 rounded-full shadow-lg"
          >
            <Video className="w-4 h-4" />
          </motion.div>
        )}
      </div>

      {/* Product Info - Shipping label style */}
      <div className="p-4 bg-gradient-to-b from-zinc-800 to-zinc-800/90">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-bold text-white text-base leading-tight line-clamp-2">
            {product.name}
          </h3>
          <span className="text-xs text-zinc-500 whitespace-nowrap">
            {getTypeLabel(product.product_type)}
          </span>
        </div>

        {product.event_date && (
          <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
            <Calendar className="w-3 h-3" />
            <span>{product.event_date}</span>
          </div>
        )}

        {/* Timer */}
        {timeLeft && (
          <div className="flex items-center gap-2 text-xs text-orange-400 mb-4 bg-orange-500/10 px-2 py-1 rounded">
            <Clock className="w-3 h-3" />
            <span>הדרופ נסגר בעוד: {timeLeft}</span>
          </div>
        )}

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
          <span className="text-2xl font-black text-white">₪{product.price}</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={product.stock_status === 'sold_out'}
            className={`px-4 py-2 rounded-sm font-bold text-sm transition-all ${
              product.stock_status === 'sold_out'
                ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                : 'bg-orange-500 text-zinc-900 hover:bg-orange-400'
            }`}
          >
            {product.stock_status === 'sold_out' ? 'אזל' : 'שלוף מהמדף'}
          </motion.button>
        </div>
      </div>

      {/* Hover effect - tape corners */}
      <div className="absolute top-0 left-0 w-8 h-8 bg-amber-200/20 rotate-45 -translate-x-4 -translate-y-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-amber-200/20 rotate-45 translate-x-4 translate-y-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}