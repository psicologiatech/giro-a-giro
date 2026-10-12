import { describe, it, expect } from 'vitest';
import { solved, applyAlg, isSolved, invertAlg, parseAlg, randomScramble, facelets } from './model';

describe('modelo do cubo', () => {
  it('cada giro feito 4 vezes volta ao começo', () => {
    for (const f of ['U', 'D', 'F', 'B', 'R', 'L']) expect(isSolved(applyAlg(solved(), Array(4).fill(f)))).toBe(true);
  });
  it("R U R' U' seis vezes volta ao começo", () => {
    expect(isSolved(applyAlg(solved(), Array(6).fill("R U R' U'").join(' ')))).toBe(true);
  });
  it('um embaralhamento seguido do inverso volta ao começo', () => {
    const s = randomScramble(25);
    const c = applyAlg(solved(), s);
    expect(isSolved(c)).toBe(false);
    expect(isSolved(applyAlg(c, invertAlg(s)))).toBe(true);
  });
  it('R leva a frente para cima', () => {
    const f = facelets(applyAlg(solved(), parseAlg('R')));
    expect(f.U[2]).toBe('F'); expect(f.U[8]).toBe('F');
  });
});
