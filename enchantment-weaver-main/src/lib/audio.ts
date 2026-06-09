// Tiny WebAudio synth for ambient pads and magical sparkles — no asset files needed.
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let padStop: (() => void) | null = null;
let enabled = false;

function ensureCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

function startPad() {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const nodes: OscillatorNode[] = [];
  const freqs = [110, 164.81, 220, 277.18]; // A2 E3 A3 C#4 — gentle major-ish
  const padGain = c.createGain();
  padGain.gain.value = 0.06;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  padGain.connect(filter).connect(masterGain);
  freqs.forEach((f, i) => {
    const o = c.createOscillator();
    o.type = i === 0 ? "sine" : "triangle";
    o.frequency.value = f;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 0.1 + i * 0.05;
    lfoGain.gain.value = 0.6;
    lfo.connect(lfoGain).connect(o.frequency);
    lfo.start();
    o.connect(padGain);
    o.start();
    nodes.push(o, lfo);
  });
  padStop = () => nodes.forEach((n) => n.stop());
}

export function setAudioEnabled(on: boolean) {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  enabled = on;
  if (c.state === "suspended") c.resume();
  const target = on ? 0.5 : 0;
  masterGain.gain.cancelScheduledValues(c.currentTime);
  masterGain.gain.linearRampToValueAtTime(target, c.currentTime + 1.5);
  if (on && !padStop) startPad();
}

export function isAudioEnabled() { return enabled; }

export function sparkle(pitch = 1) {
  const c = ensureCtx();
  if (!c || !masterGain || !enabled) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  const base = 1800 * pitch;
  o.frequency.setValueAtTime(base, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(base * 2, c.currentTime + 0.25);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6);
  o.connect(g).connect(masterGain);
  o.start();
  o.stop(c.currentTime + 0.7);
}

export function whoosh() {
  const c = ensureCtx();
  if (!c || !masterGain || !enabled) return;
  const buf = c.createBuffer(1, c.sampleRate * 1.2, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) * 0.6;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(400, c.currentTime);
  f.frequency.linearRampToValueAtTime(2200, c.currentTime + 1.0);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.linearRampToValueAtTime(0.25, c.currentTime + 0.3);
  g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 1.2);
  src.connect(f).connect(g).connect(masterGain);
  src.start();
}
