import { beforeEach, describe, expect, it } from 'vitest';
import { diasSemTreino, loadDominio, marcarTreino, naSemana, passoMaisFraco, setMeta, subir, totalEstrelas, zerarTrilha, SEI, VI, FIZ } from './dominio';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: k => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, String(v)), removeItem: k => void mem.delete(k),
    clear: () => mem.clear(), key: () => null, length: 0,
  };
});

describe('estrelas de domínio', () => {
  it('sobem e nunca descem; total de 24', () => {
    subir(3, FIZ); subir(3, VI); subir(5, SEI);
    const d = loadDominio();
    expect(d[3]).toBe(FIZ); expect(totalEstrelas(d)).toBe(5);
    expect(passoMaisFraco(d)).toBe(1);
    for (let n = 1; n <= 8; n++) subir(n, SEI);
    expect(totalEstrelas(loadDominio())).toBe(24);
  });
});

describe('constância semanal', () => {
  it('conta dias de treino de segunda a domingo e avisa quando bate a meta', () => {
    setMeta(2);
    expect(marcarTreino(new Date('2026-10-12T10:00:00'))).toBe(false);   // segunda
    expect(marcarTreino(new Date('2026-10-12T20:00:00'))).toBe(false);   // mesmo dia não conta de novo
    expect(marcarTreino(new Date('2026-10-14T10:00:00'))).toBe(true);    // quarta: bateu a meta de 2
    expect(naSemana(['2026-10-12', '2026-10-14', '2026-10-19'], new Date('2026-10-18T10:00:00'))).toBe(2); // domingo; 19 é a semana seguinte
    expect(naSemana(['2026-10-12'], new Date('2026-10-19T10:00:00'))).toBe(0); // semana nova recomeça sem "perder tudo"
  });
  it('dias sem treino', () => {
    expect(diasSemTreino([], new Date())).toBeNull();
    expect(diasSemTreino(['2026-10-01', '2026-10-10'], new Date('2026-10-13T09:00:00'))).toBe(3);
  });
});

describe('recomeçar a trilha', () => {
  it('apaga passos, peças e estrelas; mantém tempos e treino; marca quando zerou', () => {
    mem.set('giroagiro.passos.v1', '[0,1,2]'); mem.set('giroagiro.tempos.v1', '[1]');
    subir(2, SEI); marcarTreino();
    zerarTrilha();
    expect(mem.has('giroagiro.passos.v1')).toBe(false);
    expect(loadDominio()).toEqual({});
    expect(mem.get('giroagiro.tempos.v1')).toBe('[1]');
    expect(mem.has('giroagiro.treino.v1')).toBe(true);
    expect(Number(mem.get('giroagiro.zerada.v1'))).toBeGreaterThan(0);
  });
});
