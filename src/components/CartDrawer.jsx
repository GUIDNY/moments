import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CartDrawer({ isOpen, onClose, items, onUpdateQuantity, onRemove }) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeShippingThreshold = 200;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="bg-zinc-800 p-4 flex items-center justify-between border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded">
                  <ShoppingBag className="w-5 h-5 text-zinc-900" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">העגלה שלך</h2>
                  <p className="text-xs text-zinc-400">{items.length} פריטים</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free shipping progress */}
            {items.length > 0 && (
              <div className="px-4 py-3 bg-zinc-800/50 border-b border-zinc-700">
                {remainingForFreeShipping > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-zinc-400">עוד ₪{remainingForFreeShipping} למשלוח חינם</span>
                      <Truck className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(total / freeShippingThreshold) * 100}%` }}
                        className="h-full bg-orange-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                    <Truck className="w-4 h-4" />
                    <span>מגיע לך משלוח חינם! 🎉</span>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-12 h-12 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">העגלה ריקה</h3>
                  <p className="text-sm text-zinc-400 mb-6">לא שלפת שום דבר מהמדפים עדיין</p>
                  <Button
                    onClick={onClose}
                    className="bg-orange-500 hover:bg-orange-400 text-zinc-900 font-bold"
                  >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    חזרה למחסן
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={`${item.product_id}-${item.size}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="bg-zinc-800 rounded-sm overflow-hidden border border-zinc-700"
                  >
                    <div className="flex gap-4 p-3">
                      {/* Image */}
                      <div className="w-20 h-20 bg-zinc-700 rounded-sm overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-zinc-500" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm mb-1 truncate">{item.product_name}</h4>
                        <p className="text-xs text-zinc-400 mb-2">מידה: {item.size}</p>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onUpdateQuantity(item.product_id, item.size, Math.max(1, item.quantity - 1))}
                              className="w-7 h-7 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3 h-3 text-white" />
                            </button>
                            <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.product_id, item.size, item.quantity + 1)}
                              className="w-7 h-7 bg-zinc-700 hover:bg-zinc-600 rounded flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => onRemove(item.product_id, item.size)}
                            className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-left">
                        <span className="font-bold text-orange-500">₪{item.price * item.quantity}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer - Checkout */}
            {items.length > 0 && (
              <div className="border-t border-zinc-700 p-4 bg-zinc-800 space-y-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-zinc-400">סה״כ:</span>
                  <span className="font-black text-white text-2xl">₪{total}</span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-zinc-900 font-bold py-4 rounded-sm text-lg transition-all"
                >
                  המשך לתשלום
                </motion.button>
                
                <button
                  onClick={onClose}
                  className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors py-2"
                >
                  המשך בקניות
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}