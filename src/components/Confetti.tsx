import { useEffect, useRef } from 'react';
import { STICKER_COLORS } from '../cube/CubeScene';

/** chuva de adesivos do cubo, uma vez */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const c = ref.current!, x = c.getContext('2d')!;
    const W = (c.width = innerWidth), H = (c.height = innerHeight);
    const cols = Object.values(STICKER_COLORS);
    const ps = Array.from({ length: 140 }, () => ({
      x: W / 2 + (Math.random() - .5) * W * .4, y: H * .4, vx: (Math.random() - .5) * 11, vy: -Math.random() * 12 - 4,
      s: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[Math.floor(Math.random() * cols.length)],
    }));
    const t0 = performance.now(); let raf = 0;
    const tick = (now: number) => {
      x.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += .32; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.strokeStyle = '#1D2140'; x.lineWidth = 2;
        x.beginPath(); x.roundRect(-p.s / 2, -p.s / 2, p.s, p.s, 3); x.fill(); x.stroke(); x.restore();
      }
      if (now - t0 < 2800) raf = requestAnimationFrame(tick); else x.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
