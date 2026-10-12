import { useEffect, useRef, useState } from 'react';
import { sampleGrid, type RGB } from './color';

const SIZE = 480;     // lado do quadrado analisado (pixels)
const FRAC = 0.72;    // a grade ocupa 72% do quadrado

/**
 * Mostra a câmera num quadrado com a grade 3×3 por cima.
 * As bolinhas na grade mostram, ao vivo, a cor que está sendo lida em cada quadradinho.
 */
export function Camera({ onCapture, onError, busy }: { onCapture: (rgb: RGB[]) => void; onError: (msg: string) => void; busy?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef<RGB[]>([]);
  const [ready, setReady] = useState(false);
  const [dots, setDots] = useState<RGB[]>([]);

  useEffect(() => {
    let stream: MediaStream | null = null, raf = 0, last = 0, stopped = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: 'NoCamera' });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        const v = video.current!; v.srcObject = stream; await v.play(); setReady(true);
        const ctx = canvas.current!.getContext('2d', { willReadFrequently: true })!;
        const draw = (now: number) => {
          const w = v.videoWidth, h = v.videoHeight;
          if (w && h) {
            const s = Math.min(w, h);
            ctx.drawImage(v, (w - s) / 2, (h - s) / 2, s, s, 0, 0, SIZE, SIZE);
            if (now - last > 160) {
              last = now;
              live.current = sampleGrid(ctx.getImageData(0, 0, SIZE, SIZE).data, SIZE, FRAC);
              setDots(live.current);
            }
          }
          raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
      } catch (e) {
        console.warn('câmera:', e);
        const name = (e as Error).name;
        onError(name === 'NotAllowedError'
          ? 'A câmera foi bloqueada. Você pode liberar nas permissões do navegador, ou pintar as cores tocando na tela.'
          : 'Não encontrei uma câmera neste aparelho. Você pode pintar as cores tocando na tela.');
      }
    })();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cells = Array.from({ length: 9 }, (_, i) => i);
  return (
    <div className="camera">
      <video ref={video} playsInline muted className="camera-video" />
      <canvas ref={canvas} width={SIZE} height={SIZE} className="camera-canvas" aria-label="Imagem da câmera" />
      <div className="camera-grid" style={{ ['--frac' as string]: FRAC }} aria-hidden="true">
        {cells.map(i => (
          <span key={i} className="cell">
            {dots[i] && <i style={{ background: `rgb(${dots[i].join(',')})` }} />}
          </span>
        ))}
      </div>
      {!ready && <p className="camera-wait">Abrindo a câmera…</p>}
      <button className="btn btn-pop btn-big camera-shot" disabled={!ready || busy} onClick={() => onCapture(live.current)}>Ler esta face</button>
    </div>
  );
}
