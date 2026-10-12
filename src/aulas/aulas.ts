/**
 * As aulas, na ordem e no jeito do professor Renan Cerpe (playlist do Manual do Mundo).
 * O cubo fica com o AMARELO EM CIMA e o branco embaixo (no modelo, o branco é 'U'; viramos com z2).
 *
 * Cada situação ("caso") é a fórmula do professor com a fala dele em cada giro.
 * O cubo da situação é montado ao contrário: parte do cubo como fica no fim do passo
 * ("meta") e desfaz a fórmula. Assim a fórmula sempre resolve a situação mostrada.
 */
import { applyAlg, clone, faceOfNormal, faceletIndex, invertAlg, solved, type CubeState, type Piece } from '../cube/model';

export interface Lance { m: string; fala: string }
export interface Caso {
  id: string;
  nome: string;
  /** como reconhecer no seu cubo */
  ver: string;
  lances: Lance[];
}
export interface Passo {
  n: number;
  titulo: string;
  cor: 'green' | 'red' | 'blue' | 'orange' | 'yellow';
  objetivo: string;
  segurar: string;
  /** o "porquê" ou o cuidado principal, em uma frase */
  dica: string;
  /** a peça que se resolve uma de cada vez (são 4 por passo) */
  peca: string;
  /** o que fazer no cubo de verdade depois de cada peça */
  repetir: string;
  /** cubo como fica quando a situação está resolvida */
  meta: () => CubeState;
  /** cubo como fica no fim do passo, para mostrar o objetivo */
  fim: () => CubeState;
  /** olhar o fim espiando a base (onde fica a parte branca) */
  fimDeBaixo: boolean;
  /** peças que importam neste passo (as outras ficam cinza) */
  foco: (p: Piece) => boolean;
  /** a situação está resolvida? (aceita outro caminho, se der no mesmo) */
  pronto: (s: CubeState, meta: CubeState) => boolean;
  casos: Caso[];
}

const isWhite = (p: Piece) => p.stickers.some(t => t.color === 'U');
const isEdge = (p: Piece) => p.stickers.length === 2;
const whiteEdge = (p: Piece) => isWhite(p) && isEdge(p);
const samePlace = (a: Piece, b: Piece) =>
  a.pos.every((v, i) => v === b.pos[i]) && a.stickers.every(t => b.stickers.some(u => u.color === t.color && u.n.every((v, i) => v === t.n[i])));
/** as peças do foco que, na meta, já estão embaixo precisam estar iguais à meta */
const baseIgual = (s: CubeState, meta: CubeState, foco: (p: Piece) => boolean) =>
  meta.filter(p => foco(p) && p.pos[1] === -1).every(m => samePlace(s.find(p => p.id === m.id)!, m));

/** amarelo em cima, branco embaixo, verde de frente */
export const amareloEmCima = () => applyAlg(solved(), 'z2');
/** os 4 meios brancos em volta do amarelo, com o branco para cima */
const brancosNoTopo = () => applyAlg(amareloEmCima(), 'F2 R2 B2 L2');

export const PASSOS: Passo[] = [
  {
    n: 1, titulo: 'Preparar a cruz branca', cor: 'green',
    objetivo: 'Juntar os 4 meios brancos em volta do centro amarelo, com o branco virado para cima.',
    segurar: 'Amarelo em cima, branco embaixo.',
    dica: 'Antes de subir uma peça, olhe o topo: se já tem branco no lugar, gire o topo para limpar o espaço.',
    peca: 'meio branco', repetir: 'Faça igual no seu cubo. Depois procure o próximo meio branco que ainda não está no topo.',
    meta: brancosNoTopo, fim: brancosNoTopo, fimDeBaixo: false,
    foco: whiteEdge,
    pronto: s => s.filter(whiteEdge).every(p => p.pos[1] === 1 && p.stickers.find(t => t.color === 'U')!.n[1] === 1),
    casos: [
      {
        id: 'meio', nome: 'Meio branco na camada do meio', ver: 'A peça está no andar do meio, entre duas laterais, e o espaço em cima dela está livre.',
        lances: [{ m: 'R', fala: 'Sobe a lateral: a peça branca vai para o topo.' }],
      },
      {
        id: 'limpar', nome: 'O espaço em cima já tem branco', ver: 'A peça está no andar do meio, mas bem em cima dela já tem um branco.',
        lances: [
          { m: 'U', fala: 'Gira o topo para limpar o espaço.' },
          { m: 'R', fala: 'Agora sobe a lateral.' },
        ],
      },
      {
        id: 'base', nome: 'Meio branco na base', ver: 'A peça está embaixo, com o branco virado para a mesa.',
        lances: [{ m: 'R2', fala: 'Movimento duplo na lateral: a peça sobe tudo.' }],
      },
      {
        id: 'deitada', nome: 'Branco virado para o lado', ver: 'A peça está no andar de cima (ou de baixo), mas o branco olha para a frente.',
        lances: [
          { m: 'F', fala: 'Gira a frente para deitar a peça no andar do meio.' },
          { m: "U'", fala: 'Gira o topo para limpar o espaço.' },
          { m: 'R', fala: 'Sobe a lateral.' },
        ],
      },
    ],
  },
  {
    n: 2, titulo: 'Finalizar a cruz branca', cor: 'red',
    objetivo: 'Levar cada meio branco do topo para baixo, no lado da cor certa. No fim, a cruz branca fica embaixo.',
    segurar: 'Amarelo em cima. A cor que você vai resolver fica de frente para você.',
    dica: 'Olhe a outra cor do meio branco, a que fica de lado. Ela tem que bater com o centro antes de descer.',
    peca: 'meio branco', repetir: 'Faça igual no seu cubo. Depois vire o cubo inteiro para a próxima cor (vermelho, azul, laranja) ficar de frente.',
    meta: () => applyAlg(amareloEmCima(), 'R2 B2 L2'), fim: amareloEmCima, fimDeBaixo: true,
    foco: whiteEdge,
    pronto: (s, meta) => baseIgual(s, meta, whiteEdge),
    casos: [
      {
        id: 'bate', nome: 'A cor já bate com o centro', ver: 'O meio branco está no topo, de frente, e a cor dele é igual à do centro da frente.',
        lances: [{ m: 'F2', fala: 'O ponteiro está ao meio-dia. Gira a frente duas vezes e leva ele para as 6 horas.' }],
      },
      {
        id: 'girar', nome: 'A cor não bate', ver: 'O meio branco está no topo, mas em cima de outra cor.',
        lances: [
          { m: 'U', fala: 'Gira o topo até a cor bater com o centro.' },
          { m: 'F2', fala: 'Do meio-dia para as 6 horas: gira a frente duas vezes.' },
        ],
      },
      {
        id: 'oposto', nome: 'Está do outro lado', ver: 'A cor do meio branco é a do centro de trás.',
        lances: [
          { m: 'U2', fala: 'Gira o topo duas vezes até a cor bater com o centro.' },
          { m: 'F2', fala: 'Do meio-dia para as 6 horas.' },
        ],
      },
    ],
  },
  {
    n: 3, titulo: 'Primeira camada', cor: 'blue',
    objetivo: 'Colocar as 4 quinas brancas. No fim, a face branca e a primeira camada ficam prontas.',
    segurar: 'Cruz branca embaixo, amarelo em cima. O lugar da quina fica na frente, embaixo.',
    dica: 'Gire o topo até a quina ficar bem em cima do lugar dela: a cor do lado do branco bate com o centro.',
    peca: 'quina branca', repetir: 'Faça igual no seu cubo. Depois vire o cubo inteiro para o próximo lugar vazio ficar na frente.',
    meta: amareloEmCima, fim: amareloEmCima, fimDeBaixo: true,
    foco: isWhite,
    pronto: (s, meta) => baseIgual(s, meta, isWhite),
    casos: [
      {
        id: 'direita', nome: 'Janela branca à direita', ver: 'A quina está no andar de cima e o branco olha para a direita.',
        lances: [
          { m: 'R', fala: 'Joga lá pra trás: gira a direita.' },
          { m: 'U', fala: 'Junta branco com branco: gira o topo.' },
          { m: "R'", fala: 'E volta todo mundo para baixo.' },
        ],
      },
      {
        id: 'esquerda', nome: 'Janela branca à esquerda', ver: 'A quina está no andar de cima e o branco olha para a esquerda.',
        lances: [
          { m: "L'", fala: 'Joga lá pra trás: gira a esquerda.' },
          { m: "U'", fala: 'Junta branco com branco: gira o topo.' },
          { m: 'L', fala: 'E volta todo mundo para baixo.' },
        ],
      },
      {
        id: 'telhado', nome: 'Janela no telhado', ver: 'A quina está no andar de cima e o branco olha para cima.',
        lances: [
          { m: 'R', fala: 'Gira a direita: o lugar da quina vai lá pra trás.' },
          { m: 'U2', fala: 'Gira o topo duas vezes.' },
          { m: "R'", fala: 'Volta a direita. Pronto: virou janela!' },
          { m: "U'", fala: 'Gira o topo até a quina ficar em cima do lugar dela.' },
          { m: 'R', fala: 'Joga lá pra trás.' },
          { m: 'U', fala: 'Junta branco com branco.' },
          { m: "R'", fala: 'E volta todo mundo para baixo.' },
        ],
      },
      {
        id: 'errada', nome: 'Quina embaixo, mas errada', ver: 'A quina já está embaixo, no lugar, mas o branco não está virado para baixo.',
        lances: [
          { m: 'R', fala: 'Gira a direita para tirar a quina de lá.' },
          { m: 'U', fala: 'Gira o topo.' },
          { m: "R'", fala: 'Volta a direita. A quina subiu e virou janela.' },
          { m: "U'", fala: 'Gira o topo até a quina ficar em cima do lugar dela.' },
          { m: 'R', fala: 'Joga lá pra trás.' },
          { m: 'U', fala: 'Junta branco com branco.' },
          { m: "R'", fala: 'E volta todo mundo para baixo.' },
        ],
      },
    ],
  },
];

/** os passos que ainda vão chegar, só para a trilha */
export const PROXIMOS: { n: number; titulo: string; cor: Passo['cor'] }[] = [
  { n: 4, titulo: 'Segunda camada', cor: 'orange' },
  { n: 5, titulo: 'Cruz amarela', cor: 'yellow' },
  { n: 6, titulo: 'Face amarela', cor: 'green' },
  { n: 7, titulo: 'Arrumar as quinas', cor: 'red' },
  { n: 8, titulo: 'Arrumar os meios', cor: 'blue' },
];

export const movesOf = (c: Caso) => c.lances.map(l => l.m);
/** o cubo da situação: a meta com a fórmula desfeita */
export const setupOf = (p: Passo, c: Caso) => applyAlg(p.meta(), invertAlg(movesOf(c)));

/** adesivos cinza: tudo o que não é do foco (os centros ficam sempre coloridos) */
export function greyKeys(s: CubeState, foco: (p: Piece) => boolean): string[] {
  const out: string[] = [];
  for (const p of s) {
    if (p.stickers.length === 1 || foco(p)) continue;
    for (const t of p.stickers) { const f = faceOfNormal(t.n); out.push(`${f}${faceletIndex(f, p.pos)}`); }
  }
  return out;
}
export { clone };

/** os 8 passos com título e cor, e se a aula já existe */
export const TODOS = [
  ...PASSOS.map(p => ({ n: p.n, titulo: p.titulo, cor: p.cor, pronto: true })),
  ...PROXIMOS.map(p => ({ ...p, pronto: false })),
];
