/**
 * As lições da trilha e o progresso delas.
 * Um passo que tem lições fica feito quando todas as lições dele estão feitas.
 * Quem já tinha feito o passo antes das lições continua com ele feito (as lições contam como feitas).
 */
import { FASE0 } from './fase0';
import { PASSO1 } from './passo1';
import { PASSOS_2A8, licaoQual } from './passos';
import { PASSOS } from '../aulas/aulas';
import type { Licao } from './tipos';

// no passo 1, "Qual é a situação?" vem antes da margarida inteira
export const LICOES: Licao[] = [...FASE0, ...PASSO1.slice(0, -1), licaoQual(PASSOS[0]), ...PASSO1.slice(-1), ...PASSOS_2A8];
export const licoesDo = (passo: number) => LICOES.filter(l => l.passo === passo);
export const temLicoes = (passo: number) => licoesDo(passo).length > 0;

export const LKEY = 'giroagiro.licoes.v1';
export function loadLicoes(): string[] { try { return JSON.parse(localStorage.getItem(LKEY) || '[]'); } catch { return []; } }
export function saveLicoes(ids: string[]) {
  try { localStorage.setItem(LKEY, JSON.stringify([...new Set(ids)])); } catch { /* sem armazenamento */ }
}

/** a lição está feita? (ou o passo dela já estava feito) */
export const licaoFeita = (l: Licao, licoes: string[], feitos: number[]) => licoes.includes(l.id) || feitos.includes(l.passo);
/** a próxima lição a fazer no passo (ou null, se todas feitas) */
export function proximaLicao(passo: number, licoes: string[], feitos: number[]): Licao | null {
  return licoesDo(passo).find(l => !licaoFeita(l, licoes, feitos)) ?? null;
}
/** a lição está liberada? (a anterior foi feita; a primeira de um passo pede o passo anterior feito) */
export function licaoLiberada(l: Licao, licoes: string[], feitos: number[]): boolean {
  const lista = licoesDo(l.passo), i = lista.indexOf(l);
  if (i > 0) return licaoFeita(lista[i - 1], licoes, feitos);
  return l.passo === 0 || feitos.includes(l.passo - 1);
}
export const passoCompleto = (passo: number, licoes: string[]) => licoesDo(passo).every(l => licoes.includes(l.id));
export type { Licao };
