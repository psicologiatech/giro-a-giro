/**
 * Revisão espaçada das situações (caixas de Leitner).
 * Acertou: a situação sobe de caixa e demora mais para voltar. Errou: volta para a caixa 1 (amanhã de novo).
 * O aquecimento do Treino do dia escolhe as situações vencidas, depois as novas, intercalando os passos.
 */
import { PASSOS, type Caso, type Passo } from './aulas';

export const RKEY = 'giroagiro.revisao.v1';
export const TDKEY = 'giroagiro.treinodia.v1';
export interface Cartao { caixa: number; proxima: string; visto: number }
export type Revisao = Record<string, Cartao>;
/** dias até voltar, por caixa (1 a 5) */
export const INTERVALOS = [0, 1, 2, 4, 7, 14];

/** as situações que entram na revisão: as que usam fórmula (passos 3 a 8) */
export const SITUACOES: { id: string; passo: Passo; caso: Caso }[] =
  PASSOS.filter(p => p.n >= 3).flatMap(p => p.casos.map(c => ({ id: `${p.n}.${c.id}`, passo: p, caso: c })));

const dia = (d: Date) => d.toLocaleDateString('sv-SE');
export const somaDias = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return dia(d); };

/** o nível de uma situação (1 a 5) é a caixa dela; situação nova começa no 1 */
export const nivelDe = (rev: Revisao, id: string) => Math.min(5, Math.max(1, rev[id]?.caixa ?? 1));
export const NIVEIS = [
  { n: 1, nome: 'Reconhecer', texto: 'escolher entre 2 opções' },
  { n: 2, nome: 'Escolher', texto: 'escolher entre 3 opções parecidas' },
  { n: 3, nome: 'Lembrar', texto: 'lembrar sem opções e conferir' },
  { n: 4, nome: 'Fazer', texto: 'fazer no cubo da tela, sem a seta' },
  { n: 5, nome: 'Dominar', texto: 'fazer só pelo nome da situação' },
];

/** registra a resposta: acertou sobe um nível; errou desce um (sem voltar ao zero) */
export function responder(rev: Revisao, id: string, acertou: boolean, agora = new Date()): Revisao {
  const atual = rev[id]?.caixa ?? 0;
  const caixa = acertou ? Math.min(5, Math.max(1, atual + 1)) : Math.max(1, atual - 1);
  return { ...rev, [id]: { caixa, proxima: somaDias(dia(agora), INTERVALOS[caixa]), visto: agora.getTime() } };
}

/** escolhe as situações do aquecimento: vencidas primeiro, depois novas, depois as que estão mais perto de vencer.
 *  "passos" limita aos passos que a pessoa já fez (o treino cresce junto com a trilha) */
export function escolher(rev: Revisao, qtd = 5, agora = new Date(), rnd = Math.random, passos?: number[]): string[] {
  const hoje = dia(agora);
  const ids = SITUACOES.filter(s => !passos || passos.includes(s.passo.n)).map(s => s.id);
  const vencidas = ids.filter(id => rev[id] && rev[id].proxima <= hoje)
    .sort((a, b) => rev[a].caixa - rev[b].caixa || rev[a].proxima.localeCompare(rev[b].proxima));
  const novas = embaralhar(ids.filter(id => !rev[id]), rnd);
  const resto = ids.filter(id => rev[id] && rev[id].proxima > hoje).sort((a, b) => rev[a].proxima.localeCompare(rev[b].proxima));
  return intercalar([...vencidas, ...novas, ...resto].slice(0, qtd));
}

function embaralhar<T>(xs: T[], rnd: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const passoDe = (id: string) => id.split('.')[0];
/** evita duas situações seguidas do mesmo passo (prática intercalada) */
export function intercalar(ids: string[]): string[] {
  const resto = [...ids], out: string[] = [];
  while (resto.length) {
    const i = resto.findIndex(id => !out.length || passoDe(id) !== passoDe(out[out.length - 1]));
    out.push(...resto.splice(i < 0 ? 0 : i, 1));
  }
  return out;
}

/* ---------- guardar ---------- */
const ler = <T,>(k: string, p: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch { return p; } };
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
export const loadRevisao = (): Revisao => ler(RKEY, {});
export const saveRevisao = (r: Revisao) => gravar(RKEY, r);

/** as 3 partes do Treino do dia já feitas hoje */
export function partesHoje(agora = new Date()): number[] {
  const t = ler<{ dia: string; partes: number[] }>(TDKEY, { dia: '', partes: [] });
  return t.dia === dia(agora) ? t.partes : [];
}
export function marcarParte(parte: number, agora = new Date()) {
  const ps = partesHoje(agora);
  if (!ps.includes(parte)) gravar(TDKEY, { dia: dia(agora), partes: [...ps, parte].sort() });
  try { window.dispatchEvent(new Event('giroagiro:progresso')); } catch { /* */ }
}

/** um passo está dominado quando todas as situações dele chegaram ao nível 5 */
export const passoDominado = (rev: Revisao, passo: number) =>
  SITUACOES.filter(s => s.passo.n === passo).every(s => nivelDe(rev, s.id) === 5 && !!rev[s.id]);
/** o treino abre a partir do passo 3 (o primeiro com fórmula) */
export const passosDoTreino = (feitos: number[]) => feitos.filter(n => n >= 3 && n <= 8);
