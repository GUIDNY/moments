import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Package, Download, Check, Truck, Eye, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function OrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date')
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const statusLabels = {
    pending: 'ממתין',
    sent_to_supplier: 'נשלח לספק',
    in_production: 'בייצור',
    shipped: 'נשלח ללקוח',
    delivered: 'נמסר'
  };

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    sent_to_supplier: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    in_production: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    shipped: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    delivered: 'bg-green-500/20 text-green-500 border-green-500/30'
  };

  const productTypeLabels = {
    tshirt: 'חולצה',
    hoodie: 'קפוצ\'ון',
    cap: 'כובע',
    mug: 'ספל קפה'
  };

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(blobUrl);
      a.remove();
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('שגיאה בהורדת התמונה');
    }
  };

  const createPrintReadyFile = async (imageUrl, orderId) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Set canvas size with extra space for "PRINT" label
        canvas.width = img.width;
        canvas.height = img.height + 150;
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the main image
        ctx.drawImage(img, 0, 80, img.width, img.height);
        
        // Draw "PRINT" label at top
        ctx.fillStyle = '#FF6B00';
        ctx.fillRect(0, 0, canvas.width, 80);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖨️ PRINT FILE - להדפסה', canvas.width / 2, 40);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `order_${orderId}_PRINT.jpg`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
          resolve();
        }, 'image/jpeg', 0.95);
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const handleExportForSupplier = async (order) => {
    try {
      // Use graphic_with_text_url for print file (clean graphic), fallback to design_image_url
      const printGraphicUrl = order.graphic_with_text_url || order.design_image_url;
      
      if (printGraphicUrl) {
        await createPrintReadyFile(printGraphicUrl, order.id);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      }

      // 3. Create text file with order details
      const supplierData = `
=== הזמנה #${order.id} ===

📋 פרטי לקוח:
- שם: ${order.customer_name}
- אימייל: ${order.customer_email}

👕 פרטי מוצר:
- סוג: ${productTypeLabels[order.product_type]}
- צבע: ${order.shirt_color}
- מידה: ${order.size}
- כמות: ${order.quantity}
${order.overlay_text ? `- טקסט: "${order.overlay_text}"` : ''}

📦 קבצים:
1. order_${order.id}_PRINT.jpg - עם סימון "PRINT"
2. order_${order.id}_for_printing.png ⭐ - גרפיקה + טקסט נקי (להדפסה)

📅 תאריך: ${new Date(order.created_date).toLocaleDateString('he-IL')}
${order.notes ? `\n📝 הערות: ${order.notes}` : ''}
      `.trim();

      const blob = new Blob([supplierData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order_${order.id}_details.txt`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      
      alert('הקבצים הורדו בהצלחה! ✅');
    } catch (error) {
      console.error('Error exporting for supplier:', error);
      alert('שגיאה בייצוא הקבצים');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900" dir="rtl">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-500 p-3 rounded">
              <Package className="w-6 h-6 text-zinc-900" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">ניהול הזמנות</h1>
              <p className="text-zinc-400">כל ההזמנות המעוצבות שהתקבלו</p>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="bg-zinc-800 px-4 py-2 rounded-sm border border-zinc-700">
              <span className="text-zinc-400">סה"כ הזמנות: </span>
              <span className="text-white font-bold">{orders.length}</span>
            </div>
            <div className="bg-zinc-800 px-4 py-2 rounded-sm border border-zinc-700">
              <span className="text-zinc-400">ממתינות: </span>
              <span className="text-yellow-500 font-bold">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-zinc-400 mt-4">טוען הזמנות...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-zinc-800 border-2 border-zinc-700 rounded-sm p-12 text-center">
            <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">אין הזמנות עדיין</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-800 border-2 border-zinc-700 rounded-sm p-6 hover:border-zinc-600 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="w-full md:w-48 h-48 bg-zinc-900 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={order.design_with_text_url || order.mockup_image_url || order.design_image_url}
                      alt="עיצוב"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {order.product_name}
                        </h3>
                        <p className="text-zinc-400 text-sm">
                          הזמנה מ-{new Date(order.created_date).toLocaleDateString('he-IL', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <span className="text-zinc-500">לקוח:</span>
                          <span className="text-white font-medium">{order.customer_name}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-zinc-500">אימייל:</span>
                          <span className="text-white font-medium">{order.customer_email}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-zinc-500">מוצר:</span>
                          <span className="text-white font-medium">{productTypeLabels[order.product_type]}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <span className="text-zinc-500">צבע:</span>
                          <span className="text-white font-medium">{order.shirt_color}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-zinc-500">מידה:</span>
                          <span className="text-white font-medium">{order.size}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-zinc-500">מחיר:</span>
                          <span className="text-orange-500 font-bold">₪{order.price}</span>
                        </div>
                        {order.overlay_text && (
                          <div className="flex gap-2 pt-1">
                            <span className="text-zinc-500">טקסט:</span>
                            <span className="text-orange-400 font-bold">"{order.overlay_text}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="bg-zinc-900 p-3 rounded border border-zinc-700">
                        <p className="text-zinc-400 text-sm">{order.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      {(order.graphic_with_text_url || order.design_image_url) && (
                        <Button
                          onClick={async () => {
                            const fileUrl = order.graphic_with_text_url || order.design_image_url;
                            const filename = order.graphic_with_text_url 
                              ? `order_${order.id}_graphic_with_text.png`
                              : `order_${order.id}_graphic.png`;
                            await downloadImage(fileUrl, filename);
                          }}
                          variant="outline"
                          size="sm"
                          className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 font-bold"
                        >
                          <Download className="w-4 h-4 ml-2" />
                          גרפיקה להדפסה
                        </Button>
                      )}

                      {order.design_with_text_url && (
                        <Button
                          onClick={() => downloadImage(order.design_with_text_url, `order_${order.id}_mockup.jpg`)}
                          variant="outline"
                          size="sm"
                          className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 font-bold"
                        >
                          <Download className="w-4 h-4 ml-2" />
                          ייצא עיצוב חולצה
                        </Button>
                      )}

                      <Button
                        onClick={() => handleExportForSupplier(order)}
                        variant="outline"
                        size="sm"
                        className="bg-zinc-900 border-zinc-600 hover:bg-zinc-800"
                      >
                        <Download className="w-4 h-4 ml-2" />
                        ייצא הכל לספק
                      </Button>

                      {order.design_with_text_url && (
                        <a href={order.design_with_text_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30">
                            <Eye className="w-4 h-4 ml-2" />
                            עיצוב + טקסט
                          </Button>
                        </a>
                      )}

                      <a href={order.design_image_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-600 hover:bg-zinc-800">
                          <Eye className="w-4 h-4 ml-2" />
                          עיצוב בלבד
                        </Button>
                      </a>

                      {order.mockup_image_url && (
                        <a href={order.mockup_image_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-600 hover:bg-zinc-800">
                            <Eye className="w-4 h-4 ml-2" />
                            מוקאפ
                          </Button>
                        </a>
                      )}

                      <Button
                        onClick={() => setSelectedOrder(order)}
                        variant="outline"
                        size="sm"
                        className="bg-orange-500/10 border-orange-500/30 text-orange-500 hover:bg-orange-500/20"
                      >
                        <Check className="w-4 h-4 ml-2" />
                        עדכן סטטוס
                      </Button>

                      <Button
                        onClick={() => {
                          if (confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
                            deleteOrderMutation.mutate(order.id);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        מחק
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Status Update Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-800 border-2 border-zinc-700 rounded-sm p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">עדכון סטטוס הזמנה</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">סטטוס חדש</label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => setSelectedOrder({ ...selectedOrder, status: value })}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">ממתין</SelectItem>
                      <SelectItem value="sent_to_supplier">נשלח לספק</SelectItem>
                      <SelectItem value="in_production">בייצור</SelectItem>
                      <SelectItem value="shipped">נשלח ללקוח</SelectItem>
                      <SelectItem value="delivered">נמסר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">הערות (אופציונלי)</label>
                  <Textarea
                    value={selectedOrder.notes || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, notes: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                    placeholder="הוסף הערות..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => updateOrderMutation.mutate({ 
                      id: selectedOrder.id, 
                      data: { 
                        status: selectedOrder.status, 
                        notes: selectedOrder.notes 
                      } 
                    })}
                    disabled={updateOrderMutation.isPending}
                    className="flex-1 bg-orange-500 hover:bg-orange-400 text-zinc-900"
                  >
                    {updateOrderMutation.isPending ? 'שומר...' : 'עדכן'}
                  </Button>
                  <Button
                    onClick={() => setSelectedOrder(null)}
                    variant="outline"
                    className="flex-1 bg-zinc-900 border-zinc-600"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}