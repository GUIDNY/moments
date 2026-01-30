import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Package, Calendar, CheckCircle, Truck, AlertTriangle, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!product?.drop_ends) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(product.drop_ends).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [product?.drop_ends]);

  useEffect(() => {
    if (isOpen) {
      setSelectedSize(null);
      setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  const getCategoryLabel = (cat) => {
    const labels = { sport: 'ספורט', politics: 'פוליטיקה', viral: 'ויראלי', reality: 'ריאליטי' };
    return labels[cat] || cat;
  };

  const getTypeLabel = (type) => {
    const labels = { tshirt: 'חולצה', hoodie: 'קפוצ\'ון', cap: 'כובע' };
    return labels[type] || type;
  };

  const handleAddToCart = async () => {
    if (!selectedSize || isAdding) return;
    
    setIsAdding(true);
    try {
      await onAddToCart({
        product_id: product.id,
        product_name: product.name,
        size: selectedSize,
        quantity,
        price: product.price,
        image_url: product.image_url
      });
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const sizes = product.sizes || ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal - Shipping Document Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] bg-amber-50 z-50 overflow-hidden rounded-sm shadow-2xl"
          >
            {/* Document Header - Shipping Label Style */}
            <div className="bg-zinc-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded">
                  <Package className="w-5 h-5 text-zinc-900" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">תעודת משלוח</h2>
                  <p className="text-xs text-zinc-400">מס׳: #{product.id?.slice(-8) || '00000000'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)] md:max-h-[calc(90vh-120px)]">
              {/* Timer Banner */}
              <div className="bg-zinc-900 px-4 py-3 flex items-center justify-center gap-4 text-white">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-sm">הדרופ נסגר בעוד:</span>
                <div className="flex gap-2">
                  {[
                    { value: timeLeft.hours, label: 'שעות' },
                    { value: timeLeft.minutes, label: 'דקות' },
                    { value: timeLeft.seconds, label: 'שניות' }
                  ].map((item, i) => (
                    <div key={i} className="bg-zinc-800 px-3 py-1 rounded text-center min-w-[60px]">
                      <div className="text-xl font-mono font-bold text-orange-500">
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-zinc-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-6 grid md:grid-cols-2 gap-6">
                {/* Product Image - Stamp/Barcode style */}
                <div className="relative">
                  <div className="aspect-square bg-white border-4 border-dashed border-zinc-300 rounded-sm p-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                        <Package className="w-24 h-24 text-zinc-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Stamp overlays */}
                  <div className="absolute top-2 right-2 bg-red-500/90 text-white px-2 py-1 text-xs font-bold rotate-[-5deg]">
                    מהדורה מוגבלת
                  </div>
                  
                  {product.is_trending && (
                    <div className="absolute bottom-2 left-2 bg-orange-500/90 text-zinc-900 px-2 py-1 text-xs font-bold rotate-[3deg]">
                      HOT
                    </div>
                  )}
                </div>

                {/* Product Details - Form Style */}
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="bg-white border border-zinc-300 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-zinc-200 text-zinc-700 text-xs">
                        {getTypeLabel(product.product_type)}
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-800 text-xs">
                        {getCategoryLabel(product.category)}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-zinc-600">{product.description}</p>
                    )}
                    {product.event_date && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-zinc-500">
                        <Calendar className="w-4 h-4" />
                        <span>תאריך האירוע: {product.event_date}</span>
                      </div>
                    )}
                  </div>

                  {/* Size Selection */}
                  <div className="bg-white border border-zinc-300 rounded-sm p-4">
                    <label className="text-sm font-bold text-zinc-700 mb-3 block">
                      בחר מידה: <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <motion.button
                          key={size}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedSize(size)}
                          className={`w-12 h-12 rounded-sm border-2 font-bold transition-all ${
                            selectedSize === size
                              ? 'bg-zinc-900 border-zinc-900 text-white'
                              : 'bg-white border-zinc-300 text-zinc-700 hover:border-zinc-500'
                          }`}
                        >
                          {size}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="bg-white border border-zinc-300 rounded-sm p-4">
                    <label className="text-sm font-bold text-zinc-700 mb-3 block">כמות:</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-sm flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-sm flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-zinc-900 text-white rounded-sm p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-zinc-400">סה״כ לתשלום:</span>
                      <span className="text-3xl font-black">₪{product.price * quantity}</span>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: selectedSize ? 1.02 : 1 }}
                      whileTap={{ scale: selectedSize ? 0.98 : 1 }}
                      onClick={handleAddToCart}
                      disabled={!selectedSize || product.stock_status === 'sold_out' || isAdding}
                      className={`w-full py-4 rounded-sm font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                        !selectedSize
                          ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                          : product.stock_status === 'sold_out'
                          ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                          : 'bg-orange-500 text-zinc-900 hover:bg-orange-400'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                          מוסיף...
                        </>
                      ) : !selectedSize ? (
                        'בחר מידה תחילה'
                      ) : product.stock_status === 'sold_out' ? (
                        'אזל מהמלאי'
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          שריין מלאי
                        </>
                      )}
                    </motion.button>

                    {product.stock_status === 'low_stock' && (
                      <div className="flex items-center justify-center gap-2 mt-3 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>מלאי נמוך - מומלץ למהר!</span>
                      </div>
                    )}
                  </div>

                  {/* Shipping Info */}
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Truck className="w-4 h-4" />
                    <span>משלוח חינם בהזמנה מעל ₪200</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}