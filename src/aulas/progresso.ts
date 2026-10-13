/**
 * Em que passo a pessoa está.
 * - feitos: passos que ela marcou como prontos no cubo de verdade (guardado no aparelho)
 * - emQuePasso: olha um cubo (lido pela câmera) e diz em que passo ele está
 */
import { applyMove, clone, faceOfNormal, type CubeState, type Face, type Piece, type Vec } from '../cube/model';

const KEY = 'giroagiro.passos.v1';
export function loadFeitos(): number[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
export function saveFeitos(f: number[]) { try { localStorage.setItem(KEY, JSON.stringify([...new Set(f)].sort((a, b) => a - b))); } catch { /* sem armazenamento */ } }
/** marca este passo e todos os anteriores como feitos */
export const marcarAte = (feitos: number[], n: number) => [...new Set([...feitos, ...Array.from({ length: n + 1 }, (_, i) => i)])];
/** o passo da vez: o primeiro que ainda não foi feito (0 = conhecer o cubo; 9 = tudo feito) */
export const passoAtual = (feitos: number[]) => { for (let n = 0; n <= 8; n++) if (!feitos.includes(n)) return n; return 9; };

const eq = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** em que passo está este cubo (1 a 8; 9 = montado). Vale em qualquer posição do cubo. */
export function emQuePasso(s: CubeState): number {
  const centro = {} as Record<Face, Vec>;
  for (const p of s) if (p.stickers.length === 1) centro[p.stickers[0].color] = p.stickers[0].n;
  const certa = (p: Piece) => p.stickers.every(t => eq(t.n, centro[t.color]));
  const tem = (p: Piece, c: Face) => p.stickers.some(t => t.color === c);
  const olha = (p: Piece, c: Face, para: Face) => eq(p.stickers.find(t => t.color === c)!.n, centro[para]);
  const meios = s.filter(p => p.stickers.length === 2), quinas = s.filter(p => p.stickers.length === 3);
  const W = 'U', Y = 'D'; // no modelo, branco é U e amarelo é D

  const brancos = meios.filter(p => tem(p, W));
  if (!brancos.every(certa)) return brancos.every(p => olha(p, W, Y)) ? 2 : 1;
  if (!quinas.filter(p => tem(p, W)).every(certa)) return 3;
  if (!meios.filter(p => !tem(p, W) && !tem(p, Y)).every(certa)) return 4;
  const amarelos = meios.filter(p => tem(p, Y)), qAmarelas = quinas.filter(p => tem(p, Y));
  if (!amarelos.every(p => olha(p, Y, Y))) return 5;
  if (!qAmarelas.every(p => olha(p, Y, Y))) return 6;
  // nos passos 7 e 8 vale girar a camada amarela para alinhar (o alinhamento fica para o fim)
  const camada = faceOfNormal(centro[Y]);
  const girado = (k: number) => { const t = clone(s); for (let i = 0; i < k; i++) applyMove(t, camada); return t; };
  const certaEm = (t: CubeState) => (p: Piece) => {
    const c = {} as Record<Face, Vec>; for (const q of t) if (q.stickers.length === 1) c[q.stickers[0].color] = q.stickers[0].n;
    return p.stickers.every(x => eq(x.n, c[x.color]));
  };
  const voltas = [0, 1, 2, 3].map(girado);
  const ids = (f: (p: Piece) => boolean) => new Set(s.filter(f).map(p => p.id));
  const qIds = ids(p => p.stickers.length === 3 && tem(p, Y)), aIds = ids(p => p.stickers.length === 2 && tem(p, Y));
  const ok = (t: CubeState, set: Set<string>) => t.filter(p => set.has(p.id)).every(certaEm(t));
  if (!voltas.some(t => ok(t, qIds))) return 7;
  if (!voltas.some(t => ok(t, qIds) && ok(t, aIds))) return 8;
  return 9;
}

/** quantas peças do passo já ficaram prontas no cubo de verdade (até 4) */
const PK = 'giroagiro.pecas.v1';
export function loadPecas(n: number): number { try { return JSON.parse(localStorage.getItem(PK) || '{}')[n] ?? 0; } catch { return 0; } }
export function savePecas(n: number, v: number) {
  try { const all = JSON.parse(localStorage.getItem(PK) || '{}'); all[n] = v; localStorage.setItem(PK, JSON.stringify(all)); } catch { /* sem armazenamento */ }
}
