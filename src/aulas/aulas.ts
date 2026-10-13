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
  /** o passo inteiro sendo feito, para ver antes de começar (sem 'inicio', parte do fim e desfaz) */
  demo: { inicio?: string; partes: { legenda: string; m: string }[] };
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
/** meio da 2ª camada: sem branco e sem amarelo */
const meioDoMeio = (p: Piece) => isEdge(p) && !p.stickers.some(t => t.color === 'U' || t.color === 'D');
/** as peças do foco que, na meta, estão nos andares de baixo precisam estar iguais à meta */
const andaresIguais = (s: CubeState, meta: CubeState, foco: (p: Piece) => boolean) =>
  meta.filter(p => foco(p) && p.pos[1] <= 0).every(m => samePlace(s.find(p => p.id === m.id)!, m));

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
    demo: {
      inicio: "L2 R' L2 R2 F' D' B2 U L2 R2 F L U B2 L2 B R B L F'",
      partes: [
        { legenda: '1º meio branco sobe para o topo', m: 'F' },
        { legenda: '2º meio branco sobe', m: 'R' },
        { legenda: '3º meio branco: deita e sobe', m: "L B'" },
        { legenda: '4º: limpa o espaço e sobe', m: "U' F" },
      ],
    },
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
    peca: 'meio branco', repetir: 'Faça igual no seu cubo. Depois vire o cubo inteiro para a próxima cor ficar de frente.',
    demo: {
      inicio: 'F2 R2 U B2 U2 L2 U2',
      partes: [
        { legenda: '1º: gira o topo até a cor bater e desce', m: "U' F2" },
        { legenda: 'Vira o cubo: próxima cor de frente', m: 'y' },
        { legenda: '2º: a cor já bate, só desce', m: 'F2' },
        { legenda: 'Vira o cubo de novo', m: 'y' },
        { legenda: '3º: gira o topo e desce', m: 'U F2' },
        { legenda: 'Vira o cubo de novo', m: 'y' },
        { legenda: '4º: gira o topo duas vezes e desce', m: 'U2 F2' },
      ],
    },
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
    demo: {
      partes: [
        { legenda: '1ª quina: janela à direita', m: "R U R'" },
        { legenda: '2ª quina: gira o topo, janela à esquerda', m: "U' L' U' L" },
        { legenda: 'Vira o cubo: os lugares vazios vêm para a frente', m: 'y2' },
        { legenda: '3ª quina: janela no telhado', m: "R U2 R' U' R U R'" },
        { legenda: '4ª quina: estava embaixo, mas errada', m: "L' U' L U L' U' L" },
      ],
    },
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
  {
    n: 4, titulo: 'Segunda camada', cor: 'orange',
    objetivo: 'Colocar os 4 meios do andar do meio. No fim, os dois andares de baixo ficam prontos.',
    segurar: 'Cruz branca embaixo, amarelo em cima. A cor da peça de frente, alinhada com o centro.',
    dica: 'Procure no topo um meio sem amarelo. Gire o topo até a cor da frente dele bater com o centro: forma um T. A cor de cima diz para que lado ele vai.',
    peca: 'meio', repetir: 'Faça igual no seu cubo. Depois procure outro meio sem amarelo no topo e alinhe com a cor dele.',
    demo: {
      partes: [
        { legenda: '1º meio: entra para a direita', m: "U R U' R' U' F' U F" },
        { legenda: '2º meio: entra para a esquerda', m: "U' L' U L U F U' F'" },
        { legenda: 'Vira o cubo: os lugares vazios vêm para a frente', m: 'y2' },
        { legenda: '3º meio: para a direita', m: "U R U' R' U' F' U F" },
        { legenda: '4º meio: para a esquerda', m: "U' L' U L U F U' F'" },
      ],
    },
    meta: amareloEmCima, fim: amareloEmCima, fimDeBaixo: false,
    foco: p => isWhite(p) || meioDoMeio(p),
    pronto: (s, meta) => andaresIguais(s, meta, p => isWhite(p) || meioDoMeio(p)),
    casos: [
      {
        id: 'direita', nome: 'Vai entrar para a direita', ver: 'A cor da frente da peça bate com o centro, e a cor de cima é a do centro da direita.',
        lances: [
          { m: "U", fala: 'Jogo pro lado oposto: gira o topo para a esquerda.' },
          { m: "R", fala: 'Subo o lugar onde ela vai entrar: a direita sobe.' },
          { m: "U'", fala: 'Volto pra frente: gira o topo.' },
          { m: "R'", fala: 'Volto o lugar onde ela vai entrar.' },
          { m: "U'", fala: 'Formou o parzinho! Jogo o parzinho lá pra trás.' },
          { m: "F'", fala: 'Giro a fachada do prédio, subindo o espaço vazio.' },
          { m: "U", fala: 'Volto o parzinho pra frente.' },
          { m: "F", fala: 'E volto o trio pra base.' },
        ],
      },
      {
        id: 'esquerda', nome: 'Vai entrar para a esquerda', ver: 'A cor da frente da peça bate com o centro, e a cor de cima é a do centro da esquerda.',
        lances: [
          { m: "U'", fala: 'Jogo pro lado oposto: gira o topo para a direita.' },
          { m: "L'", fala: 'Subo o lugar onde ela vai entrar: a esquerda sobe.' },
          { m: "U", fala: 'Volto pra frente: gira o topo.' },
          { m: "L", fala: 'Volto o lugar onde ela vai entrar.' },
          { m: "U", fala: 'Formou o parzinho! Jogo o parzinho lá pra trás.' },
          { m: "F", fala: 'Giro a fachada do prédio, subindo o espaço vazio.' },
          { m: "U'", fala: 'Volto o parzinho pra frente.' },
          { m: "F'", fala: 'E volto o trio pra base.' },
        ],
      },
      {
        id: 'invertida', nome: 'Peça presa no meio', ver: 'A peça já está no andar do meio, mas invertida (ou no lugar errado). Não tem nenhum meio sem amarelo no topo.',
        lances: [
          { m: "U", fala: 'Para tirar a peça, faça a fórmula da direita. Jogo pro lado oposto.' },
          { m: "R", fala: 'Subo o lugar onde ela vai entrar: a direita sobe.' },
          { m: "U'", fala: 'Volto pra frente: gira o topo.' },
          { m: "R'", fala: 'Volto o lugar onde ela vai entrar.' },
          { m: "U'", fala: 'Formou o parzinho! Jogo o parzinho lá pra trás.' },
          { m: "F'", fala: 'Giro a fachada do prédio, subindo o espaço vazio.' },
          { m: "U", fala: 'Volto o parzinho pra frente.' },
          { m: "F", fala: 'E volto o trio pra base. A peça saiu e foi para o topo!' },
          { m: 'U2', fala: 'Gira o topo até a cor da frente bater com o centro: formou o T.' },
          { m: "U", fala: 'Jogo pro lado oposto: gira o topo para a esquerda.' },
          { m: "R", fala: 'Subo o lugar onde ela vai entrar: a direita sobe.' },
          { m: "U'", fala: 'Volto pra frente: gira o topo.' },
          { m: "R'", fala: 'Volto o lugar onde ela vai entrar.' },
          { m: "U'", fala: 'Formou o parzinho! Jogo o parzinho lá pra trás.' },
          { m: "F'", fala: 'Giro a fachada do prédio, subindo o espaço vazio.' },
          { m: "U", fala: 'Volto o parzinho pra frente.' },
          { m: "F", fala: 'E volto o trio pra base.' },
        ],
      },
    ],
  },
];

/** os passos que ainda vão chegar, só para a trilha */
export const PROXIMOS: { n: number; titulo: string; cor: Passo['cor'] }[] = [
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
  { n: 0, titulo: 'Conheça o cubo', cor: 'yellow' as Passo['cor'], pronto: true },
  ...PASSOS.map(p => ({ n: p.n, titulo: p.titulo, cor: p.cor, pronto: true })),
  ...PROXIMOS.map(p => ({ ...p, pronto: false })),
];

/** o cubo do começo da demonstração do passo */
export function demoInicio(p: Passo): CubeState {
  if (p.demo.inicio) return applyAlg(amareloEmCima(), p.demo.inicio);
  return applyAlg(p.fim(), invertAlg(p.demo.partes.flatMap(x => x.m.split(' '))));
}
