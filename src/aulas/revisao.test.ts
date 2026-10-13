import { describe, expect, it } from 'vitest';
import { escolher, intercalar, responder, SITUACOES, type Revisao } from './revisao';

const dia = new Date('2026-10-13T10:00:00');
let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('revisão espaçada', () => {
  it('tem as situações dos passos 3 a 8', () => {
    expect(SITUACOES.length).toBeGreaterThan(20);
    expect(new Set(SITUACOES.map(s => s.passo.n))).toEqual(new Set([3, 4, 5, 6, 7, 8]));
  });
  it('acertou sobe de caixa e demora mais; errou volta para amanhã', () => {
    let r: Revisao = {};
    r = responder(r, '6.peixe', true, dia); expect(r['6.peixe']).toMatchObject({ caixa: 1, proxima: '2026-10-14' });
    r = responder(r, '6.peixe', true, dia); expect(r['6.peixe']).toMatchObject({ caixa: 2, proxima: '2026-10-15' });
    r = responder(r, '6.peixe', true, dia); expect(r['6.peixe']).toMatchObject({ caixa: 3, proxima: '2026-10-17' });
    r = responder(r, '6.peixe', false, dia); expect(r['6.peixe']).toMatchObject({ caixa: 1, proxima: '2026-10-14' });
  });
  it('escolhe primeiro as vencidas, depois as novas', () => {
    const r: Revisao = { '7.base': { caixa: 2, proxima: '2026-10-12', visto: 1 }, '3.direita': { caixa: 4, proxima: '2026-10-30', visto: 1 } };
    const e = escolher(r, 5, dia, rnd);
    expect(e).toHaveLength(5);
    expect(e).toContain('7.base');
    expect(e).not.toContain('3.direita');   // ainda não venceu e há novas
  });
  it('intercala: nunca duas do mesmo passo seguidas, quando dá', () => {
    const e = intercalar(['6.a', '6.b', '6.c', '3.a', '4.a']);
    for (let i = 1; i < e.length; i++) expect(e[i].split('.')[0]).not.toBe(e[i - 1].split('.')[0]);
  });
});
