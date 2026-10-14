import { describe, expect, it } from 'vitest';
import { applyMove, clone, faceOfNormal, type CubeState, type Face } from '../cube/model';
import { LICOES, licaoLiberada, proximaLicao, passoCompleto, licoesDo } from '.';
import { MARGARIDA_TODA, margarida } from './passo1';
import { petala } from './tipos';
import { amareloEmCima } from '../aulas/aulas';
import { applyAlg, invertAlg } from '../cube/model';
import { PASSOS } from '../aulas/aulas';
import { emQuePasso } from '../aulas/progresso';

/** o cubo de cada tela, seguindo a lição como a pessoa faria */
function estados(l: (typeof LICOES)[number]): CubeState[] {
  let s: CubeState = [];
  return l.telas.map(t => {
    if (t.cubo) s = t.cubo();
    const antes = clone(s);
    if (t.tarefa.tipo === 'ver' || t.tarefa.tipo === 'girar') t.tarefa.giros.forEach(m => applyMove(s, m));
    return antes;
  });
}

describe('lições', () => {
  it('ids únicos e toda lição começa com um cubo', () => {
    expect(new Set(LICOES.map(l => l.id)).size).toBe(LICOES.length);
    for (const l of LICOES) expect(l.telas[0].cubo, l.id).toBeTruthy();
  });

  it('cada pergunta tem exatamente uma resposta certa, e as erradas explicam o porquê', () => {
    for (const l of LICOES) for (const t of l.telas) if (t.tarefa.tipo === 'escolha') {
      expect(t.tarefa.opcoes.filter(o => o.certo).length, `${l.id}: ${t.fala}`).toBe(1);
      for (const o of t.tarefa.opcoes.filter(o => !o.certo)) expect(o.porque, `${l.id}: ${o.texto}`).toBeTruthy();
    }
  });

  it('em toda tela de tocar existem peças certas suficientes', () => {
    for (const l of LICOES) estados(l).forEach((s, k) => {
      const t = l.telas[k]; if (t.tarefa.tipo !== 'tocar') return;
      const alvo = t.tarefa.alvo;
      const ok = new Set(s.filter(p => p.stickers.some(st => alvo(p, faceOfNormal(st.n) as Face, s))).map(p => p.id));
      expect(ok.size, `${l.id}: ${t.fala}`).toBeGreaterThanOrEqual(t.tarefa.quantos ?? 1);
    });
  });

  it('as falas são curtas (passos de formiga)', () => {
    for (const l of LICOES) for (const t of l.telas) expect(t.fala.length, t.fala).toBeLessThanOrEqual(150);
  });

  it('nas lições de situação do passo 1, os giros da pessoa fazem mais uma pétala', () => {
    for (const l of LICOES.filter(x => x.passo === 1)) estados(l).forEach((s, k) => {
      const t = l.telas[k]; if (t.tarefa.tipo !== 'girar' || !t.cubo) return;
      const depois = clone(s); t.tarefa.giros.forEach(m => applyMove(depois, m));
      expect(depois.filter(petala).length, `${l.id}`).toBeGreaterThan(s.filter(petala).length);
    });
  });

  it('a margarida inteira começa sem pétalas e termina com as 4, sem nunca perder uma', () => {
    const s = applyAlg(margarida(), invertAlg(MARGARIDA_TODA));
    expect(s.filter(petala).length).toBe(0);
    let antes = 0;
    for (const m of MARGARIDA_TODA) { applyMove(s, m); const n = s.filter(petala).length; expect(n).toBeGreaterThanOrEqual(antes); antes = n; }
    expect(antes).toBe(4);
    // só usa os giros ensinados na fase 0
    expect(MARGARIDA_TODA.every(m => ['U', "U'", 'R', "R'", 'F', "F'"].includes(m))).toBe(true);
  });

  it('passos 2 a 8: cada situação feita na tela resolve o que promete, e o passo inteiro termina pronto', () => {
    for (const p of PASSOS.filter(x => x.n >= 2)) {
      for (const c of p.casos) {
        const l = LICOES.find(x => x.id === `p${p.n}-${c.id}`)!;
        expect(l, `${p.n}.${c.id}`).toBeTruthy();
        const t = l.telas.find(x => x.tarefa.tipo === 'girar')!;
        const s = t.cubo!(); if (t.tarefa.tipo === 'girar') applyAlg(s, t.tarefa.giros);
        if (!c.depois) expect(p.pronto(s, p.meta()), `${p.n}.${c.id}`).toBe(true);
      }
      const todo = LICOES.find(x => x.id === `p${p.n}-todo`)!, t = todo.telas[0];
      const s = t.cubo!(); if (t.tarefa.tipo === 'girar') applyAlg(s, t.tarefa.giros);
      expect(p.pronto(s, p.meta()) || emQuePasso(s) > p.n, `passo ${p.n} inteiro`).toBe(true);
    }
  });

  it('o cubo embaralhado do passo 1 tem os 4 meios brancos fora do lugar', () => {
    const l = LICOES.find(x => x.id === 'p1-achar')!;
    const s = l.telas[0].cubo!();
    expect(s.filter(petala).length).toBeLessThan(4);
    expect(JSON.stringify(s)).not.toBe(JSON.stringify(amareloEmCima()));
  });

  it('ordem: a fase 0 libera o passo 1, e quem já tinha feito o passo não precisa refazer', () => {
    const p1 = licoesDo(1)[0];
    expect(licaoLiberada(p1, [], [])).toBe(false);
    expect(licaoLiberada(p1, [], [0])).toBe(true);
    expect(proximaLicao(0, [], [0])).toBeNull();
    expect(proximaLicao(0, [], [])?.id).toBe('f0-oi');
    expect(passoCompleto(0, licoesDo(0).map(l => l.id))).toBe(true);
  });
});
