import { describe, expect, it } from 'vitest';
import { escolher, intercalar, nivelDe, passoDominado, passosDoPlano, responder, SITUACOES, type Revisao } from './revisao';

const dia = new Date('2026-10-13T10:00:00');
let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('revisão espaçada', () => {
  it('tem as situações dos passos 1 a 8', () => {
    expect(SITUACOES.length).toBeGreaterThan(25);
    expect(new Set(SITUACOES.map(s => s.passo.n))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8]));
  });
  it('acertou sobe de nível e demora mais para voltar; errou desce um nível', () => {
    let r: Revisao = {};
    expect(nivelDe(r, '6.peixe')).toBe(1);
    r = responder(r, '6.peixe', true, dia); expect(r['6.peixe']).toMatchObject({ caixa: 1, proxima: '2026-10-14' });
    r = responder(r, '6.peixe', true, dia); expect(r['6.peixe']).toMatchObject({ caixa: 2, proxima: '2026-10-15' });
    r = responder(r, '6.peixe', true, dia); expect(r['6.peixe']).toMatchObject({ caixa: 3, proxima: '2026-10-17' });
    r = responder(r, '6.peixe', false, dia); expect(r['6.peixe']).toMatchObject({ caixa: 2, proxima: '2026-10-15' });
    r = responder(r, '6.peixe', false, dia); r = responder(r, '6.peixe', false, dia); expect(r['6.peixe'].caixa).toBe(1);
  });
  it('o plano é uma escada: começa no passo 1 e abre o próximo quando o atual chega ao nível 2', () => {
    const todos = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(passosDoPlano({}, [0])).toEqual([]);
    expect(passosDoPlano({}, todos)).toEqual([1]);
    const nivel2 = (n: number): Revisao => Object.fromEntries(SITUACOES.filter(s => s.passo.n === n).map(s => [s.id, { caixa: 2, proxima: '2026-10-20', visto: 1 }]));
    expect(passosDoPlano(nivel2(1), todos)).toEqual([1, 2]);
    expect(passosDoPlano({ ...nivel2(1), ...nivel2(2) }, todos)).toEqual([1, 2, 3]);
    expect(passosDoPlano({ ...nivel2(1), ...nivel2(2) }, [0, 1, 2])).toEqual([1, 2]);   // o 3 só entra depois de feito na trilha
    const e = escolher({}, 5, dia, rnd, [3]);
    expect(e.length).toBe(4);   // o passo 3 tem 4 situações
    expect(e.every(id => id.startsWith('3.'))).toBe(true);
  });
  it('passo dominado: todas as situações no nível 5', () => {
    const ids = SITUACOES.filter(s => s.passo.n === 3).map(s => s.id);
    const r: Revisao = Object.fromEntries(ids.map(id => [id, { caixa: 5, proxima: '2026-11-01', visto: 1 }]));
    expect(passoDominado(r, 3)).toBe(true);
    expect(passoDominado({ ...r, [ids[0]]: { caixa: 4, proxima: '', visto: 1 } }, 3)).toBe(false);
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
