import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Truck, Clock } from 'lucide-react';

export default function HeroSection() {
  const scrollToProducts = () => {
    document.getElementById('warehouse')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Industrial Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
        {/* Concrete texture overlay */}
        <div className="absolute inset-0 opacity-30" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Floating shelf visual element */}
      <motion.div 
        className="absolute left-10 top-1/4 hidden lg:block"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <div className="w-32 h-48 bg-zinc-700/50 rounded border-2 border-zinc-600 flex items-center justify-center">
          <div className="text-zinc-500 text-xs text-center font-mono">
            SKU-001<br/>
            <span className="text-orange-500">●</span> LIVE
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="absolute right-10 bottom-1/4 hidden lg:block"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <div className="w-40 h-32 bg-amber-100/10 rounded border-2 border-dashed border-amber-200/30 flex items-center justify-center">
          <Truck className="w-12 h-12 text-amber-200/40" />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Stencil-style badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/50 px-4 py-2 rounded-sm mb-8"
        >
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-orange-500 font-mono text-sm tracking-wider">דרופים חדשים כל יום</span>
        </motion.div>

        {/* Main headline - stencil style */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight"
          style={{ 
            fontFamily: "'Heebo', sans-serif",
            textShadow: '4px 4px 0 rgba(0,0,0,0.3)'
          }}
        >
          מדפיסים את ההיסטוריה.
          <br />
          <span className="text-orange-500">בזמן אמת.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          דרופים בלעדיים מהרגעים הגדולים בספורט, בריאליטי ובאקטואליה.
          <br />
          <span className="text-zinc-300 font-medium">ברגע שהבאזז נגמר – המלאי נעלם.</span>
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToProducts}
          className="group bg-orange-500 hover:bg-orange-600 text-zinc-900 font-bold text-lg px-8 py-4 rounded-sm transition-all duration-300 inline-flex items-center gap-3 shadow-lg shadow-orange-500/30"
        >
          <span>כניסה למחסן</span>
          <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
        </motion.button>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-zinc-700/50"
        >
          {[
            { label: 'דרופים פעילים', value: '12' },
            { label: 'פריטים שלופו', value: '2,847' },
            { label: 'זמן ממוצע לאזילה', value: '48 שעות' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-white font-mono">{stat.value}</div>
              <div className="text-xs md:text-sm text-zinc-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ArrowDown className="w-6 h-6 text-zinc-500" />
      </motion.div>
    </section>
  );
}