import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, ShoppingCart, Loader2, Type, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [mockupUrl, setMockupUrl] = useState('');
  const [designMode, setDesignMode] = useState('upload'); // 'upload' or 'text'
  const [textDesign, setTextDesign] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
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
    setMockupUrl(''); // Reset mockup on new upload
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

  const handleGenerateDesignFromText = async () => {
    if (!textDesign.trim()) {
      alert('אנא כתוב תיאור לעיצוב');
      return;
    }

    setIsGeneratingDesign(true);
    try {
      const colorNames = {
        '#000000': 'black',
        '#FFFFFF': 'white',
        '#FF0000': 'red',
        '#0000FF': 'blue',
        '#FFFF00': 'yellow',
        '#00FF00': 'green',
        '#FF6B00': 'orange',
        '#800080': 'purple'
      };

      const colorName = colorNames[textColor] || 'black';
      
      const prompt = `Create a clean, high-quality graphic design with the text or concept: "${textDesign}". Style: modern, bold, suitable for printing on apparel. Main color: ${colorName}. Background: transparent. High resolution, vector-style, professional design.`;

      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: prompt
      });

      setDesignImageUrl(url);
      setDesignImage(url);
      setMockupUrl('');
    } catch (error) {
      console.error('Error generating design:', error);
      alert('שגיאה ביצירת העיצוב');
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  const handleGenerateMockup = async () => {
    if (!designImageUrl) return;

    setIsGeneratingMockup(true);
    try {
      const productPrompts = {
        tshirt: 'professional product photography of a white t-shirt on a person, front view, centered, clean background, studio lighting, the t-shirt has a custom printed design in the center of the chest area',
        hoodie: 'professional product photography of a black hoodie on a person, front view, centered, clean background, studio lighting, the hoodie has a custom printed design in the center of the chest area',
        cap: 'professional product photography of a baseball cap on a person, front view, centered, clean background, studio lighting, the cap has a custom printed design on the front panel'
      };

      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: productPrompts[productType],
        existing_image_urls: [designImageUrl]
      });

      setMockupUrl(url);
    } catch (error) {
      console.error('Error generating mockup:', error);
      alert('שגיאה ביצירת המוקאפ');
    } finally {
      setIsGeneratingMockup(false);
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
              <h3 className="text-xl font-bold text-white mb-4">בחר סוג עיצוב</h3>
              
              {/* Design Mode Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setDesignMode('upload')}
                  className={`flex-1 py-3 rounded-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    designMode === 'upload'
                      ? 'bg-orange-500 text-zinc-900'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  העלה תמונה
                </button>
                <button
                  onClick={() => setDesignMode('text')}
                  className={`flex-1 py-3 rounded-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    designMode === 'text'
                      ? 'bg-orange-500 text-zinc-900'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Wand2 className="w-5 h-5" />
                  צור עם AI
                </button>
              </div>

              {designMode === 'upload' ? (
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
              ) : (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-3">תאר את העיצוב שתרצה</label>
                    <Textarea
                      value={textDesign}
                      onChange={(e) => setTextDesign(e.target.value)}
                      placeholder='לדוגמה: "כיתוב מצחיק על ספורט", "לוגו עם ציפור", "ציטוט מעורר השראה"...'
                      className="bg-zinc-900 border-zinc-700 text-white min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-3">בחר צבע עיקרי</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { color: '#000000', name: 'שחור' },
                        { color: '#FFFFFF', name: 'לבן' },
                        { color: '#FF0000', name: 'אדום' },
                        { color: '#0000FF', name: 'כחול' },
                        { color: '#FFFF00', name: 'צהוב' },
                        { color: '#00FF00', name: 'ירוק' },
                        { color: '#FF6B00', name: 'כתום' },
                        { color: '#800080', name: 'סגול' }
                      ].map(({ color, name }) => (
                        <button
                          key={color}
                          onClick={() => setTextColor(color)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-sm border-2 transition-all ${
                            textColor === color
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-zinc-700 hover:border-zinc-500'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-full border-2 border-zinc-600"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-white text-sm">{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateDesignFromText}
                    disabled={isGeneratingDesign || !textDesign.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-6"
                  >
                    {isGeneratingDesign ? (
                      <>
                        <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                        יוצר עיצוב...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 ml-2" />
                        צור עיצוב עם AI
                      </>
                    )}
                  </Button>
                </div>
              )}

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

              {designImageUrl && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateMockup}
                  disabled={isGeneratingMockup}
                  className="w-full mb-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-zinc-700 disabled:to-zinc-700 text-white rounded-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {isGeneratingMockup ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      יוצר מוקאפ מציאותי...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {mockupUrl ? 'צור מוקאפ מחדש עם AI' : 'צור מוקאפ מציאותי עם AI'}
                    </>
                  )}
                </motion.button>
              )}

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
            
            <div className="relative aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-sm overflow-hidden shadow-2xl">
              {mockupUrl ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  src={mockupUrl}
                  alt="AI Generated Mockup"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
                  
                  <img
                    src={getProductImage()}
                    alt={productType}
                    className="w-full h-full object-cover"
                  />
                  
                  {designImage && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="absolute"
                      style={{
                        top: '35%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: productType === 'cap' ? '35%' : '40%',
                        height: productType === 'cap' ? '30%' : '40%',
                      }}
                    >
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-black/5 blur-md transform translate-y-1" />
                        <img
                          src={designImage}
                          alt="עיצוב"
                          className="relative w-full h-full object-contain"
                          style={{
                            filter: 'brightness(0.92) contrast(1.08) saturate(1.1)',
                            mixBlendMode: 'multiply',
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                  
                  {!designImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                      <div className="text-center">
                        <Sparkles className="w-16 h-16 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400 text-sm font-medium">העלה תמונה לתצוגה מקדימה</p>
                        <p className="text-zinc-600 text-xs mt-1">התמונה תוצג על המוצר</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 text-center">
              <div className={`border rounded-sm p-3 ${
                mockupUrl 
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30' 
                  : 'bg-zinc-800/50 border-zinc-700'
              }`}>
                <p className={`text-sm ${mockupUrl ? 'text-purple-300' : 'text-zinc-400'}`}>
                  {mockupUrl 
                    ? '✨ מוקאפ נוצר באמצעות AI - כך המוצר ייראה במציאות!' 
                    : designImage 
                      ? '💡 לחץ "צור מוקאפ מציאותי עם AI" לתוצאה מושלמת' 
                      : 'המוצר הסופי יהיה באיכות הדפסה מקצועית'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}