import { describe, expect, it } from 'vitest';
import { applyAlg, clone, facelets, type CubeState, type Piece } from '../cube/model';
import { PASSOS, movesOf, setupOf } from './aulas';

const white = (p: Piece) => { const t = p.stickers.find(t => t.color === 'U'); return t && { n: t.n.map(v => v + 0) }; };
const at = (s: CubeState, pos: number[]) => s.find(p => p.pos.every((v, i) => v === pos[i]))!;

describe('aulas', () => {
  for (const passo of PASSOS) for (const caso of passo.casos) {
    it(`passo ${passo.n} · ${caso.nome}: a fórmula resolve a situação`, () => {
      const s = setupOf(passo, caso), meta = passo.meta();
      expect(passo.pronto(s, meta)).toBe(false);
      expect(passo.pronto(applyAlg(clone(s), movesOf(caso)), meta)).toBe(true);
    });
  }

  it('o amarelo fica em cima em todas as situações', () => {
    for (const passo of PASSOS) for (const caso of passo.casos) expect(facelets(setupOf(passo, caso)).U[4]).toBe('D');
  });

  it('passo 1: cada situação é como o professor descreve', () => {
    const [meio, limpar, base, deitada] = PASSOS[0].casos.map(c => setupOf(PASSOS[0], c));
    expect(white(at(meio, [1, 0, 1]))?.n).toEqual([0, 0, 1]);         // no andar do meio
    expect(white(at(limpar, [1, 1, 0]))?.n).toEqual([0, 1, 0]);       // em cima já tem branco
    expect(white(at(base, [1, -1, 0]))?.n).toEqual([0, -1, 0]);       // na base, branco para a mesa
    expect(white(at(deitada, [0, 1, 1]))?.n).toEqual([0, 0, 1]);      // no topo, branco de lado
  });

  it('passo 2: no caso "bate", a cor do lado é a do centro da frente', () => {
    const s = setupOf(PASSOS[1], PASSOS[1].casos[0]);
    const e = at(s, [0, 1, 1]);
    expect(white(e)?.n).toEqual([0, 1, 0]);
    expect(e.stickers.find(t => t.n[2] === 1)?.color).toBe(facelets(s).F[4]);
  });

  it('passo 3: janelas à direita, à esquerda, no telhado e quina errada', () => {
    const [dir, esq, tel, err] = PASSOS[2].casos.map(c => setupOf(PASSOS[2], c));
    expect(white(at(dir, [1, 1, 1]))?.n).toEqual([1, 0, 0]);
    expect(white(at(esq, [-1, 1, 1]))?.n).toEqual([-1, 0, 0]);
    expect(white(at(tel, [1, 1, 1]))?.n).toEqual([0, 1, 0]);
    expect(white(at(err, [1, -1, 1]))?.n).not.toEqual([0, -1, 0]);
    // a cor do lado do branco bate com o centro da frente (a quina está em cima do lugar dela)
    expect(at(dir, [1, 1, 1]).stickers.find(t => t.n[2] === 1)?.color).toBe(facelets(dir).F[4]);
    expect(at(esq, [-1, 1, 1]).stickers.find(t => t.n[2] === 1)?.color).toBe(facelets(esq).F[4]);
  });
});

import { demoInicio } from './aulas';
import { emQuePasso } from './progresso';
describe('demonstração de cada passo', () => {
  const brancosNoLugar = (s: CubeState, n: 2 | 3) => s.filter(p => p.stickers.length === n && p.stickers.some(t => t.color === 'U')).filter(p => {
    const c: Record<string, number[]> = {}; for (const q of s) if (q.stickers.length === 1) c[q.stickers[0].color] = q.stickers[0].n;
    return p.stickers.every(t => t.n.every((v, i) => v === c[t.color][i]));
  }).length;
  for (const passo of PASSOS) it(`passo ${passo.n}: começa no passo e cada parte avança uma peça`, () => {
    let s = demoInicio(passo);
    expect(emQuePasso(s)).toBe(passo.n);
    const conta = (st: CubeState) => passo.n === 1
      ? st.filter(p => p.stickers.length === 2 && white(p) && white(p)!.n[1] === 1).length
      : brancosNoLugar(st, passo.n === 2 ? 2 : 3);
    let antes = conta(s);
    for (const parte of passo.demo.partes) {
      s = applyAlg(s, parte.m);
      const agora = conta(s);
      expect(agora, parte.legenda).toBe(/vira o cubo/i.test(parte.legenda) ? antes : antes + 1);
      antes = agora;
    }
    expect(emQuePasso(s)).toBeGreaterThan(passo.n);
  });
});
