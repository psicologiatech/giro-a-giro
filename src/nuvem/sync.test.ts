import { describe, expect, it } from 'vitest';
import { mesclar } from './sync';

describe('juntar o progresso do aparelho com o da nuvem', () => {
  it('nada se perde: passos se somam, tempos se juntam, pontos ficam com o maior', () => {
    const aparelho = { app: { xp: 120, solves: 1, lastDay: '2026-10-13', streak: 3 }, passos: [0, 1, 2], tempos: [{ ms: 90000, quando: 2, embaralhar: 'R' }] };
    const nuvem = { app: { xp: 300, solves: 2, lastDay: '2026-10-10', streak: 5 }, passos: [0, 1, 2, 3, 4], tempos: [{ ms: 80000, quando: 1, embaralhar: 'U' }, { ms: 90000, quando: 2, embaralhar: 'R' }] };
    const m = mesclar(aparelho, nuvem);
    expect(m.passos).toEqual([0, 1, 2, 3, 4]);
    expect(m.tempos?.map(t => t.quando)).toEqual([2, 1]);
    expect(m.app?.xp).toBe(300);
    expect(m.app?.solves).toBe(2);
    expect(m.app?.lastDay).toBe('2026-10-13');
    expect(m.app?.streak).toBe(3);
  });
  it('aparelho vazio recebe tudo da nuvem', () => {
    const m = mesclar({}, { passos: [0, 1], pecas: { 3: 2 }, letras: '0' });
    expect(m.passos).toEqual([0, 1]); expect(m.pecas).toEqual({ 3: 2 }); expect(m.letras).toBe('0');
  });
});
