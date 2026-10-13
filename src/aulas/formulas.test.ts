import { describe, expect, it } from 'vitest';
import { applyAlg, solved, type CubeState } from '../cube/model';
import { amareloEmCima } from './aulas';
import { FORMULAS } from './formulas';

/** peças que saíram do lugar (comparando com os centros, vale em qualquer posição) */
const fora = (s: CubeState) => {
  const c: Record<string, number[]> = {}; for (const p of s) if (p.stickers.length === 1) c[p.stickers[0].color] = p.stickers[0].n;
  return s.filter(p => !p.stickers.every(t => t.n.every((v, i) => v === c[t.color][i])));
};
const base = (f: { segurar: string }) => f.segurar === 'amarelo de frente' ? applyAlg(amareloEmCima(), "x'") : amareloEmCima();
const get = (nome: string) => FORMULAS.find(f => f.nome.startsWith(nome))!;

describe('o nome de cada fórmula confere com o que ela faz', () => {
  it('A-perm: troca de lugar 3 quinas e nada mais', () => {
    const f = get('A-perm'); const m = fora(applyAlg(base(f), f.alg));
    expect(m).toHaveLength(3); expect(m.every(p => p.stickers.length === 3)).toBe(true);
  });
  it('U-perm: troca de lugar 3 meios e nada mais', () => {
    for (const f of FORMULAS.filter(f => f.nome.startsWith('U-perm'))) {
      const m = fora(applyAlg(base(f), f.alg));
      expect(m).toHaveLength(3); expect(m.every(p => p.stickers.length === 2)).toBe(true);
    }
  });
  it('Sune e cruz amarela: mexem só na camada amarela', () => {
    for (const nome of ['Sune', 'Cruz amarela']) { const f = get(nome); expect(fora(applyAlg(base(f), f.alg)).every(p => p.pos[1] === 1), nome).toBe(true); }
  });
  it('segunda camada: mexe só no topo e em um meio do andar do meio', () => {
    for (const f of FORMULAS.filter(f => f.passo === 4)) {
      const m = fora(applyAlg(base(f), f.alg));
      expect(m.filter(p => p.pos[1] !== 1)).toHaveLength(1);
    }
  });
  it('sexy move: seis vezes seguidas volta ao começo', () => {
    expect(fora(applyAlg(solved(), Array(6).fill("R U R' U'").join(' ')))).toHaveLength(0);
  });
});
