import React from 'react';
import { Package, Instagram, Send, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-900 border-t-2 border-zinc-800">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-500 p-2 rounded">
                <Package className="w-6 h-6 text-zinc-900" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">MOMENTS</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              מדפיסים את ההיסטוריה בזמן אמת. דרופים בלעדיים ממהדורה מוגבלת
              מהרגעים הגדולים בספורט, בריאליטי ובאקטואליה.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-zinc-800 hover:bg-orange-500 rounded flex items-center justify-center transition-colors group">
                <Instagram className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />
              </a>
              <a href="#" className="w-10 h-10 bg-zinc-800 hover:bg-orange-500 rounded flex items-center justify-center transition-colors group">
                <Send className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />
              </a>
              <a href="#" className="w-10 h-10 bg-zinc-800 hover:bg-orange-500 rounded flex items-center justify-center transition-colors group">
                <Mail className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4">קישורים</h4>
            <ul className="space-y-2">
              {['אודות', 'שאלות נפוצות', 'מדיניות משלוחים', 'מדיניות החזרות'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-zinc-400 hover:text-orange-500 text-sm transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-4">צור קשר</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>support@moments.co.il</li>
              <li>03-1234567</li>
              <li>ראשון-חמישי: 09:00-18:00</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-800 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Moments. כל הזכויות שמורות.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <a href="#" className="hover:text-zinc-300 transition-colors">תנאי שימוש</a>
            <span>|</span>
            <a href="#" className="hover:text-zinc-300 transition-colors">מדיניות פרטיות</a>
          </div>
        </div>
      </div>
    </footer>
  );
}