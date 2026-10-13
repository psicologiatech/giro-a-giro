import { describe, expect, it } from 'vitest';
import { igual, mesclar } from './sync';

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

describe('comparar sem depender da ordem dos campos', () => {
  it('a nuvem devolve as chaves em outra ordem: continua igual (não recarrega)', () => {
    const local = { app: { xp: 365, streak: 2, lastDay: '2026-10-13', solves: 1, sound: true }, passos: [0, 1, 2], letras: '1' };
    const daNuvem = { letras: '1', passos: [0, 1, 2], app: { solves: 1, sound: true, streak: 2, xp: 365, lastDay: '2026-10-13' } };
    expect(igual(mesclar(local, {}), mesclar(local, daNuvem))).toBe(true);
  });
  it('depois de juntar e gravar, a próxima sincronização não vê mudança', () => {
    const local = { app: { xp: 10, streak: 1, lastDay: '2026-10-12', solves: 0, sound: true }, passos: [0] };
    const nuvem = { app: { solves: 2, xp: 50, lastDay: '2026-10-13', streak: 3 }, passos: [0, 1, 2], tempos: [{ quando: 5, ms: 1000, embaralhar: 'R' }] };
    const junto = mesclar(local, nuvem);
    const doAparelho = JSON.parse(JSON.stringify(junto));
    const daNuvem = { tempos: junto.tempos, passos: junto.passos, pecas: junto.pecas, app: { ...junto.app } };
    expect(igual(mesclar(doAparelho, {}), mesclar(doAparelho, daNuvem))).toBe(true);
  });
});

describe('estrelas, treino e recomeço na nuvem', () => {
  it('estrelas ficam com o maior; dias de treino se juntam', () => {
    const m = mesclar({ dominio: { 3: 2 }, treino: { meta: 5, dias: ['2026-10-12'] } }, { dominio: { 3: 1, 4: 3 }, treino: { meta: 3, dias: ['2026-10-10', '2026-10-12'] } });
    expect(m.dominio).toEqual({ 3: 2, 4: 3 });
    expect(m.treino).toEqual({ meta: 5, dias: ['2026-10-10', '2026-10-12'] });
  });
  it('recomeçou neste aparelho: a nuvem não traz de volta os passos apagados', () => {
    const m = mesclar({ passos: [], zerada: 2000, tempos: [{ ms: 1, quando: 9, embaralhar: '' }] }, { passos: [0, 1, 2, 3], dominio: { 1: 3 }, zerada: 1000, tempos: [{ ms: 2, quando: 8, embaralhar: '' }] });
    expect(m.passos).toEqual([]); expect(m.dominio).toEqual({}); expect(m.tempos).toHaveLength(2); expect(m.zerada).toBe(2000);
  });
  it('recomeçou em outro aparelho: este aparelho também recomeça', () => {
    const m = mesclar({ passos: [0, 1, 2, 3, 4], dominio: { 2: 3 } }, { passos: [0], zerada: 5000 });
    expect(m.passos).toEqual([0]); expect(m.dominio).toEqual({});
  });
});
