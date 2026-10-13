import { describe, expect, it } from 'vitest';
import { applyAlg, clone, facelets, type CubeState, type Piece } from '../cube/model';
import { PASSOS, amareloEmCima, movesOf, setupOf } from './aulas';

const white = (p: Piece) => { const t = p.stickers.find(t => t.color === 'U'); return t && { n: t.n.map(v => v + 0) }; };
const at = (s: CubeState, pos: number[]) => s.find(p => p.pos.every((v, i) => v === pos[i]))!;

describe('aulas', () => {
  for (const passo of PASSOS) for (const caso of passo.casos) {
    it(`passo ${passo.n} · ${caso.nome}: a fórmula resolve a situação`, () => {
      const s = setupOf(passo, caso), meta = passo.meta();
      expect(passo.pronto(s, meta)).toBe(false);
      expect(passo.pronto(applyAlg(clone(s), caso.completa ? caso.completa.split(' ') : movesOf(caso)), meta)).toBe(true);
    });
  }

  it('o amarelo fica em cima (menos no terremoto do passo 7)', () => {
    for (const passo of PASSOS.filter(p => p.n !== 7)) for (const caso of passo.casos) expect(facelets(setupOf(passo, caso)).U[4]).toBe('D');
  });

  it('passo 1: cada situação é como o método descreve', () => {
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
  const meiosNoLugar = (s: CubeState) => {
    const c: Record<string, number[]> = {}; for (const q of s) if (q.stickers.length === 1) c[q.stickers[0].color] = q.stickers[0].n;
    return s.filter(p => p.stickers.length === 2 && !p.stickers.some(t => t.color === 'U' || t.color === 'D'))
      .filter(p => p.stickers.every(t => t.n.every((v, i) => v === c[t.color][i]))).length;
  };
  for (const passo of PASSOS) it(`passo ${passo.n}: começa no passo e cada parte avança uma peça`, () => {
    let s = demoInicio(passo);
    expect(emQuePasso(s)).toBe(passo.n);
    if (passo.n >= 5) { s = applyAlg(s, passo.demo.partes.map(x => x.m).join(' ')); expect(emQuePasso(s)).toBeGreaterThan(passo.n); return; }
    const conta = (st: CubeState) => passo.n === 1
      ? st.filter(p => p.stickers.length === 2 && white(p) && white(p)!.n[1] === 1).length
      : passo.n === 4 ? meiosNoLugar(st)
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

describe('passo 4: as situações são como o método descreve', () => {
  const p4 = PASSOS.find(p => p.n === 4)!;
  const [dir, esq, inv] = p4.casos.map(c => setupOf(p4, c));
  const semAmarelo = (p: Piece) => p.stickers.length === 2 && !p.stickers.some(t => t.color === 'U' || t.color === 'D');
  it('direita e esquerda: forma o T na frente; a cor de cima diz o lado', () => {
    for (const [s, lado] of [[dir, 'R'], [esq, 'L']] as const) {
      const e = at(s, [0, 1, 1]), f = facelets(s);
      expect(e.stickers.find(t => t.n[2] === 1)?.color).toBe(f.F[4]);
      expect(e.stickers.find(t => t.n[1] === 1)?.color).toBe(f[lado][4]);
    }
  });
  it('presa: nenhum meio sem amarelo no topo, e um meio fora do lugar no andar do meio', () => {
    expect(inv.filter(p => semAmarelo(p) && p.pos[1] === 1)).toHaveLength(0);
    const c: Record<string, number[]> = {}; for (const q of inv) if (q.stickers.length === 1) c[q.stickers[0].color] = q.stickers[0].n;
    const fora = inv.filter(p => semAmarelo(p) && !p.stickers.every(t => t.n.every((v, i) => v === c[t.color][i])));
    expect(fora).toHaveLength(1);
    expect(fora[0].pos[1]).toBe(0);
  });
});

describe('passo 5: o desenho do topo em cada situação', () => {
  const p5 = PASSOS.find(p => p.n === 5)!;
  const desenho = (s: CubeState) => s.filter(p => p.stickers.length === 2 && p.stickers.some(t => t.color === 'D' && t.n[1] === 1))
    .map(p => p.pos[2] === 1 ? '6h' : p.pos[2] === -1 ? '12h' : p.pos[0] === -1 ? '9h' : '3h').sort().join('+') || 'ponto';
  it('linha deitada, linha em pé, L às 12h e 9h, L em outro lugar e ponto', () => {
    expect(p5.casos.map(c => desenho(setupOf(p5, c)))).toEqual(['3h+9h', '12h+6h', '12h+9h', '3h+6h', 'ponto']);
  });
  it('a fórmula transforma: ponto → L, L → linha, linha → cruz', () => {
    const [linha, , L, , ponto] = p5.casos.map(c => setupOf(p5, c));
    const A = "F R U R' U' F'";
    expect(desenho(applyAlg(clone(ponto), A))).toBe('3h+6h');
    expect(desenho(applyAlg(clone(L), A))).toBe('3h+9h');
    expect(desenho(applyAlg(clone(linha), A))).toBe('12h+3h+6h+9h');
  });
});

describe('passo 6: o caminho do peixinho', () => {
  const p6 = PASSOS.find(p => p.n === 6)!;
  const SUNE = "R U R' U R U2 R'";
  const sobe = (s: CubeState) => s.filter(p => p.stickers.length === 3 && p.stickers.some(t => t.color === 'D' && t.n[1] === 1)).length;
  const olha = (s: CubeState) => { const t = at(s, [-1, 1, 1]).stickers.find(t => t.color === 'D')!.n.map(v => v + 0); return t[1] === 1 ? 'cima' : t[0] === -1 ? 'esquerda' : t[2] === 1 ? 'frente' : 'outro'; };
  it('antes de cada fórmula, o cubo está na posição que o método ensina', () => {
    for (const c of p6.casos) {
      let s = setupOf(p6, c); const ms = c.completa ? c.completa.split(' ') : movesOf(c);
      const inicio = sobe(s);
      for (let i = 0; i < ms.length; i++) {
        if (ms.slice(i, i + 7).join(' ') === SUNE) {
          const n = sobe(s), q = olha(s);
          expect(n === 1 ? q === 'cima' : n === 0 ? q === 'esquerda' : q === 'frente', `${c.id}: ${n} quinas, frente-esquerda olhando para ${q}`).toBe(true);
        }
        s = applyAlg(s, ms[i]);
      }
      expect(sobe(s)).toBe(4);
      expect([1, 1, 0, 0, 2, 2, 2][p6.casos.indexOf(c)]).toBe(inicio);
    }
  });
});

describe('passo 6: uma fórmula de cada vez', () => {
  const p6 = PASSOS.find(p => p.n === 6)!;
  const sobe = (s: CubeState) => s.filter(p => p.stickers.length === 3 && p.stickers.some(t => t.color === 'D' && t.n[1] === 1)).length;
  it('cada situação mostra uma fórmula só, e termina no peixinho ou no topo amarelo', () => {
    for (const c of p6.casos) {
      expect(c.lances.length, c.id).toBeLessThanOrEqual(8);
      const fim = applyAlg(setupOf(p6, c), movesOf(c));
      expect([1, 4], c.id).toContain(sobe(fim));
      expect(!!c.depois, c.id).toBe(sobe(fim) === 1);
    }
  });
  it('escolher uma situação parecida (mesmo número de quinas) também leva ao peixinho ou ao amarelo', () => {
    for (const real of p6.casos) for (const escolhida of p6.casos) {
      const s = setupOf(p6, real); if (sobe(s) !== sobe(setupOf(p6, escolhida))) continue;
      expect([1, 4], `${real.id} seguindo ${escolhida.id}`).toContain(sobe(applyAlg(clone(s), movesOf(escolhida))));
    }
  });
});

describe('passo 7: terremoto no prédio', () => {
  const p7 = PASSOS.find(p => p.n === 7)!;
  const A = "R U' R D2 R' U R D2 R2";
  const cor = (s: CubeState, pos: number[], n: number[]) => at(s, pos).stickers.find(t => t.n.every((v, i) => v + 0 === n[i]))!.color;
  const LADOS: Record<string, [number[], number[], number[]]> = { base: [[-1, -1, 1], [1, -1, 1], [0, -1, 0]], topo: [[-1, 1, 1], [1, 1, 1], [0, 1, 0]], dir: [[1, 1, 1], [1, -1, 1], [1, 0, 0]], esq: [[-1, 1, 1], [-1, -1, 1], [-1, 0, 0]] };
  const iguais = (s: CubeState) => Object.keys(LADOS).filter(k => { const [a, b, n] = LADOS[k]; return cor(s, a, n) === cor(s, b, n); });
  it('as situações começam com o amarelo de frente, no passo 7', () => {
    for (const c of p7.casos) { const s = setupOf(p7, c); expect(facelets(s).F[4], c.id).toBe('D'); expect(emQuePasso(s), c.id).toBe(7); }
  });
  it('o lado igual está onde a situação diz, e a fórmula sempre é feita com ele embaixo', () => {
    const onde: Record<string, string[]> = { base: ['base'], dir: ['dir'], topo: ['topo'], esq: ['esq'], nenhum: [] };
    for (const c of p7.casos) {
      let s = setupOf(p7, c);
      expect(iguais(s), c.id).toEqual(onde[c.id]);
      const ms = movesOf(c);
      for (let i = 0; i < ms.length; i++) {
        if (ms.slice(i, i + 9).join(' ') === A && c.id !== 'nenhum') expect(iguais(s), c.id).toContain('base');
        s = applyAlg(s, ms[i]);
      }
      if (c.id === 'nenhum') expect(iguais(s)).toHaveLength(1);
      else expect(emQuePasso(s), c.id).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('passo 8: arrumar os meios', () => {
  const p8 = PASSOS.find(p => p.n === 8)!;
  const DIR = "F2 U L R' F2 L' R U F2";
  const prontos = (s: CubeState) => { const f = facelets(s); return (['F', 'R', 'B', 'L'] as const).filter(k => f[k].slice(0, 3).every(c => c === f[k][4])); };
  const meioDaFrente = (s: CubeState) => { const c = facelets(s).F[4]; const p = s.find(q => q.stickers.length === 2 && q.pos[1] === 1 && q.stickers.some(t => t.color === c))!.pos; return p[0] === 1 ? 'direita' : p[0] === -1 ? 'esquerda' : 'outro'; };
  it('cada situação é como o método descreve', () => {
    const s = Object.fromEntries(p8.casos.map(c => [c.id, setupOf(p8, c)]));
    for (const c of p8.casos) expect(emQuePasso(s[c.id]), c.id).toBe(8);
    expect(prontos(s.direita)).toEqual(['B']); expect(meioDaFrente(s.direita)).toBe('direita');
    expect(prontos(s.esquerda)).toEqual(['B']); expect(meioDaFrente(s.esquerda)).toBe('esquerda');
    expect(prontos(s.nenhum)).toEqual([]);
    expect(prontos(s.virar)).toHaveLength(1); expect(prontos(s.virar)).not.toContain('B');
  });
  it('depois de cada situação: lado pronto atrás, ou cubo montado', () => {
    for (const c of p8.casos) {
      const fim = applyAlg(setupOf(p8, c), movesOf(c));
      if (c.depois) expect(prontos(fim).length, c.id).toBeGreaterThan(0);
      else expect(emQuePasso(fim), c.id).toBe(9);
    }
  });
  it('sem nenhum lado pronto, uma fórmula sempre faz aparecer um', () => {
    let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const T = ['', 'y', 'y2', "y'"]; let vistos = 0;
    for (let i = 0; i < 400; i++) {
      let s = amareloEmCima();
      for (let j = 0; j < 3; j++) s = applyAlg(s, `${T[Math.floor(rnd() * 4)]} ${rnd() < .5 ? DIR : "F2 U' L R' F2 L' R U' F2"}`.trim());
      if (prontos(s).length) continue;
      vistos++;
      expect(prontos(applyAlg(clone(s), DIR)).length).toBeGreaterThan(0);
    }
    expect(vistos).toBeGreaterThan(10);
  });
});
