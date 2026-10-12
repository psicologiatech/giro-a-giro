import { describe, expect, it } from 'vitest';
import { applyAlg, clone, randomScramble, solved } from '../cube/model';
import { PASSOS, amareloEmCima, setupOf } from './aulas';
import { emQuePasso, marcarAte, passoAtual } from './progresso';

describe('em que passo está o cubo', () => {
  it('montado é 9, em qualquer posição', () => {
    expect(emQuePasso(solved())).toBe(9);
    expect(emQuePasso(amareloEmCima())).toBe(9);
    expect(emQuePasso(applyAlg(solved(), 'x y2'))).toBe(9);
  });
  it('as situações de cada aula caem no passo certo', () => {
    for (const p of PASSOS) for (const c of p.casos) expect(emQuePasso(setupOf(p, c)), `${p.n} ${c.id}`).toBe(p.n);
  });
  it('cubo embaralhado começa no passo 1', () => {
    let r = 7; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 50; i++) expect(emQuePasso(applyAlg(solved(), randomScramble(25, rnd)))).toBe(1);
  });
  it('cada etapa seguinte do método', () => {
    const z = amareloEmCima();
    expect(emQuePasso(applyAlg(clone(z), "U R U' R' U' F' U F U"))).toBe(4);   // meio da 2ª camada fora
    expect(emQuePasso(applyAlg(clone(z), "F R U R' U' F'"))).toBe(5);           // estraga a cruz amarela
    expect(emQuePasso(applyAlg(clone(z), "R U R' U R U2 R'"))).toBe(6);         // Sune: quinas amarelas viradas
    expect(emQuePasso(applyAlg(clone(z), "F2 U L R' F2 L' R U F2"))).toBe(8);  // só os meios trocados
  });
  it('progresso: o passo da vez é o primeiro não feito', () => {
    expect(passoAtual([])).toBe(0);
    expect(passoAtual(marcarAte([], 0))).toBe(1);
    expect(passoAtual(marcarAte([], 2))).toBe(3);
    expect(passoAtual(marcarAte([], 8))).toBe(9);
  });
});
