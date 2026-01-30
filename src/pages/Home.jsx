import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Zap, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-900" dir="rtl">
      <Navbar />
      <HeroSection />
      
      {/* About Section */}
      <section className="py-20 px-4 bg-zinc-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              לוקחים רגעים גדולים
              <br />
              <span className="text-orange-500">והופכים אותם לזיכרון</span>
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed mb-12">
              כל פעם שמשהו אגדי קורה, אנחנו כאן. מהשער שעשה את ההיסטוריה, דרך המשפט שהפך ויראלי,
              ועד לרגע שכולם ידברו עליו במשך שבועות - אנחנו מנציחים את זה על בד, כותנה ובייסבול.
              <br /><br />
              <span className="text-white font-medium">כי רגעים גדולים לא צריכים להישאר רק בזיכרון.</span>
            </p>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              {[
                {
                  icon: Camera,
                  title: 'תופסים את הרגע',
                  desc: 'כשמשהו גדול קורה, אנחנו מגיבים בזמן אמת ומדפיסים את הרגע'
                },
                {
                  icon: Zap,
                  title: 'מהדורה מוגבלת',
                  desc: 'כל דרופ זמין למספר מוגבל של ימים - ברגע שהבאזז נגמר, זה נעלם'
                },
                {
                  icon: Clock,
                  title: 'איכות פרימיום',
                  desc: 'בדי כותנה איכותיים והדפסה מקצועית שמחזיקה מעמד'
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-sm p-6"
                >
                  <div className="bg-orange-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}