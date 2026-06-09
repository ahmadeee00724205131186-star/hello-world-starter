import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { setAudioEnabled } from "@/lib/audio";

export function SoundToggle() {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => { const n = !on; setOn(n); setAudioEnabled(n); }}
      className="fixed top-5 right-5 z-50 size-11 rounded-full border border-primary/30 bg-background/40 backdrop-blur-md flex items-center justify-center text-primary/90 hover:text-primary hover:border-primary/60 hover:bg-background/60 transition-all"
      aria-label={on ? "Mute" : "Unmute"}
    >
      {on ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
