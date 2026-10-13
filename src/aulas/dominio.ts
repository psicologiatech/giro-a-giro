/**
 * O que os indicadores medem de verdade:
 * - Domínio: até 3 estrelas por passo (1 Vi, 2 Fiz, 3 Sei). Total de 24 nos 8 passos.
 * - Constância: dias de treino de verdade na semana (segunda a domingo), com meta escolhida pela pessoa.
 * Tudo fica no aparelho (e na nuvem, para quem entrou com o Google).
 */
export const DKEY = 'giroagiro.dominio.v1';
export const TKEY = 'giroagiro.treino.v1';
export const ZKEY = 'giroagiro.zerada.v1';
export const VI = 1, FIZ = 2, SEI = 3;
export type Dominio = Record<string, number>;
export interface Treino { meta: number; dias: string[] }

const ler = <T,>(k: string, padrao: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch { return padrao; } };
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
/** avisa a tela de que o progresso mudou (os chips do topo se atualizam) */
const avisar = () => { try { window.dispatchEvent(new Event('giroagiro:progresso')); } catch { /* fora do navegador */ } };

export const loadDominio = (): Dominio => ler(DKEY, {});
/** sobe as estrelas de um passo (nunca desce) */
export function subir(passo: number, nivel: number) {
  if (passo < 1 || passo > 8) return;
  const d = loadDominio();
  if ((d[passo] ?? 0) >= nivel) return;
  d[passo] = nivel; gravar(DKEY, d); avisar();
}
export const estrelas = (d: Dominio, passo: number) => Math.min(3, d[passo] ?? 0);
export const totalEstrelas = (d: Dominio) => [1, 2, 3, 4, 5, 6, 7, 8].reduce((s, n) => s + estrelas(d, n), 0);
/** o passo que mais precisa de treino: o de menos estrelas (o primeiro, em caso de empate) */
export const passoMaisFraco = (d: Dominio) => [1, 2, 3, 4, 5, 6, 7, 8].reduce((m, n) => (estrelas(d, n) < estrelas(d, m) ? n : m), 1);

const hoje = (agora = new Date()) => agora.toLocaleDateString('sv-SE');
export const loadTreino = (): Treino => ({ meta: 3, dias: [], ...ler<Partial<Treino>>(TKEY, {}) });
export function setMeta(meta: number) { gravar(TKEY, { ...loadTreino(), meta }); avisar(); }
/** conta o dia de hoje como dia de treino; devolve true se com isso a meta da semana foi batida agora */
export function marcarTreino(agora = new Date()): boolean {
  const t = loadTreino(), d = hoje(agora);
  if (t.dias.includes(d)) return false;
  const antes = naSemana(t.dias, agora);
  t.dias = [...t.dias, d].slice(-120); gravar(TKEY, t); avisar();
  return antes < t.meta && antes + 1 >= t.meta;
}
/** quantos dias de treino na semana de "agora" (segunda a domingo) */
export function naSemana(dias: string[], agora = new Date()): number {
  const seg = new Date(agora); seg.setHours(12, 0, 0, 0); seg.setDate(seg.getDate() - ((seg.getDay() + 6) % 7));
  const da = new Set(Array.from({ length: 7 }, (_, i) => { const x = new Date(seg); x.setDate(seg.getDate() + i); return hoje(x); }));
  return new Set(dias.filter(x => da.has(x))).size;
}
/** dias desde o último treino (null se nunca treinou) */
export function diasSemTreino(dias: string[], agora = new Date()): number | null {
  if (!dias.length) return null;
  const ult = [...dias].sort().pop()!;
  return Math.max(0, Math.round((new Date(hoje(agora) + 'T12:00:00').getTime() - new Date(ult + 'T12:00:00').getTime()) / 86400000));
}

/** recomeçar a trilha: apaga passos feitos, peças e estrelas; tempos e dias de treino continuam */
export function zerarTrilha() {
  try {
    localStorage.removeItem('giroagiro.passos.v1');
    localStorage.removeItem('giroagiro.pecas.v1');
    localStorage.removeItem(DKEY);
    localStorage.setItem(ZKEY, String(Date.now()));
  } catch { /* sem armazenamento */ }
  avisar();
}
