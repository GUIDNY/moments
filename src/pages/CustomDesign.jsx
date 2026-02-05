import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CustomDesign() {
  const [designImage, setDesignImage] = useState(null);
  const [designImageUrl, setDesignImageUrl] = useState('');
  const [productType, setProductType] = useState('tshirt');
  const [size, setSize] = useState('M');
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async (item) => {
      const cartItems = await base44.entities.CartItem.list();
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
      alert('העיצוב נוסף לעגלה בהצלחה! 🎨');
      setDesignImage(null);
      setDesignImageUrl('');
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDesignImageUrl(file_url);
      setDesignImage(URL.createObjectURL(file));
    } catch (error) {
      console.error('Upload error:', error);
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddToCart = () => {
    if (!designImageUrl) {
      alert('יש להעלות תמונת עיצוב תחילה');
      return;
    }

    const prices = { tshirt: 89, hoodie: 149, cap: 69 };
    const names = { tshirt: 'חולצה מעוצבת', hoodie: 'קפוצ\'ון מעוצב', cap: 'כובע מעוצב' };

    addToCartMutation.mutate({
      product_id: `custom_${Date.now()}`,
      product_name: names[productType],
      size: size,
      quantity: 1,
      price: prices[productType],
      image_url: designImageUrl
    });
  };

  const getProductImage = () => {
    const images = {
      tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
      cap: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500'
    };
    return images[productType];
  };

  return (
    <div className="min-h-screen bg-zinc-900" dir="rtl">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-orange-500/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-orange-500 inline ml-2" />
            <span className="text-orange-500 font-bold">צור עיצוב משלך</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            הפוך את הרגע שלך למוצר ייחודי
          </h1>
          <p className="text-zinc-400 text-lg">
            העלה תמונה, בחר מוצר, וקבל הדפסה איכותית שתחזיק מעמד
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left - Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-zinc-800 border-2 border-zinc-700 rounded-sm p-6">
              <h3 className="text-xl font-bold text-white mb-4">העלה את העיצוב שלך</h3>
              
              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-3">בחר תמונה להדפסה</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="design-upload"
                  />
                  <label
                    htmlFor="design-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-600 rounded-sm cursor-pointer hover:border-orange-500 transition-colors bg-zinc-900"
                  >
                    {isUploading ? (
                      <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    ) : designImage ? (
                      <img src={designImage} alt="עיצוב" className="w-full h-full object-contain p-4" />
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-zinc-500 mb-2" />
                        <span className="text-zinc-400 text-sm">לחץ להעלאת תמונה</span>
                        <span className="text-zinc-600 text-xs mt-1">JPG, PNG עד 10MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-3">בחר סוג מוצר</label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tshirt">חולצה (₪89)</SelectItem>
                    <SelectItem value="hoodie">קפוצ'ון (₪149)</SelectItem>
                    <SelectItem value="cap">כובע (₪69)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-3">בחר מידה</label>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`w-12 h-12 rounded-sm border-2 font-bold transition-all ${
                        size === s
                          ? 'bg-orange-500 border-orange-500 text-zinc-900'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!designImageUrl || addToCartMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-400 text-zinc-900 font-bold py-6 text-lg"
              >
                {addToCartMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    מוסיף לעגלה...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 ml-2" />
                    הוסף לעגלה
                  </>
                )}
              </Button>
            </div>

            {/* Info */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-sm p-4">
              <h4 className="text-sm font-bold text-white mb-2">📦 פרטי משלוח והדפסה</h4>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li>• הדפסה איכותית על בד כותנה 100%</li>
                <li>• זמן אספקה: 5-7 ימי עסקים</li>
                <li>• משלוח חינם בהזמנה מעל ₪200</li>
                <li>• האיכות מובטחת לשנה</li>
              </ul>
            </div>
          </motion.div>

          {/* Right - Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-800 border-2 border-zinc-700 rounded-sm p-6 sticky top-8"
          >
            <h3 className="text-xl font-bold text-white mb-6">תצוגה מקדימה</h3>
            
            <div className="relative aspect-square bg-zinc-900 rounded-sm overflow-hidden">
              <img
                src={getProductImage()}
                alt={productType}
                className="w-full h-full object-cover opacity-90"
              />
              
              {designImage && (
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  src={designImage}
                  alt="עיצוב"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 object-contain"
                />
              )}
              
              {!designImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-zinc-700 mx-auto mb-2" />
                    <p className="text-zinc-600 text-sm">העלה תמונה לתצוגה מקדימה</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-zinc-400 text-sm">
                התמונה מוצגת להמחשה בלבד. <br />
                המוצר הסופי יהיה באיכות HD
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}