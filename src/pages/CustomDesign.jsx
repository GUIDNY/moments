import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, ShoppingCart, Loader2, Type, Wand2, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [designMode, setDesignMode] = useState('upload'); // 'upload' or 'ai'
  const [aiPrompt, setAiPrompt] = useState('');
  const [overlayText, setOverlayText] = useState('');
  const [textPositionY, setTextPositionY] = useState(72); // vertical position in %
  const [fontSize, setFontSize] = useState('medium'); // 'small', 'medium', 'large'
  const [textColor, setTextColor] = useState('white'); // 'white', 'black', 'orange', etc
  const [fontFamily, setFontFamily] = useState('heebo'); // 'heebo', 'rubik', 'assistant', 'secular', 'impact'
  const [shirtColor, setShirtColor] = useState('white');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
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

  const handleGenerateAIDesign = async () => {
    if (!aiPrompt.trim()) {
      alert('אנא תאר את העיצוב שתרצה');
      return;
    }

    setIsProcessingAI(true);
    setMockupUrl('');
    try {
      const prompt = `Create a clean, professional graphic design/illustration for apparel printing.
      
Description: "${aiPrompt}"

CRITICAL INSTRUCTIONS:
- Create an artistic design, illustration, or graphic element (NO TEXT)
- Style: modern, bold, suitable for printing on apparel
- Background: transparent PNG
- High resolution, professional design
- Focus on visual elements, icons, patterns, or illustrations
- DO NOT include any text in the design

Create visual design only based on: "${aiPrompt}"`;

      const { url: generatedDesignUrl } = await base44.integrations.Core.GenerateImage({
        prompt: prompt
      });

      if (!generatedDesignUrl) {
        throw new Error('ה-AI לא הצליח ליצור עיצוב. נסה שוב.');
      }

      setDesignImageUrl(generatedDesignUrl);
      setDesignImage(generatedDesignUrl);
      await generateMockupFromUrl(generatedDesignUrl);

    } catch (error) {
      console.error('Error during AI design generation:', error);
      alert(error.message || 'שגיאה ביצירת העיצוב. נסה שוב.');
      setDesignImageUrl('');
      setDesignImage(null);
      setMockupUrl('');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const generateMockupFromUrl = async (imageUrl) => {
    try {
      const shirtColorNames = {
        white: 'white',
        black: 'black',
        gray: 'gray',
        blue: 'blue',
        red: 'red',
        green: 'green',
        yellow: 'yellow',
        pink: 'pink'
      };

      const productPrompts = {
        tshirt: `CRITICAL INSTRUCTIONS: Create a photorealistic product mockup of a ${shirtColorNames[shirtColor]} t-shirt worn by a person.
        
        YOU MUST:
        1. Place the EXACT image provided as a print/design on the center of the t-shirt chest
        2. Keep the image EXACTLY as it appears - DO NOT modify, recreate, or interpret it
        3. Make it look like a real photograph of the printed t-shirt
        4. The image should look printed/pressed onto the fabric
        5. Professional studio lighting, clean background
        6. Front view, centered composition
        
        The result must show the t-shirt with the exact provided image printed on it.`,
        
        hoodie: `CRITICAL INSTRUCTIONS: Create a photorealistic product mockup of a ${shirtColorNames[shirtColor]} hoodie worn by a person.
        
        YOU MUST:
        1. Place the EXACT image provided as a print/design on the center of the hoodie chest
        2. Keep the image EXACTLY as it appears - DO NOT modify, recreate, or interpret it
        3. Make it look like a real photograph of the printed hoodie
        4. The image should look printed/pressed onto the fabric
        5. Professional studio lighting, clean background
        6. Front view, centered composition
        
        The result must show the hoodie with the exact provided image printed on it.`,
        
        cap: `CRITICAL INSTRUCTIONS: Create a photorealistic product mockup of a ${shirtColorNames[shirtColor]} baseball cap worn by a person.
        
        YOU MUST:
        1. Place the EXACT image provided as a print/design on the front panel of the cap
        2. Keep the image EXACTLY as it appears - DO NOT modify, recreate, or interpret it
        3. Make it look like a real photograph of the printed cap
        4. The image should look embroidered or printed onto the cap
        5. Professional studio lighting, clean background
        6. Front view, centered composition
        
        The result must show the cap with the exact provided image on it.`,
        
        mug: `CRITICAL INSTRUCTIONS: Create a photorealistic product mockup of a ${shirtColorNames[shirtColor]} coffee mug on a clean surface.
        
        YOU MUST:
        1. Place the EXACT image provided as a print/design on the front side of the mug
        2. Keep the image EXACTLY as it appears - DO NOT modify, recreate, or interpret it
        3. Make it look like a real photograph of the printed mug
        4. The image should look professionally printed onto the ceramic mug
        5. Professional studio lighting, clean background or coffee shop setting
        6. Slight angle view showing the front of the mug clearly
        
        The result must show the mug with the exact provided image printed on it.`
      };

      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: productPrompts[productType],
        existing_image_urls: [imageUrl]
      });

      setMockupUrl(url);
    } catch (error) {
      console.error('Error generating mockup:', error);
      throw new Error('שגיאה ביצירת המוקאפ');
    }
  };

  const handleGenerateMockup = async () => {
    if (!designImageUrl) return;

    setIsGeneratingMockup(true);
    try {
      await generateMockupFromUrl(designImageUrl);
    } catch (error) {
      alert(error.message || 'שגיאה ביצירת המוקאפ');
      setMockupUrl('');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const handleAddToCart = () => {
    if (!designImageUrl) {
      alert('יש להעלות תמונת עיצוב תחילה');
      return;
    }

    const prices = { tshirt: 89, hoodie: 149, cap: 69, mug: 59 };
    const names = { tshirt: 'חולצה מעוצבת', hoodie: 'קפוצ\'ון מעוצב', cap: 'כובע מעוצב', mug: 'ספל מעוצב' };

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
      cap: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
      mug: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500'
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
                  onClick={() => setDesignMode('ai')}
                  className={`flex-1 py-3 rounded-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    designMode === 'ai'
                      ? 'bg-orange-500 text-zinc-900'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Wand2 className="w-5 h-5" />
                  צור עיצוב עם AI
                </button>
              </div>

              {designMode === 'upload' ? (
                <div className="mb-6 space-y-4">
                  <div>
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
                </div>
              ) : (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-3">תאר עיצוב גרפי (ללא טקסט)</label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder='דוגמאות: "ציפור צבעונית", "הר עם שמש", "גלי ים מופשטים", "פרח טרופי"...'
                      className="bg-zinc-900 border-zinc-700 text-white min-h-[100px]"
                      dir="auto"
                    />
                  </div>

                  <Button
                    onClick={handleGenerateAIDesign}
                    disabled={isProcessingAI || !aiPrompt.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-6"
                  >
                    {isProcessingAI ? (
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

              {/* Text Overlay Option - Always Available */}
              {mockupUrl && (
                <div className="mb-6 p-4 bg-zinc-900 rounded-sm border border-zinc-700">
                  <label className="block text-sm text-zinc-400 mb-3">
                    <Type className="w-4 h-4 inline ml-1" />
                    הוסף כתובית על המוקאפ (אופציונלי)
                  </label>
                  <Input
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="לדוגמה: שלום עולם, GAME ON..."
                    className="bg-zinc-800 border-zinc-600 text-white mb-3"
                    dir="auto"
                  />
                  
                  <div className="mb-3">
                    <label className="block text-xs text-zinc-500 mb-2">מיקום הטקסט (גובה)</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTextPositionY(Math.max(10, textPositionY - 5))}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-all"
                      >
                        <ChevronUp className="w-4 h-4 text-white" />
                      </button>
                      <div className="flex-1 bg-zinc-800 rounded px-3 py-2 text-center">
                        <span className="text-white text-sm font-bold">{textPositionY}%</span>
                      </div>
                      <button
                        onClick={() => setTextPositionY(Math.min(90, textPositionY + 5))}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-all"
                      >
                        <ChevronDown className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">גודל פונט</label>
                      <Select value={fontSize} onValueChange={setFontSize}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">קטן</SelectItem>
                          <SelectItem value="medium">בינוני</SelectItem>
                          <SelectItem value="large">גדול</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">גופן</label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heebo">Heebo</SelectItem>
                          <SelectItem value="rubik">Rubik</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                          <SelectItem value="impact">Impact</SelectItem>
                          <SelectItem value="arial">Arial Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs text-zinc-500 mb-2">צבע הטקסט</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { color: 'white', hex: '#FFFFFF', name: 'לבן' },
                        { color: 'black', hex: '#000000', name: 'שחור' },
                        { color: 'orange', hex: '#FF6B00', name: 'כתום' },
                        { color: 'red', hex: '#EF4444', name: 'אדום' },
                        { color: 'blue', hex: '#3B82F6', name: 'כחול' },
                        { color: 'yellow', hex: '#FBBF24', name: 'צהוב' },
                        { color: 'green', hex: '#10B981', name: 'ירוק' }
                      ].map(({ color, hex, name }) => (
                        <button
                          key={color}
                          onClick={() => setTextColor(color)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all ${
                            textColor === color
                              ? 'bg-orange-500/20 ring-2 ring-orange-500'
                              : 'bg-zinc-800 hover:bg-zinc-700'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full border border-zinc-600"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-white">{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-zinc-500">הטקסט יופיע על המוקאפ בלבד (לא על המוצר הסופי)</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-3">בחר צבע מוצר</label>
                <div className="flex gap-2 flex-wrap mb-6">
                  {[
                    { color: 'white', hex: '#FFFFFF', name: 'לבן' },
                    { color: 'black', hex: '#000000', name: 'שחור' },
                    { color: 'gray', hex: '#9CA3AF', name: 'אפור' },
                    { color: 'blue', hex: '#3B82F6', name: 'כחול' },
                    { color: 'red', hex: '#EF4444', name: 'אדום' },
                    { color: 'green', hex: '#10B981', name: 'ירוק' },
                    { color: 'yellow', hex: '#F59E0B', name: 'צהוב' },
                    { color: 'pink', hex: '#EC4899', name: 'ורוד' }
                  ].map(({ color, hex, name }) => (
                    <button
                      key={color}
                      onClick={() => setShirtColor(color)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-sm border-2 transition-all ${
                        shirtColor === color
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-zinc-600"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-white text-sm">{name}</span>
                    </button>
                  ))}
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
                    <SelectItem value="mug">ספל קפה (₪59)</SelectItem>
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
                  disabled={isGeneratingMockup || isProcessingAI}
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
                <div className="relative w-full h-full">
                  <motion.img
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    src={mockupUrl}
                    alt="AI Generated Mockup"
                    className="w-full h-full object-cover"
                  />
                  
                  {overlayText.trim() && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute left-1/2 -translate-x-1/2"
                      style={{
                        top: `${textPositionY}%`,
                        width: '85%',
                        filter: 'brightness(0.95) contrast(1.05)',
                        mixBlendMode: 'multiply',
                        opacity: 0.95
                      }}
                    >
                      <p 
                        className="font-black text-center"
                        style={{
                          fontSize: fontSize === 'small' ? '1.25rem' : fontSize === 'large' ? '2.25rem' : '1.75rem',
                          color: textColor === 'white' ? '#F5F5F5' : 
                                 textColor === 'black' ? '#1A1A1A' :
                                 textColor === 'orange' ? '#FF6B00' :
                                 textColor === 'red' ? '#DC2626' :
                                 textColor === 'blue' ? '#2563EB' :
                                 textColor === 'yellow' ? '#F59E0B' :
                                 textColor === 'green' ? '#059669' : '#F5F5F5',
                          textShadow: textColor === 'white' || textColor === 'yellow' 
                            ? '2px 2px 4px rgba(0,0,0,0.3), 0px 1px 2px rgba(0,0,0,0.6), inset 0px -1px 1px rgba(0,0,0,0.15)' 
                            : '2px 2px 4px rgba(0,0,0,0.2), 0px 1px 2px rgba(0,0,0,0.4), inset 0px -1px 1px rgba(255,255,255,0.1)',
                          direction: /[\u0590-\u05FF]/.test(overlayText) ? 'rtl' : 'ltr',
                          letterSpacing: '0.03em',
                          fontWeight: '900',
                          fontFamily: fontFamily === 'heebo' ? 'Heebo, sans-serif' :
                                      fontFamily === 'rubik' ? 'Rubik, sans-serif' :
                                      fontFamily === 'assistant' ? 'Assistant, sans-serif' :
                                      fontFamily === 'impact' ? 'Impact, Arial Black, sans-serif' :
                                      fontFamily === 'arial' ? 'Arial Black, Arial, sans-serif' : 'Heebo, sans-serif',
                          transform: 'perspective(500px) rotateX(2deg)',
                          textRendering: 'geometricPrecision'
                        }}
                      >
                        {overlayText}
                      </p>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,0,0.1),transparent_70%)]" />
                  
                  <div className="relative text-center z-10">
                    {designImage ? (
                      <>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mb-6"
                        >
                          <div className="w-32 h-32 mx-auto mb-4 bg-zinc-800/50 backdrop-blur-sm rounded-lg border-2 border-dashed border-orange-500/30 p-4 flex items-center justify-center">
                            <img
                              src={designImage}
                              alt="עיצוב"
                              className="w-full h-full object-contain"
                              style={{
                                filter: 'drop-shadow(0 4px 12px rgba(255,107,0,0.3))',
                              }}
                            />
                          </div>
                        </motion.div>
                        <Sparkles className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                        <p className="text-white text-lg font-bold mb-2">העיצוב מוכן! 🎨</p>
                        <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                          לחץ על "צור מוקאפ מציאותי עם AI" למטה כדי לראות איך זה ייראה על המוצר
                        </p>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-16 h-16 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400 text-sm font-medium">העלה תמונה או צור עיצוב עם AI</p>
                        <p className="text-zinc-600 text-xs mt-1">המוקאפ יוצג כאן</p>
                      </>
                    )}
                  </div>
                </div>
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