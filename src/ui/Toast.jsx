import { useEffect } from 'react';
import { motion } from 'motion/react';

/**
 * One line that floats in under the header and leaves on its own. There is no
 * queue: a second message replaces the first, because two toasts are a list
 * and a list belongs in a sheet.
 */
export default function Toast({ emoji, text, onDone, ttl = 3600 }) {
  useEffect(() => {
    if (!text) return undefined;
    const timer = setTimeout(() => onDone?.(), ttl);
    return () => clearTimeout(timer);
  }, [text, ttl, onDone]);

  if (!text) return null;
  return (
    <div
      role="status"
      className="ui-layer absolute z-40 inset-x-0 top-[calc(4.25rem+env(safe-area-inset-top,0px))] md:top-24 flex justify-center pointer-events-none"
    >
      <motion.div
        key={text}
        initial={{ y: -14, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 30 }}
        className="flex items-center gap-2.5 h-12 ps-3 pe-4 rounded-full bg-white border border-paper-200 shadow-card text-ink-900"
      >
        {emoji && <span className="text-2xl leading-none">{emoji}</span>}
        <span className="text-[13.5px] font-black">{text}</span>
      </motion.div>
    </div>
  );
}
