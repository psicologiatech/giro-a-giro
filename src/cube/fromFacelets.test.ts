import { describe, it, expect } from 'vitest';
import { applyAlg, facelets, randomScramble, solved, type Facelets } from './model';
import { fromFacelets } from './fromFacelets';

const copy = (f: Facelets): Facelets => JSON.parse(JSON.stringify(f));

describe('montar o cubo a partir das cores', () => {
  it('aceita embaralhamentos reais e reconstrói as mesmas cores', () => {
    for (let i = 0; i < 300; i++) {
      const f = facelets(applyAlg(solved(), randomScramble(25)));
      const r = fromFacelets(f);
      expect(r.ok).toBe(true);
      if (r.ok) expect(facelets(r.state)).toEqual(f);
    }
  });
  it('recusa contagem errada de cores', () => {
    const f = copy(facelets(solved())); f.F[0] = 'R';
    const r = fromFacelets(f);
    expect(r.ok).toBe(false); if (!r.ok) expect(r.reason).toBe('contagem');
  });
  it('recusa um canto torcido', () => {
    const f = copy(facelets(solved()));
    // canto de cima, frente, direita: U[8], F[2], R[0] — gira as três cores
    [f.U[8], f.F[2], f.R[0]] = [f.F[2], f.R[0], f.U[8]];
    const r = fromFacelets(f);
    expect(r.ok).toBe(false); if (!r.ok) expect(r.reason).toBe('canto');
  });
  it('recusa um meio virado', () => {
    const f = copy(facelets(solved()));
    [f.U[7], f.F[1]] = [f.F[1], f.U[7]];
    const r = fromFacelets(f);
    expect(r.ok).toBe(false); if (!r.ok) expect(r.reason).toBe('meio');
  });
  it('recusa duas peças trocadas', () => {
    const f = copy(facelets(solved()));
    // troca os meios UF e UR
    [f.U[7], f.U[5]] = [f.U[5], f.U[7]];
    [f.F[1], f.R[1]] = [f.R[1], f.F[1]];
    const r = fromFacelets(f);
    expect(r.ok).toBe(false); if (!r.ok) expect(r.reason).toBe('paridade');
  });
});
