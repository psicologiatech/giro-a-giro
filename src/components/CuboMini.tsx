import { useMemo } from 'react';
import type { CubeState, Piece, Vec } from '../cube/model';
import { STICKER_COLORS } from '../cube/CubeScene';

const CINZA = '#7C828E';
type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };

/**
 * Um cubo desenhado (imagem leve, sem 3D): mostra topo, frente e direita,
 * ou base, frente e direita (deBaixo). Peças fora do foco ficam cinza; os centros, sempre coloridos.
 */
export function CuboMini({ estado, foco, deBaixo = false, tamanho = 120, rotulo }: {
  estado: CubeState; foco?: ((p: Piece) => boolean) | null; deBaixo?: boolean; tamanho?: number; rotulo?: string;
}) {
  const poligonos = useMemo(() => {
    const cam = norm([0.75, deBaixo ? -0.62 : 0.62, 1]);
    const right = norm(cross([0, 1, 0], cam)), up = cross(cam, right);
    const proj = (p: V3) => [dot(p, right), -dot(p, up)] as const;
    const out: { pts: string; cor: string; z: number }[] = [];
    const visivel = (n: Vec) => dot(n as V3, cam) > 0.05;
    // corpo preto de cada face visível
    for (const n of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] as V3[]) {
      if (!visivel(n)) continue;
      const [u, v] = Math.abs(n[1]) ? [[1, 0, 0], [0, 0, 1]] as V3[] : [[0, 1, 0], cross(n, [0, 1, 0])] as V3[];
      const c: V3 = [n[0] * 1.5, n[1] * 1.5, n[2] * 1.5];
      const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => proj([c[0] + u[0] * 1.5 * a + v[0] * 1.5 * b, c[1] + u[1] * 1.5 * a + v[1] * 1.5 * b, c[2] + u[2] * 1.5 * a + v[2] * 1.5 * b]));
      out.push({ pts: cs.map(p => p.map(x => x.toFixed(2)).join(',')).join(' '), cor: '#15171d', z: -1 });
    }
    for (const p of estado) for (const t of p.stickers) {
      if (!visivel(t.n)) continue;
      const n = t.n as V3;
      const [u, v] = Math.abs(n[1]) ? [[1, 0, 0], [0, 0, 1]] as V3[] : [[0, 1, 0], cross(n, [0, 1, 0])] as V3[];
      const c: V3 = [p.pos[0] * 1 + n[0] * 0.5, p.pos[1] + n[1] * 0.5, p.pos[2] + n[2] * 0.5];
      const h = 0.42;
      const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => proj([c[0] + (u[0] * a + v[0] * b) * h, c[1] + (u[1] * a + v[1] * b) * h, c[2] + (u[2] * a + v[2] * b) * h]));
      const cinza = foco && p.stickers.length > 1 && !foco(p);
      out.push({ pts: cs.map(q => q.map(x => x.toFixed(2)).join(',')).join(' '), cor: cinza ? CINZA : STICKER_COLORS[t.color], z: 0 });
    }
    return out;
  }, [estado, foco, deBaixo]);
  return (
    <svg className="cubo-mini" viewBox="-2.7 -2.85 5.4 5.7" width={tamanho} height={tamanho * 5.7 / 5.4} role={rotulo ? 'img' : undefined} aria-label={rotulo} aria-hidden={rotulo ? undefined : true}>
      {poligonos.map((q, k) => <polygon key={k} points={q.pts} fill={q.cor} stroke={q.z < 0 ? '#15171d' : 'none'} strokeWidth={q.z < 0 ? 0.14 : 0} strokeLinejoin="round" />)}
    </svg>
  );
}
