/**
 * Lições em passos de formiga: cada lição é uma sequência curta de telas.
 * Cada tela tem uma fala curta do Pingo, o cubo, e uma tarefa que a pessoa precisa fazer para avançar.
 * Nas falas, *palavra* aparece em negrito (e é lida sem os asteriscos).
 */
import type { Mood } from '../components/Mascot';
import { faceOfNormal, faceletIndex, type CubeState, type Face, type Piece } from '../cube/model';

export type Tarefa =
  /** só seguir (para apresentar algo); use pouco */
  | { tipo: 'ok'; botao: string }
  /** o Pingo mostra giros no cubo; a pessoa assiste (pode ver de novo) */
  | { tipo: 'ver'; giros: string[]; botao?: string }
  /** tocar em peças ou faces; "quantos" peças diferentes que batem com o alvo */
  | { tipo: 'tocar'; alvo: (p: Piece, face: Face, s: CubeState) => boolean; quantos?: number;
      erro?: (p: Piece, face: Face, s: CubeState) => string }
  /** fazer giros no cubo da tela, nesta ordem (seta mostra o próximo; giro errado é desfeito).
   *  Giros duplos (F2) viram dois giros; giros do cubo inteiro (x, y, z) ganham um botão. "falas" explica cada giro. */
  | { tipo: 'girar'; giros: string[]; falas?: string[] }
  /** escolher a resposta certa; "seta" mostra um giro no cubo enquanto pergunta */
  | { tipo: 'escolha'; opcoes: { texto: string; certo?: boolean; porque?: string }[]; seta?: string }
  /** convite para fazer no cubo de verdade (sempre dá para seguir sem cubo) */
  | { tipo: 'nocubo'; feito: string; semCubo?: string }
  /** missão no cubo de verdade: escolher a situação de cada peça, ver o que fazer e repetir até completar */
  | { tipo: 'missao'; passo: number };

export interface Tela {
  fala: string;
  mood?: Mood;
  /** o cubo desta tela (sem isso, continua o cubo da tela anterior) */
  cubo?: () => CubeState;
  /** peças que importam (as outras ficam cinza); null = todas coloridas */
  foco?: ((p: Piece) => boolean) | null;
  /** peças que piscam para chamar a atenção */
  destaque?: (p: Piece) => boolean;
  /** olhar o cubo por baixo */
  base?: boolean;
  /** contador mostrado no cubo (ex.: pétalas prontas) */
  contador?: (s: CubeState) => { n: number; total: number; rotulo: string };
  /** o que o Pingo diz quando a pessoa acerta */
  acerto?: string;
  tarefa: Tarefa;
}

export interface Licao {
  id: string;
  /** de que passo da trilha ela faz parte (0 = conhecer o cubo) */
  passo: number;
  titulo: string;
  /** uma linha sobre o que se aprende */
  resumo: string;
  telas: Tela[];
}

/* ---------- ajudas para escrever as lições ---------- */

/** giros duplos viram dois giros simples (com a fala repetida), do jeito que se faz com o dedo */
export function expandir(giros: string[], falas?: string[]): { giros: string[]; falas: (string | undefined)[] } {
  const g: string[] = [], f: (string | undefined)[] = [];
  giros.forEach((m, k) => {
    const fala = falas?.[k];
    if (m.endsWith('2')) { g.push(m[0], m[0]); f.push(fala, fala); } else { g.push(m); f.push(fala); }
  });
  return { giros: g, falas: f };
}
export const ehGiroInteiro = (m: string) => 'xyz'.includes(m[0]);

/** a peça (e o adesivo) que está numa posição da face (0..8) */
export function pecaEm(s: CubeState, face: Face, index: number): Piece | undefined {
  return s.find(p => p.stickers.some(t => faceOfNormal(t.n) === face && faceletIndex(face, p.pos) === index));
}
/** as posições ("F4", "U7"…) dos adesivos das peças que batem */
export function chavesDe(s: CubeState, f: (p: Piece) => boolean): string[] {
  const out: string[] = [];
  for (const p of s) if (f(p)) for (const t of p.stickers) { const fc = faceOfNormal(t.n); out.push(`${fc}${faceletIndex(fc, p.pos)}`); }
  return out;
}
/** cor do adesivo da peça que está virado para a face */
export const corNaFace = (p: Piece, face: Face): Face | undefined => p.stickers.find(t => faceOfNormal(t.n) === face)?.color;

// no modelo: U branco, D amarelo, F verde, B azul, R vermelho, L laranja
export const COR = { branco: 'U', amarelo: 'D', verde: 'F', azul: 'B', vermelho: 'R', laranja: 'L' } as const satisfies Record<string, Face>;
export const tem = (p: Piece, c: Face) => p.stickers.some(t => t.color === c);
export const ehCentro = (p: Piece) => p.stickers.length === 1;
export const ehMeio = (p: Piece) => p.stickers.length === 2;
export const ehQuina = (p: Piece) => p.stickers.length === 3;
export const meioBranco = (p: Piece) => ehMeio(p) && tem(p, COR.branco);
/** pétala: meio branco no topo, com o branco virado para cima */
export const petala = (p: Piece) => meioBranco(p) && p.pos[1] === 1 && p.stickers.find(t => t.color === COR.branco)!.n[1] === 1;

/** o que dizer quando a pessoa toca na peça errada, pelo tipo da peça */
export const tipoDaPeca = (p: Piece) => ehCentro(p) ? 'um *centro* (1 cor só)' : ehMeio(p) ? 'um *meio* (2 cores)' : 'uma *quina* (3 cores)';
