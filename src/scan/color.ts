import type { Face } from '../cube/model';

/**
 * Cores lidas da câmera. A luz muda tudo, então não comparamos com cores "de fábrica":
 * cada adesivo é comparado com os 6 centros lidos do próprio cubo, na mesma luz.
 */
export type RGB = [number, number, number];
export type Lab = [number, number, number];

export function rgbToLab([r, g, b]: RGB): Lab {
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const R = lin(r), G = lin(g), B = lin(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** distância entre cores; a claridade pesa menos que o tom, porque sombra e reflexo mexem nela */
export function dist(a: Lab, b: Lab): number {
  return Math.hypot((a[0] - b[0]) * 0.5, a[1] - b[1], a[2] - b[2]);
}

/** média robusta de um quadradinho da imagem (ignora pontos de brilho e sombra) */
export function samplePatch(data: Uint8ClampedArray, width: number, cx: number, cy: number, r: number): RGB {
  const px: RGB[] = [];
  for (let y = Math.round(cy - r); y <= cy + r; y += 2) for (let x = Math.round(cx - r); x <= cx + r; x += 2) {
    const i = (y * width + x) * 4;
    px.push([data[i], data[i + 1], data[i + 2]]);
  }
  px.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
  const mid = px.slice(Math.floor(px.length * 0.2), Math.ceil(px.length * 0.8)) as RGB[];
  const avg = [0, 0, 0] as RGB;
  for (const p of mid) { avg[0] += p[0]; avg[1] += p[1]; avg[2] += p[2]; }
  return avg.map(v => Math.round(v / Math.max(1, mid.length))) as RGB;
}

/** lê a grade 3×3 de uma imagem quadrada; a grade ocupa `frac` do lado, centralizada */
export function sampleGrid(data: Uint8ClampedArray, size: number, frac = 0.72): RGB[] {
  const g = size * frac, start = (size - g) / 2, cell = g / 3, r = cell * 0.18;
  const out: RGB[] = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++)
    out.push(samplePatch(data, size, start + cell * (col + 0.5), start + cell * (row + 0.5), r));
  return out;
}

/**
 * Classifica os 54 adesivos comparando com os centros. Depois equilibra para cada cor ter 9:
 * quando uma cor sobra, o adesivo mais "em dúvida" passa para a segunda cor mais parecida que esteja faltando.
 * (É o que separa vermelho de laranja na maioria das luzes.)
 */
export function classify(samples: Record<Face, RGB[]>): Record<Face, Face[]> {
  const faces = Object.keys(samples) as Face[];
  let centers = Object.fromEntries(faces.map(f => [f, rgbToLab(samples[f][4])])) as Record<Face, Lab>;
  type Item = { face: Face; i: number; lab: Lab; color: Face };
  const items: Item[] = [];
  for (const f of faces) samples[f].forEach((rgb, i) => items.push({ face: f, i, lab: rgbToLab(rgb), color: f }));
  // algumas rodadas: classifica, equilibra, e recalcula cada cor pela média dos seus 9 adesivos
  for (let round = 0; round < 4; round++) {
    for (const it of items) if (it.i !== 4)
      it.color = faces.reduce((best, c) => (dist(it.lab, centers[c]) < dist(it.lab, centers[best]) ? c : best), faces[0]);
    balance(items, faces, centers);
    centers = Object.fromEntries(faces.map(c => {
      const m = items.filter(it => it.color === c);
      return [c, [0, 1, 2].map(k => m.reduce((s, it) => s + it.lab[k], 0) / Math.max(1, m.length)) as Lab];
    })) as Record<Face, Lab>;
  }
  const out = Object.fromEntries(faces.map(f => [f, Array(9).fill(f)])) as Record<Face, Face[]>;
  for (const it of items) out[it.face][it.i] = it.color;
  return out;
}

function balance(items: { i: number; lab: Lab; color: Face }[], faces: Face[], centers: Record<Face, Lab>) {
  for (let guard = 0; guard < 200; guard++) {
    const count = (c: Face) => items.filter(it => it.color === c).length;
    const over = faces.filter(c => count(c) > 9), under = faces.filter(c => count(c) < 9);
    if (!over.length || !under.length) break;
    let best: { it: (typeof items)[number]; to: Face; cost: number } | null = null;
    for (const it of items) {
      if (it.i === 4 || !over.includes(it.color)) continue;
      for (const to of under) {
        const cost = dist(it.lab, centers[to]) - dist(it.lab, centers[it.color]);
        if (!best || cost < best.cost) best = { it, to, cost };
      }
    }
    if (!best) break;
    best.it.color = best.to;
  }
}

/** centros parecidos demais: sinal de luz ruim ou face lida duas vezes */
export function similarCenters(samples: Partial<Record<Face, RGB[]>>): [Face, Face] | null {
  const fs = (Object.keys(samples) as Face[]).filter(f => samples[f]);
  for (let a = 0; a < fs.length; a++) for (let b = a + 1; b < fs.length; b++)
    if (dist(rgbToLab(samples[fs[a]]![4]), rgbToLab(samples[fs[b]]![4])) < 12) return [fs[a], fs[b]];
  return null;
}
