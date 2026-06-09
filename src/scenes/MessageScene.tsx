import { motion } from "framer-motion";

export function MessageScene({ onRestart }: { onRestart: () => void }) {
  const lines = [
    "For My Precious Rubyduby ❤️",
    "Every spell I ever knew",
    "was practice for loving you.",
    "Happy Birthday, my love.",
  ];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, letterSpacing: "0.5em" }}
        animate={{ opacity: 1, letterSpacing: "0.25em" }}
        transition={{ duration: 2.6 }}
        className="cinematic-letter-spaced text-[10px] text-primary/70 mb-10"
      >
        Forever Mine
      </motion.div>
      {lines.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 2.2, delay: 0.8 + i * 1.8, ease: [0.7, 0, 0.2, 1] }}
          className={
            i === 0
              ? "script text-3xl md:text-5xl text-primary shimmer leading-tight max-w-3xl mb-6"
              : "script text-3xl md:text-5xl text-foreground shimmer leading-tight max-w-3xl"
          }
        >
          {l}
        </motion.div>
      ))}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 9, duration: 1.4 }}
        onClick={onRestart}
        className="mt-16 px-8 py-3 border border-primary/40 bg-background/30 backdrop-blur-md rounded-full text-primary cinematic-letter-spaced text-xs hover:bg-background/60 hover:border-primary transition-all pointer-events-auto"
      >
        ✦ Begin Again ✦
      </motion.button>
    </div>
  );
}
