import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Scroll-triggered reveal, disabled when the user prefers reduced motion. */
export default function Reveal({ children, delay = 0, y = 18, className = "" }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
