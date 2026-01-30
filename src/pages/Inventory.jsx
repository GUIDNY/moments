import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Edit, Trash2, Loader2, Save, X, Upload, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';

export default function Inventory() {
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setEditingProduct(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setEditingProduct(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const handleFileUpload = async (file, type) => {
    if (type === 'image') setUploadingImage(true);
    if (type === 'video') setUploadingVideo(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      if (type === 'image') setUploadingImage(false);
      if (type === 'video') setUploadingVideo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      image_url: formData.get('image_url'),
      video_url: formData.get('video_url'),
      category: formData.get('category'),
      product_type: formData.get('product_type'),
      event_date: formData.get('event_date'),
      drop_ends: formData.get('drop_ends'),
      stock_status: formData.get('stock_status'),
      is_trending: formData.get('is_trending') === 'true',
      show_on_homepage: formData.get('show_on_homepage') === 'true',
      sizes: formData.get('sizes').split(',').map(s => s.trim()),
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCategoryLabel = (cat) => {
    const labels = { sport: 'ספורט', politics: 'פוליטיקה', viral: 'ויראלי', reality: 'ריאליטי' };
    return labels[cat] || cat;
  };

  const getTypeLabel = (type) => {
    const labels = { tshirt: 'חולצה', hoodie: 'קפוצ\'ון', cap: 'כובע' };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-zinc-900" dir="rtl">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">ניהול מלאי</h1>
            <p className="text-zinc-400">עדכן והוסף מוצרים חדשים לחנות</p>
          </div>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setShowForm(!showForm);
            }}
            className="bg-orange-500 hover:bg-orange-400 text-zinc-900 font-bold"
          >
            <Plus className="w-5 h-5 ml-2" />
            מוצר חדש
          </Button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <form onSubmit={handleSubmit} className="bg-zinc-800 rounded-sm p-6 border-2 border-zinc-700">
                <h3 className="text-xl font-bold text-white mb-6">
                  {editingProduct ? 'עריכת מוצר' : 'מוצר חדש'}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">שם המוצר *</label>
                    <Input
                      name="name"
                      defaultValue={editingProduct?.name}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">מחיר (₪) *</label>
                    <Input
                      name="price"
                      type="number"
                      defaultValue={editingProduct?.price}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm text-zinc-400 mb-2 block">תיאור</label>
                  <Textarea
                    name="description"
                    defaultValue={editingProduct?.description}
                    className="bg-zinc-900 border-zinc-700 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">קטגוריה *</label>
                    <Select name="category" defaultValue={editingProduct?.category || 'sport'}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sport">ספורט</SelectItem>
                        <SelectItem value="reality">ריאליטי</SelectItem>
                        <SelectItem value="politics">פוליטיקה</SelectItem>
                        <SelectItem value="viral">ויראלי</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">סוג מוצר *</label>
                    <Select name="product_type" defaultValue={editingProduct?.product_type || 'tshirt'}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tshirt">חולצה</SelectItem>
                        <SelectItem value="hoodie">קפוצ'ון</SelectItem>
                        <SelectItem value="cap">כובע</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">מצב מלאי</label>
                    <Select name="stock_status" defaultValue={editingProduct?.stock_status || 'in_stock'}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_stock">במלאי</SelectItem>
                        <SelectItem value="low_stock">מלאי נמוך</SelectItem>
                        <SelectItem value="sold_out">אזל</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">טרנדי?</label>
                    <Select name="is_trending" defaultValue={editingProduct?.is_trending ? 'true' : 'false'}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">כן</SelectItem>
                        <SelectItem value="false">לא</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">מידות (מופרד בפסיקים)</label>
                    <Input
                      name="sizes"
                      defaultValue={editingProduct?.sizes?.join(', ') || 'S, M, L, XL'}
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">תאריך אירוע</label>
                    <Input
                      name="event_date"
                      defaultValue={editingProduct?.event_date}
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">סגירת דרופ</label>
                    <Input
                      name="drop_ends"
                      type="datetime-local"
                      defaultValue={editingProduct?.drop_ends?.slice(0, 16)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">תמונה</label>
                    <div className="flex gap-2">
                      <Input
                        name="image_url"
                        type="url"
                        defaultValue={editingProduct?.image_url}
                        placeholder="URL תמונה"
                        className="bg-zinc-900 border-zinc-700 text-white flex-1"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await handleFileUpload(file, 'image');
                              if (url) e.target.form.image_url.value = url;
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </Button>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">סרטון</label>
                    <div className="flex gap-2">
                      <Input
                        name="video_url"
                        type="url"
                        defaultValue={editingProduct?.video_url}
                        placeholder="URL סרטון"
                        className="bg-zinc-900 border-zinc-700 text-white flex-1"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await handleFileUpload(file, 'video');
                              if (url) e.target.form.video_url.value = url;
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                          disabled={uploadingVideo}
                        >
                          {uploadingVideo ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Video className="w-4 h-4" />
                          )}
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      name="show_on_homepage"
                      value="true"
                      defaultChecked={editingProduct?.show_on_homepage}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500"
                    />
                    <span>הצג מוצר זה בדף הבית</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-400 text-zinc-900 font-bold">
                    <Save className="w-4 h-4 ml-2" />
                    שמור
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProduct(null);
                    }}
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4 ml-2" />
                    ביטול
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-zinc-800 rounded-sm border-2 border-zinc-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900 border-b border-zinc-700">
                  <tr>
                    <th className="text-right p-4 text-sm font-bold text-zinc-400">מוצר</th>
                    <th className="text-right p-4 text-sm font-bold text-zinc-400">קטגוריה</th>
                    <th className="text-right p-4 text-sm font-bold text-zinc-400">מחיר</th>
                    <th className="text-right p-4 text-sm font-bold text-zinc-400">מלאי</th>
                    <th className="text-right p-4 text-sm font-bold text-zinc-400">סטטוס</th>
                    <th className="text-right p-4 text-sm font-bold text-zinc-400">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-zinc-700 hover:bg-zinc-700/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center">
                              <Package className="w-6 h-6 text-zinc-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white">{product.name}</div>
                            <div className="text-xs text-zinc-500">{getTypeLabel(product.product_type)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-zinc-700 text-zinc-300">
                          {getCategoryLabel(product.category)}
                        </Badge>
                      </td>
                      <td className="p-4 text-white font-bold">₪{product.price}</td>
                      <td className="p-4 text-zinc-400 text-sm">{product.sizes?.join(', ')}</td>
                      <td className="p-4">
                        <Badge className={
                          product.stock_status === 'sold_out' ? 'bg-red-500/20 text-red-400' :
                          product.stock_status === 'low_stock' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-green-500/20 text-green-400'
                        }>
                          {product.stock_status === 'sold_out' ? 'אזל' :
                           product.stock_status === 'low_stock' ? 'מלאי נמוך' : 'במלאי'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProduct(product);
                              setShowForm(true);
                            }}
                            className="border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteMutation.mutate(product.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}