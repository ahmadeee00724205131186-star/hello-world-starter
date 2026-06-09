import { useEffect, useRef } from "react";

export function MagicCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = trail.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    const particles: { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; hue: number }[] = [];
    let mx = w / 2, my = h / 2, lx = mx, ly = my;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX; my = e.clientY;
      const dx = mx - lx, dy = my - ly;
      const dist = Math.hypot(dx, dy);
      const count = Math.min(4, Math.floor(dist / 6));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: mx + (Math.random() - 0.5) * 4,
          y: my + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6 - 0.3,
          life: 0, max: 40 + Math.random() * 40,
          size: 1 + Math.random() * 2.4,
          hue: 35 + Math.random() * 20,
        });
      }
      lx = mx; ly = my;
    };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx; p.y += p.vy; p.vy -= 0.01;
        const a = 1 - p.life / p.max;
        if (a <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
        g.addColorStop(0, `hsla(${p.hue}, 90%, 75%, ${a})`);
        g.addColorStop(1, `hsla(${p.hue}, 90%, 60%, 0)`);
        ctx.fillStyle = g;
        ctx.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (dot.current) dot.current.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
      if (ring.current) {
        const rx = parseFloat(ring.current.dataset.x || `${mx}`);
        const ry = parseFloat(ring.current.dataset.y || `${my}`);
        const nx = rx + (mx - rx) * 0.12;
        const ny = ry + (my - ry) * 0.12;
        ring.current.dataset.x = `${nx}`; ring.current.dataset.y = `${ny}`;
        ring.current.style.transform = `translate3d(${nx - 18}px, ${ny - 18}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <>
      <canvas ref={trail} className="fixed inset-0 pointer-events-none z-[60]" />
      <div ref={ring} className="fixed top-0 left-0 size-9 rounded-full border border-primary/60 pointer-events-none z-[61] mix-blend-screen" />
      <div ref={dot} className="fixed top-0 left-0 size-1.5 rounded-full bg-primary pointer-events-none z-[62] shadow-[0_0_12px_oklch(0.82_0.14_65)]" />
    </>
  );
}
