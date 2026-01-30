import React from 'react';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-900" dir="rtl">
      <HeroSection />
      <Footer />
    </div>
  );
}