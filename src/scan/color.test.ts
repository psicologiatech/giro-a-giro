import { describe, it, expect } from 'vitest';
import { applyAlg, facelets, randomScramble, solved, FACES, type Face } from '../cube/model';
import { classify, type RGB } from './color';

// cores "de foto": vermelho e laranja próximos, branco puxando para o amarelado
const PHOTO: Record<Face, RGB> = { U: [215, 212, 200], D: [225, 200, 40], F: [30, 150, 80], B: [30, 80, 190], R: [190, 40, 40], L: [230, 105, 35] };

function rng(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); }

describe('classificação das cores', () => {
  it('acerta todas as cores com luz amarelada e ruído', () => {
    const r = rng(7);
    let erros = 0;
    for (let t = 0; t < 100; t++) {
      const f = facelets(applyAlg(solved(), randomScramble(25, r)));
      const tint: RGB = [1.08, 1.0, 0.82]; // luz de lâmpada amarela
      const samples = Object.fromEntries(FACES.map(face => [face, f[face].map(c => {
        const base = PHOTO[c]; const shade = 0.8 + r() * 0.35;
        return base.map((v, k) => Math.max(0, Math.min(255, Math.round(v * tint[k] * shade + (r() - 0.5) * 24)))) as RGB;
      })])) as Record<Face, RGB[]>;
      const got = classify(samples);
      for (const face of FACES) got[face].forEach((c, i) => { if (c !== f[face][i]) erros++; });
    }
    expect(erros).toBe(0);
  });
});
