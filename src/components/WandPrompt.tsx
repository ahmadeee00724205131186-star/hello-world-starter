import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sparkle, whoosh } from "@/lib/audio";

/**
 * Pre-spell interactive wand gate. Lightweight DOM/SVG overlay (no extra Canvas)
 * so it stays smooth and crisp on every device.
 */
export function WandPrompt({
  onCast,
  spellLabel,
  hint = "Tap the wand to cast",
}: {
  onCast: () => void;
  spellLabel: string;
  hint?: string;
}) {
  const [casting, setCasting] = useState(false);

  const handle = () => {
    if (casting) return;
    setCasting(true);
    whoosh();
    sparkle(1.4);
    setTimeout(() => sparkle(1.8), 220);
    setTimeout(() => sparkle(0.9), 420);
    setTimeout(onCast, 1100);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="wand-prompt"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.9 }}
        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/55 backdrop-blur-[2px]"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="cinematic-letter-spaced text-[10px] tracking-[0.35em] text-primary/70 mb-2"
        >
          {spellLabel}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.5 }}
          className="script text-3xl md:text-4xl text-foreground shimmer mb-10 text-center px-6"
        >
          ✨ Use this spell, Precious. ✨
        </motion.div>

        <motion.button
          onClick={handle}
          initial={{ opacity: 0, rotate: -30, scale: 0.9 }}
          animate={
            casting
              ? { opacity: 1, rotate: 18, scale: 1.08 }
              : { opacity: 1, rotate: -22, scale: 1, y: [0, -8, 0] }
          }
          transition={
            casting
              ? { duration: 0.9, ease: [0.7, 0, 0.2, 1] }
              : { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }
          }
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          aria-label="Cast spell"
          className="relative size-56 md:size-72 outline-none pointer-events-auto"
        >
          {/* Aura */}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, oklch(0.85 0.16 70 / 0.45) 0%, transparent 60%)",
            }}
            animate={{ scale: casting ? [1, 1.8, 2.4] : [0.95, 1.05, 0.95], opacity: casting ? [0.9, 0.4, 0] : [0.6, 0.85, 0.6] }}
            transition={{ duration: casting ? 1 : 3.5, repeat: casting ? 0 : Infinity, ease: "easeInOut" }}
          />
          {/* Wand SVG */}
          <svg viewBox="0 0 240 240" className="absolute inset-0 m-auto drop-shadow-[0_0_18px_oklch(0.85_0.18_60/0.6)]">
            <defs>
              <linearGradient id="wandWood" x1="0" x2="1">
                <stop offset="0" stopColor="#3a1f10" />
                <stop offset="0.5" stopColor="#6b3a1f" />
                <stop offset="1" stopColor="#2a1308" />
              </linearGradient>
              <radialGradient id="tipGlow">
                <stop offset="0" stopColor="#fff1c8" stopOpacity="1" />
                <stop offset="0.5" stopColor="#ffc070" stopOpacity="0.85" />
                <stop offset="1" stopColor="#ff8030" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* shaft */}
            <g transform="rotate(35 120 120)">
              <rect x="60" y="116" width="125" height="8" rx="3" fill="url(#wandWood)" />
              {/* engravings */}
              <g stroke="#1a0a04" strokeWidth="0.7" opacity="0.7">
                <line x1="80" y1="116" x2="80" y2="124" />
                <line x1="100" y1="116" x2="100" y2="124" />
                <line x1="125" y1="116" x2="125" y2="124" />
                <line x1="150" y1="116" x2="150" y2="124" />
                <line x1="170" y1="116" x2="170" y2="124" />
              </g>
              {/* handle */}
              <rect x="58" y="113" width="14" height="14" rx="4" fill="#2a1408" />
              {/* tip glow */}
              <circle cx="188" cy="120" r={casting ? 30 : 18} fill="url(#tipGlow)">
                <animate attributeName="r" values="14;22;14" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="188" cy="120" r="3" fill="#fff8e0" />
            </g>
          </svg>
          {/* Casting particles */}
          {casting && (
            <span className="pointer-events-none absolute inset-0">
              {Array.from({ length: 14 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 size-1.5 rounded-full"
                  style={{ background: "oklch(0.92 0.16 70)", boxShadow: "0 0 10px oklch(0.92 0.16 70)" }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 14) * Math.PI * 2) * (120 + Math.random() * 60),
                    y: Math.sin((i / 14) * Math.PI * 2) * (120 + Math.random() * 60),
                    opacity: 0,
                  }}
                  transition={{ duration: 0.9, ease: [0.2, 0.7, 0.3, 1] }}
                />
              ))}
            </span>
          )}
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: casting ? 0 : 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-10 text-xs cinematic-letter-spaced text-muted-foreground/80"
        >
          {hint}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
