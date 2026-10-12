import { describe, it, expect } from 'vitest';
import { applyAlg, clone, isSolvedAnyWay, randomScramble, solved } from './model';
import { solve } from './solver';

function rng(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); }

describe('resolvedor pelo método das camadas', () => {
  it('monta 3000 cubos embaralhados', () => {
    const r = rng(42);
    let total = 0, maxMoves = 0, maxChunks = 0;
    for (let i = 0; i < 3000; i++) {
      const s = applyAlg(solved(), randomScramble(25, r));
      const chunks = solve(s);
      const t = clone(s);
      for (const c of chunks) applyAlg(t, c.moves);
      expect(isSolvedAnyWay(t)).toBe(true);
      const n = chunks.reduce((a, c) => a + c.moves.length, 0);
      total += n; maxMoves = Math.max(maxMoves, n); maxChunks = Math.max(maxChunks, chunks.length);
    }
    console.log(`média de giros: ${(total / 3000).toFixed(0)} · máximo: ${maxMoves} · lances no máximo: ${maxChunks}`);
  }, 120000);
  it('cubo já montado não pede nenhum giro', () => {
    expect(solve(solved()).length).toBe(0);
  });
});
