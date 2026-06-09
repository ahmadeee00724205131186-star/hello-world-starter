import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClientOnly } from "@/components/ClientOnly";
import { SoundToggle } from "@/components/SoundToggle";
import { MagicCursor } from "@/components/MagicCursor";
import { FlowerScene } from "@/scenes/FlowerScene";
import { ChamberScene, type Spell } from "@/scenes/ChamberScene";
import { PatronusScene } from "@/scenes/PatronusScene";
import { LeviosaScene } from "@/scenes/LeviosaScene";
import { ExpelliarmusScene } from "@/scenes/ExpelliarmusScene";
import { LumosScene } from "@/scenes/LumosScene";
import { MessageScene } from "@/scenes/MessageScene";

type Stage = "flower" | "chamber" | Spell | "message";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Little Magical Journey · For Precious" },
      { name: "description", content: "A cinematic, hand-crafted magical experience — for the one I love." },
      { property: "og:title", content: "A Little Magical Journey" },
      { property: "og:description", content: "A cinematic, hand-crafted magical experience." },
    ],
  }),
  component: Index,
});

function Index() {
  const [stage, setStage] = useState<Stage>("flower");
  const [cast, setCast] = useState<Set<Spell>>(new Set());
  const [transitioning, setTransitioning] = useState(false);

  const go = (next: Stage) => {
    setTransitioning(true);
    setTimeout(() => { setStage(next); setTransitioning(false); }, 900);
  };

  const onSpellSelect = (s: Spell) => {
    setCast((prev) => new Set(prev).add(s));
    go(s);
  };

  const onSpellDone = () => {
    const remaining: Spell[] = (["patronus", "leviosa", "expelliarmus", "lumos"] as Spell[]).filter((s) => !cast.has(s) && s !== stage);
    if (remaining.length === 0 && cast.size + 1 >= 4) go("message");
    else go("chamber");
  };

  const restart = () => { setCast(new Set()); go("flower"); };

  return (
    <main className="fixed inset-0 vignette film-grain overflow-hidden">
      <ClientOnly fallback={<div className="absolute inset-0 flex items-center justify-center text-primary/60">Loading magic…</div>}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
            className="absolute inset-0"
          >
            {stage === "flower" && <FlowerScene onEnter={() => go("chamber")} />}
            {stage === "chamber" && <ChamberScene onSelect={onSpellSelect} />}
            {stage === "patronus" && <PatronusScene onDone={onSpellDone} />}
            {stage === "leviosa" && <LeviosaScene onDone={onSpellDone} />}
            {stage === "expelliarmus" && <ExpelliarmusScene onDone={onSpellDone} />}
            {stage === "lumos" && <LumosScene onDone={onSpellDone} />}
            {stage === "message" && <MessageScene onRestart={restart} />}
          </motion.div>
        </AnimatePresence>

        <MagicCursor />
        <SoundToggle />

        {/* Cinematic letterbox during transitions */}
        <div className={`${transitioning ? "cinematic" : ""}`}>
          <div className="letterbox-top" />
          <div className="letterbox-bottom" />
        </div>

        {/* Skip back to chamber */}
        {stage !== "flower" && stage !== "chamber" && stage !== "message" && (
          <button
            onClick={() => go("chamber")}
            className="fixed top-5 left-5 z-50 text-xs cinematic-letter-spaced text-primary/60 hover:text-primary transition-colors"
          >
            ← Chamber
          </button>
        )}
      </ClientOnly>
    </main>
  );
}
