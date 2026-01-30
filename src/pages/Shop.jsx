import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Store, Loader2 } from 'lucide-react';

import FilterBar from '@/components/FilterBar';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  // Fetch cart items
  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (item) => {
      const existingItem = cartItems.find(
        ci => ci.product_id === item.product_id && ci.size === item.size
      );
      
      if (existingItem) {
        return base44.entities.CartItem.update(existingItem.id, {
          quantity: existingItem.quantity + item.quantity
        });
      } else {
        return base44.entities.CartItem.create(item);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setIsCartOpen(true);
    }
  });

  // Update cart quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, size, quantity }) => {
      const item = cartItems.find(ci => ci.product_id === productId && ci.size === size);
      if (item) {
        return base44.entities.CartItem.update(item.id, { quantity });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  // Remove from cart
  const removeFromCartMutation = useMutation({
    mutationFn: async ({ productId, size }) => {
      const item = cartItems.find(ci => ci.product_id === productId && ci.size === size);
      if (item) {
        return base44.entities.CartItem.delete(item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  // Filter products
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
    const typeMatch = selectedType === 'all' || product.product_type === selectedType;
    return categoryMatch && typeMatch;
  });

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-900" dir="rtl">
      {/* Floating Cart Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-orange-500 hover:bg-orange-400 text-zinc-900 p-4 rounded-full shadow-lg shadow-orange-500/30 transition-colors"
      >
        <ShoppingBag className="w-6 h-6" />
        {cartItemsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-zinc-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {cartItemsCount}
          </span>
        )}
      </motion.button>

      {/* Shop Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 px-4 py-2 rounded-sm mb-4">
              <Store className="w-5 h-5 text-orange-500" />
              <span className="text-zinc-400 font-mono text-sm">דרופים פעילים</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">החנות</h2>
            <p className="text-zinc-400">שלוף את הפריטים הכי חמים לפני שהם נגמרים</p>
          </motion.div>

          {/* Filter Bar */}
          <FilterBar
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />

          {/* Products Grid */}
          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto flex items-center justify-center mb-4">
                <Store className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">אין מוצרים בקטגוריה זו</h3>
              <p className="text-zinc-400">נסה לבחור קטגוריה אחרת</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard
                      product={product}
                      onSelect={setSelectedProduct}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => addToCartMutation.mutateAsync(item)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(productId, size, quantity) => 
          updateQuantityMutation.mutate({ productId, size, quantity })
        }
        onRemove={(productId, size) => 
          removeFromCartMutation.mutate({ productId, size })
        }
      />
    </div>
  );
}